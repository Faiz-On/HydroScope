# Vite Setup Configuration

This project is configured to use Vite as the build tool and development server.

## Project Structure for Vite

```
HydroScope/
├── src/
│   ├── index.html       ← Entry point (Vite processes this)
│   ├── app.jsx          ← React application (module)
│   └── style-main.css   ← Styles (imported by app or HTML)
│
├── public/
│   └── assets/          ← Static assets (served as-is)
│       ├── HydroScopeCollection.json
│       ├── Map_of_Pakistan_(2018).svg
│       ├── favicon.ico
│       └── ...
│
├── dist/                ← Build output (run: npm run build)
├── vite.config.js       ← Vite configuration
└── package.json         ← Dependencies and scripts
```

## How Vite Works

1. **Development (`npm run dev`):**
   - Vite serves `src/index.html` as the entry point
   - Hot Module Replacement (HMR) for instant updates
   - No bundling in dev mode (uses native ES modules)

2. **Production (`npm run build`):**
   - Vite bundles everything into `dist/`
   - Splits code optimally
   - Minifies CSS, JS, and HTML
   - Assets from `public/` are copied to `dist/`

3. **Asset Serving:**
   - Files in `public/assets/` are served at `/assets/` in both dev and production
   - In production, they're automatically copied to `dist/assets/`

## Quick Start

```bash
# Install dependencies
npm install

# Start dev server (localhost:3000)
npm run dev

# Build for production
npm run build

# Preview production build locally
npm preview
```

## Deployment Notes

1. **Static Hosting (Netlify, Vercel, GitHub Pages):**
   - Upload the `dist/` folder
   - Set root to `dist/`
   - No server-side configuration needed

2. **Traditional Server (Apache, Nginx):**
   - Copy `dist/` contents to web root
   - Ensure `/assets/` folder is accessible
   - Configure SPA fallback (serve `index.html` for 404s)

3. **Docker/Cloud:**
   - Build: `npm run build`
   - Copy `dist/` to server
   - Serve with any static file server

## Key Config Files

- **vite.config.js** - Build and server settings
- **package.json** - Dependencies and npm scripts
- **src/index.html** - HTML entry point (Vite transforms this)
- **.gitignore** - Excludes node_modules, dist, etc.
