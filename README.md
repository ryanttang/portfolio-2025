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
2. **Run the development server:**
   ```bash
   npm run dev
   ```
   The app will start on [http://localhost:3000](http://localhost:3000) or the next available port.

## Deployment
- **Recommended:** Deploy to [Vercel](https://vercel.com/) or [Netlify](https://www.netlify.com/) for best results.
- **Production build:**
   ```bash
   npm run build
   npm start
   ```
- All assets are local; no backend or database required.

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
