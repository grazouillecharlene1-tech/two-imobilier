# Prestige Bâtiment & Immobilier — site de dépôt ZIP

Site Next.js reprenant la structure des captures : en-tête, présentation immobilière, formulaire de dossier, génération d’un lien individuel `/view/<id>` et page de consultation du contenu de l’archive.

## Fonctionnement
- L'utilisateur indique le nom du projet et, facultativement, une référence.
- Il envoie une archive ZIP (25 Mo maximum).
- Le serveur vérifie l'archive, limite le nombre de fichiers et la taille décompressée, puis stocke le ZIP dans un bucket privé Supabase.
- Une URL aléatoire est créée, par exemple `https://votre-domaine.com/view/1a2b3c4d5e`.
- La page de partage affiche le nom du projet et la liste des fichiers, puis permet de télécharger le ZIP original.

**À savoir :** ce modèle ne décompresse pas les fichiers dans un dossier public. Il affiche un inventaire sûr et propose le téléchargement de l'archive originale. Le lien est un lien de partage : toute personne qui le possède peut consulter le dossier.

## Installation locale
Prérequis : Node.js 20+ et un projet Supabase.
```bash
npm install
copy .env.example .env.local
npm run dev
```
Renseigner les variables dans `.env.local` :
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY` (secret serveur uniquement, ne jamais mettre cette clé dans le navigateur)
- `NEXT_PUBLIC_SITE_URL` (ex. `http://localhost:3000` en local)

Dans Supabase > SQL Editor, exécuter le contenu de `supabase.sql`.

## Déploiement
1. Créer un dépôt GitHub et y envoyer les fichiers du projet.
2. Importer ce dépôt dans Vercel.
3. Ajouter les trois variables d'environnement dans Vercel.
4. Exécuter `supabase.sql` dans le projet Supabase.
5. Déployer, puis définir `NEXT_PUBLIC_SITE_URL` sur le domaine final et redéployer.

## Sécurité et limites
- ZIP uniquement, 25 Mo maximum, 500 fichiers maximum et 150 Mo décompressés maximum.
- Les chemins `..` sont neutralisés pour l'affichage.
- Le bucket est privé et les téléchargements utilisent une URL signée de courte durée.
- Le lien de consultation est non devinable mais non protégé par mot de passe. Ne téléversez pas de documents sensibles sans ajouter une authentification, une expiration et des contrôles anti-abus.
- Pour une mise en production ouverte au public, ajoutez CAPTCHA, limitation de débit, journalisation, politique de rétention/suppression et analyse antivirus côté serveur.
