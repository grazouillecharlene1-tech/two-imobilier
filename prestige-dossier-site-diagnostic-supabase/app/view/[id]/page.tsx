import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
type Item = { name: string; size: number };
export default async function ViewDossier({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[a-f0-9]{10}$/.test(id)) notFound();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) notFound();
  const db = createClient(url, key, { auth: { persistSession: false } });
  const { data } = await db.from("dossiers").select("*").eq("id", id).maybeSingle();
  if (!data) notFound();
  const { data: signed } = await db.storage.from("dossiers").createSignedUrl(data.storage_path, 60 * 10);
  const files = (data.manifest || []) as Item[];
  const fmt = (n: number) => n < 1024 ? `${n} o` : n < 1024*1024 ? `${(n/1024).toFixed(1)} Ko` : `${(n/1024/1024).toFixed(2)} Mo`;
  return <main className="viewPage">
    <header className="nav"><a className="brand" href="/"><span className="brandIcon">🏡</span><span><b>Prestige<br/>Bâtiment &<br/>Immobilier</b><small>CONSTRUCTION &<br/>ARCHITECTURE</small></span></a><a className="backHome" href="/">Accueil</a></header>
    <section className="viewCard">
      <div className="viewIcon">📂</div><span className="eyebrow">DOSSIER TECHNIQUE TRANSMIS</span>
      <h1>{data.title}</h1>
      {data.reference && <p className="ref">Référence : {data.reference}</p>}
      <div className="stats"><span><b>{files.length}</b> fichier(s)</span><span><b>{new Date(data.created_at).toLocaleDateString("fr-FR")}</b> date d’envoi</span></div>
      <h2>Contenu de l’archive</h2>
      <ul className="fileList">{files.map((f,i)=><li key={i}><span>📄 {f.name}</span><small>{fmt(f.size)}</small></li>)}</ul>
      {signed?.signedUrl ? <a className="download" href={signed.signedUrl}>⬇ Télécharger l’archive ZIP</a> : <p className="error">Le téléchargement est momentanément indisponible.</p>}
      <p className="privacy">Lien privé à partager uniquement avec les personnes autorisées. Le lien permet d’accéder aux informations de ce dossier.</p>
    </section>
    <footer><b>Prestige Bâtiment & Immobilier</b><span>Construction & Architecture</span></footer>
  </main>;
}
