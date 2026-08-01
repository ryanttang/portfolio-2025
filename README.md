# Ryan Tang Portfolio

A modern, interactive portfolio site built with Next.js, React, TypeScript, Tailwind CSS, Three.js, Framer Motion, Lottie, and Vanta.js. Inspired by salcosta.dev and ryantang.site, with a focus on digital marketing, creative direction, and web development.

## Features
- **Modal-Driven Navigation:** All main sections (About, Design, Development, Retail & Ecommerce) open as animated modals, with direct route support (e.g. `/about`, `/design`).
- **3D Animated Hero:** Interactive morphing orb (About Me), Vanta.js animated background (RINGS), and bold, modern-retro typography.
- **Design Gallery:** Responsive, scrollable masonry gallery with image enlargement modal, using assets from `public/DesignAssets`.
- **Development & Retail Modals:** Dedicated modals for Development (with project links/screenshots) and Retail & Ecommerce (with client/personal links).
- **Games & Demos:** Playable browser-based Pong and Tetris games, with a floating circular Tetris button for instant access.
- **Minimalist Navigation:** Sticky header with minimalist hamburger menu (Email Me, Resume download).
- **Section Reveal Animations:** Uses Intersection Observer and Framer Motion for smooth section transitions.
- **Mobile Responsive:** Fully responsive, touch-friendly design.

## Tech Stack
- [Next.js 15](https://nextjs.org/)
- [React 19](https://react.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS 4](https://tailwindcss.com/)
- [Three.js](https://threejs.org/)
- [Framer Motion](https://www.framer.com/motion/)
- [Lottie](https://airbnb.io/lottie/)
- [Vanta.js](https://www.vantajs.com/)

## Getting Started
1. **Install dependencies:**
   ```bash
   npm install
   ```
2. **Copy env and start local Postgres:**
   ```bash
   cp .env.example .env.local
   docker compose up -d
   npm run db:push   # or apply drizzle/*.sql
   npm run db:seed
   ```
   Local DB listens on host port **55432** (avoids conflicts with other Postgres installs). Default admin: `admin@ryantang.site` / `changeme` (override via `ADMIN_EMAIL` / `ADMIN_PASSWORD`).
3. **Run the development server:**
   ```bash
   npm run dev
   ```
   Public site: [http://localhost:3000](http://localhost:3000) · Admin: [http://localhost:3000/admin](http://localhost:3000/admin)

## Admin dashboard
Solo-admin tools at `/admin` (Auth.js credentials):

| Area | Path | Notes |
|------|------|--------|
| Overview / Traffic / Content / Settings | `/admin/*` | CMS JSON editors, first-party pageviews |
| CRM | `/admin/crm` | Clients, notes, activity timeline |
| Onboarding | `/admin/onboarding` | Intake wizard config, questionnaires, portal invites |
| Inbox | `/admin/inbox` | Resend send + inbound webhook |
| Contracts | `/admin/contracts` | Create/send; public sign at `/sign/[token]` |
| Invoices | `/admin/invoices` | PDF email + PayPal pay page `/pay/[token]` |

Client portal (magic-link invite → set password → `/portal`): onboarding wizard, milestones, updates, agreements & invoices.

### Neon
When your Neon database is ready, set `DATABASE_URL` to the Neon connection string (add `?sslmode=require`). Same Drizzle schema and migrations apply—no code changes.

### Resend inbound (receive email)
1. Verify sending domain and set `RESEND_FROM_EMAIL`.
2. Configure Resend inbound MX (or use a `*.resend.app` address for testing).
3. Webhook URL: `https://your-domain/api/webhooks/resend` for `email.received`.
4. Set `RESEND_WEBHOOK_SECRET` from the Resend dashboard.

### PayPal
Sandbox: set `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_MODE=sandbox`. Webhook: `/api/webhooks/paypal`. Invoices can still be marked paid manually.

### Contract signing cert (optional locally)
Set `AGREEMENT_SIGNING_ENABLED=true` and provide PKCS#12 via `AGREEMENT_SIGNING_P12_BASE64` + passphrase. Without a cert, PDFs are still generated and stored; cryptographic seal is skipped.

## Deployment
- **Recommended:** [Vercel](https://vercel.com/) with Neon Postgres + Vercel Blob + Resend env vars.
- **Production build:**
   ```bash
   npm run build
   npm start
   ```

## Current Snapshot
- Modal-driven About, Design, Development, and Retail modals
- Floating About orb with animated glow and tooltip
- Masonry design gallery with image modal
- Circular floating Tetris button (bottom right)
- Minimalist hamburger menu (Email, Resume)
- Fully responsive, modern-retro design
- No known blocking issues for deployment

---

© 2024 Ryan Tang. All rights reserved.
