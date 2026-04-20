# HydroScope — Pakistan Water Intelligence Dashboard

A React + Vite application for analyzing Pakistan's water resources and hydrological data.

## Setup

### Prerequisites
- Node.js 14+ (with npm)
- All required dependencies listed in `package.json`

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Ensure assets are in place:**
   The app requires these files in the `public/assets/` or `src/assets/` folder:
   - `HydroScopeCollection.json` - Hydrological data for regions
   - `Map_of_Pakistan_(2018).svg` - Pakistan map SVG
   - Optional: `favicon.ico`

   Place them in the **public** folder (created when you first run Vite) or the **src/assets** folder.

## Development

Start the development server:
```bash
npm run dev
```

The app will open at `http://localhost:3000` (or the next available port).

## Building for Production

Create an optimized production build:
```bash
npm run build
```

The built files will be in the `dist/` folder. These can be deployed to any static hosting service.

## Project Structure

```
src/
├── index.html          # HTML entry point
├── app.jsx             # Main React application
├── style-main.css      # Styles
└── assets/             # Place JSON data and SVG map here

public/
└── assets/             # Static assets (created automatically)
    ├── HydroScopeCollection.json
    ├── Map_of_Pakistan_(2018).svg
    └── favicon.ico

dist/                   # Production build output (generated)
```

## Features

- Interactive Pakistan map with water resource data
- Zone/region selection with detailed analytics
- Water scarcity and flood risk assessment
- Hydrological metrics and statistics
- Responsive design for all devices

## Deploying on Any Device

Once built with `npm run build`:

1. Copy the `dist/` folder to your hosting server
2. All dependencies are bundled in the JavaScript files
3. Static assets must be served from the `/assets/` path
4. Serve `dist/index.html` as the entry point
5. Configure your server to handle single-page app routing (serve `index.html` for all unmatched routes)

## Technology Stack

- **React 18** - UI framework
- **Vite 5** - Build tool and dev server
- **CSS3** - Styling (with Grid and Flexbox)

## Notes

- The `style-main.css` and `app.jsx` files are bundled by Vite during the build process
- All CDN dependencies have been replaced with npm modules for better control and shipping
- The app uses Vite's fast HMR (Hot Module Replacement) for development
