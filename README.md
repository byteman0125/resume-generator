# Resume Builder

A Next.js resume builder with live preview and PDF export.

## Run locally

```bash
# Install dependencies (use npm or pnpm)
npm install
# or: pnpm install

# Start development server (changes show right away with hot reload)
npm run dev
# or: pnpm dev
```

Then open [http://localhost:3000](http://localhost:3000). Edit any file and save — the app updates in the browser automatically. The home page is **Job applications**: track applications with date, company, title, job URL, which resume profile you used, and the resume file name (e.g. `profile_company_title_date.pdf`).

## Scripts

- `npm run dev` – start dev server
- `npm run build` – production build
- `npm run start` – run production server
- `npm run lint` – run ESLint

## Features

- **Multiple profiles** – Stored in local JSON files (`data/profiles.json`). Switch between profiles from the navbar; create, rename, and delete from the Profile page.
- Edit profile (name, title, contact, summary, photo URL)
- Add / edit / remove experience, education, and skills
- Live preview
- Preview in modal and download as PDF
