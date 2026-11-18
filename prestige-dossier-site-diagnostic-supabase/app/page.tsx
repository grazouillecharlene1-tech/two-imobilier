"use client";
import { useState } from "react";

export default function Home() {
  const [title, setTitle] = useState("");
  const [reference, setReference] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [shareUrl, setShareUrl] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setShareUrl("");
    if (!title.trim()) return setError("Veuillez renseigner l’intitulé du programme ou de la villa.");
    if (!file) return setError("Veuillez sélectionner une archive ZIP.");
    if (!file.name.toLowerCase().endsWith(".zip")) return setError("Seuls les fichiers ZIP sont acceptés.");
    setBusy(true);
    try {
      const body = new FormData();
      body.append("title", title.trim());
      body.append("reference", reference.trim());
      body.append("archive", file);
      const response = await fetch("/api/upload", { method: "POST", body });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "L’envoi a échoué.");
      setShareUrl(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
    } finally { setBusy(false); }
  }

  return <main>
    <header className="nav">
      <a className="brand" href="/"><span className="brandIcon">🏡</span><span><b>Prestige<br/>Bâtiment &<br/>Immobilier</b><small>CONSTRUCTION &<br/>ARCHITECTURE</small></span></a>
      <nav><a href="#realisations">Nos<br/>Réalisations</a><a href="#villas">Villas<br/>de Luxe</a><a href="#contact">Contact</a></nav>
    </header>
    <section className="hero">
      <div className="heroContent">
        <span className="eyebrow">IMMOBILIER & CONSTRUCTION HAUT DE STANDING</span>
        <h1>Donnez vie à<br/>vos projets<br/>architecturaux<br/>d’exception</h1>
        <p>Spécialistes de la conception de villas modernes, résidences de prestige et gros œuvre. Transmettez votre dossier technique ci-dessous pour validation par notre bureau d’étude.</p>
        <a className="heroButton" href="#dossier">Soumettre un dossier <span>↓</span></a>
      </div>
    </section>
    <section className="uploadSection" id="dossier">
      <form className="uploadCard" onSubmit={submit}>
        <div className="formHeading"><span>📋</span><div><h2>Soumettre un dossier<br/>technique / plan</h2><p>Transmettez votre archive de projet pour simulation et étude technique par nos ingénieurs.</p></div></div>
        <div className="fields">
          <label>Intitulé du programme / Villa *<input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Ex : Résidence Horizon" required maxLength={120}/></label>
          <label>Code référence (optionnel)<input value={reference} onChange={e=>setReference(e.target.value)} placeholder="ex : ref-horizon-01" maxLength={80}/></label>
        </div>
        <label className="dropzone"><span className="folder">📁</span><strong>{file ? file.name : "Sélectionnez l’archive du dossier (ZIP)"}</strong><span className="fileHint">Fichier ZIP uniquement · 25 Mo maximum</span><span className="fileButton">Choisir le fichier</span><input type="file" accept=".zip,application/zip" onChange={e=>setFile(e.target.files?.[0] || null)}/></label>
        {error && <p className="error">{error}</p>}
        <button className="submit" disabled={busy}>{busy ? "Envoi et vérification en cours…" : "🔎  Lancer l’étude et générer le rapport"}</button>
        {shareUrl && <div className="success"><b>Votre lien de dossier est prêt.</b><p>Conservez ce lien pour retrouver les fichiers envoyés.</p><a href={shareUrl}>{shareUrl}</a><button type="button" className="copy" onClick={()=>navigator.clipboard.writeText(shareUrl)}>Copier le lien</button></div>}
        <p className="privacy">Les archives sont stockées de manière privée. Toute personne disposant du lien individuel peut consulter la liste des fichiers et télécharger l’archive.</p>
      </form>
    </section>
    <footer id="contact"><b>Prestige Bâtiment & Immobilier</b><span>Construction & Architecture · Étude de dossiers techniques</span></footer>
  </main>;
}
