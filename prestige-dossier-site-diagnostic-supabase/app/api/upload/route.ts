import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import JSZip from "jszip";
import { randomBytes } from "crypto";

export const runtime = "nodejs";
const MAX_BYTES = 25 * 1024 * 1024;
const MAX_FILES = 500;
const MAX_UNCOMPRESSED = 150 * 1024 * 1024;

function safeName(name: string) {
  return name.replace(/\\/g, "/").split("/").filter(part => part && part !== "." && part !== "..").join("/");
}

export async function POST(request: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    return NextResponse.json({ error: "Stockage non configuré : vérifiez NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY dans Vercel." }, { status: 503 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Formulaire d'envoi illisible. Réessayez avec un fichier ZIP." }, { status: 400 });
  }

  const title = String(form.get("title") || "").trim();
  const reference = String(form.get("reference") || "").trim();
  const archive = form.get("archive");
  if (!title || title.length > 120) return NextResponse.json({ error: "Intitulé invalide." }, { status: 400 });
  if (!(archive instanceof File) || !archive.name.toLowerCase().endsWith(".zip")) return NextResponse.json({ error: "Veuillez envoyer un fichier ZIP." }, { status: 400 });
  if (archive.size < 1 || archive.size > MAX_BYTES) return NextResponse.json({ error: "L’archive doit faire moins de 25 Mo." }, { status: 413 });

  const bytes = Buffer.from(await archive.arrayBuffer());
  let zip: JSZip;
  try {
    zip = await JSZip.loadAsync(bytes, { checkCRC32: true });
  } catch (error) {
    console.warn("ZIP validation error:", error);
    return NextResponse.json({ error: "Archive ZIP invalide, endommagée ou chiffrée. Créez un nouveau ZIP sans mot de passe puis réessayez." }, { status: 400 });
  }

  const entries = Object.values(zip.files).filter(f => !f.dir);
  if (entries.length > MAX_FILES) return NextResponse.json({ error: "L’archive contient trop de fichiers (maximum 500)." }, { status: 400 });
  let total = 0;
  const manifest: { name: string; size: number }[] = [];
  try {
    for (const entry of entries) {
      const name = safeName(entry.name);
      if (!name) continue;
      const data = await entry.async("uint8array");
      total += data.byteLength;
      if (total > MAX_UNCOMPRESSED) return NextResponse.json({ error: "Le contenu décompressé dépasse la limite autorisée." }, { status: 400 });
      manifest.push({ name, size: data.byteLength });
    }
  } catch (error) {
    console.warn("ZIP entry extraction error:", error);
    return NextResponse.json({ error: "Un fichier de l’archive est illisible ou chiffré. Recréez le ZIP sans mot de passe." }, { status: 400 });
  }
  if (!manifest.length) return NextResponse.json({ error: "Cette archive ne contient aucun fichier exploitable." }, { status: 400 });

  const supabase = createClient(url, key, { auth: { persistSession: false } });
  const id = randomBytes(5).toString("hex");
  const path = `${id}/${Date.now()}-${archive.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
  const { error: uploadError } = await supabase.storage.from("dossiers").upload(path, bytes, { contentType: "application/zip", upsert: false });
  if (uploadError) {
    console.error("Supabase Storage upload error:", uploadError);
    return NextResponse.json({ error: `Échec du stockage Supabase : ${uploadError.message}. Vérifiez que le bucket privé « dossiers » existe.` }, { status: 502 });
  }

  const { error: dbError } = await supabase.from("dossiers").insert({
    id, title, reference: reference || null, storage_path: path, original_name: archive.name,
    file_count: manifest.length, manifest, created_at: new Date().toISOString()
  });
  if (dbError) {
    console.error("Supabase database insert error:", dbError);
    await supabase.storage.from("dossiers").remove([path]);
    return NextResponse.json({ error: `Fichier stocké, mais échec de l’enregistrement dans la table « dossiers » : ${dbError.message}. Vérifiez le script supabase.sql.` }, { status: 502 });
  }

  const site = process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin;
  return NextResponse.json({ id, url: `${site}/view/${id}` });
}
