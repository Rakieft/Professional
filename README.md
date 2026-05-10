# WebFy

WebFy est maintenant organise comme une base de projet plus reelle:

- une vitrine marketing publique
- un dashboard staff
- une API Node.js avec Express
- une structure MySQL pour stocker les donnees metier

## Etat actuel

Le projet contient deja:

- page d'accueil premium
- pages internes harmonisees
- `staff.html` relie a une API `/api/dashboard/overview`
- serveur `Express` dans `server.js`
- configuration de connexion MySQL
- schema SQL et seed SQL
- formulaires marketing toujours presents cote vitrine
- espace staff avec roles, finance, notifications et analytics CEO

Le dashboard peut fonctionner en mode secours tant que la base n'est pas configuree.

## Structure

```text
Professional/
|- .env.example
|- .gitignore
|- about.html
|- contact.html
|- index.html
|- mentions-legales.html
|- package.json
|- portfolio.html
|- README.md
|- robots.txt
|- server.js
|- services.html
|- sitemap.xml
|- staff.html
|- tarifs.html
|- assset/
|  |- css/
|  |- favicon/
|- database/
|  |- schema.sql
|  |- seed.sql
|- image/
|- js/
|  |- contact.js
|  |- index.js
|  |- portfolio.js
|  |- service.js
|  |- staff.js
|- server/
   |- config/
   |  |- db.js
   |- controllers/
   |- middleware/
   |- routes/
   |- scripts/
```

## API actuelle

Routes deja preparees:

- `GET /health`
- `GET /api/health`
- `GET /api/dashboard/overview`
- `GET /api/projects`
- `GET /api/leads`

## Base de donnees MySQL

Le schema prevoit deja des tables utiles pour une vraie organisation:

- `roles`
- `users`
- `clients`
- `services`
- `projects`
- `tasks`
- `leads`
- `content_calendar`
- `activity_logs`
- `quotes`
- `invoices`
- `payment_records`
- `notifications`
- `task_comments`
- `task_files`

Le schema est dans [database/schema.sql](C:/Users/kieft/Documents/Codex/2026-05-08/j-ai-un-projet-dans-c/Professional/database/schema.sql) et les donnees de demo dans [database/seed.sql](C:/Users/kieft/Documents/Codex/2026-05-08/j-ai-un-projet-dans-c/Professional/database/seed.sql).

## Installation

1. Copier `.env.example` vers `.env`
2. Remplir vos identifiants MySQL
3. Installer les dependances:

```bash
npm install
```

4. Creer la base et les tables:

```bash
npm run db:schema
```

5. Charger les donnees de demo:

```bash
npm run db:seed
```

6. Demarrer le serveur:

```bash
npm run dev
```

Le site sera alors disponible sur `http://localhost:5000`.

## Preparation lancement

Avant un vrai lancement, gardez cette checklist:

- definir un `SESSION_SECRET` fort et unique
- passer `NODE_ENV=production`
- servir le site derriere HTTPS
- sauvegarder la base MySQL regulierement
- verifier les comptes staff, mots de passe et permissions
- remplir les vraies informations de devis, factures et paiements

## Limites actuelles

Ce qui manque encore pour une vraie version production:

- mot de passe MySQL et creation effective de la base locale
- authentification staff
- creation et modification de donnees via formulaires API
- gestion des roles et permissions
- liaison des formulaires marketing vers la base
- CRUD complet clients, projets, taches et contenu

## Recommandation

La meilleure suite immediate est:

1. connecter vraiment MySQL avec vos identifiants
2. installer les dependances Node
3. lancer l'API localement
4. transformer ensuite le dashboard en vrai espace de travail avec authentification

## Roles d'entreprise deja prevus

Le seed initialise une base de roles plus realiste pour WebFy:

- `admin`
- `ceo`
- `operations_manager`
- `project_manager`
- `account_manager`
- `frontend_developer`
- `backend_developer`
- `ui_designer`
- `brand_designer`
- `content_creator`
- `social_media_manager`
- `sales_manager`
- `support_manager`

## Prochaine etape logique

Je vous recommande ensuite ce chantier:

1. page de login staff
2. creation d'utilisateur admin
3. formulaire de creation client
4. formulaire de creation projet
5. tableau de taches connecte a la base

Si vous voulez, la prochaine etape que je peux faire maintenant est de preparer l'authentification staff et les formulaires CRUD de base.
