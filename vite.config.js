import { execSync } from 'node:child_process'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

const basePath = process.env.VITE_BASE_PATH || '/'

const getGitValue = (command, fallback) => {
  try {
    return execSync(command, { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim() || fallback
  } catch {
    return fallback
  }
}

const gitBuildNumber = getGitValue('git log -1 --format=%cd --date=format:%Y%m%d%H%M HEAD', '000000000000')
const gitRevision = getGitValue('git rev-parse --short HEAD', 'local')
const appBuild = process.env.APP_BUILD || gitBuildNumber
const appRevision = process.env.APP_REVISION || gitRevision

export default defineConfig({
  base: basePath,
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
  },
  preview: {
    host: '0.0.0.0',
    port: 4173,
    strictPort: true,
  },
  define: {
    __APP_BUILD__: JSON.stringify(appBuild),
    __APP_REVISION__: JSON.stringify(appRevision),
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version || "0.0.0"),
  },
  build: {
    target: "es2020",
    cssCodeSplit: true,
    modulePreload: {
      polyfill: false,
    },
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules/react") || id.includes("node_modules/react-dom") || id.includes("node_modules/react-router-dom")) {
            return "react";
          }
          if (id.includes("node_modules/zustand")) {
            return "state";
          }
          return undefined;
        },
      },
    },
  },
  plugins: [
    react(),
    tailwindcss(),

    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: null,
      manifestFilename: 'manifest-v3.webmanifest',
      workbox: {
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        globPatterns: ["**/*.{js,css,html,ico,png,svg,webmanifest,woff,woff2,ttf,eot}"],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => /icon-.*\.png$/i.test(url.pathname),
            handler: "CacheFirst",
            options: {
              cacheName: "icons-cache",
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
            },
          },
          {
            urlPattern: ({ request }) => request.destination === "script" || request.destination === "style",
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "assets-cache",
            },
          },
          {
            urlPattern: ({ request }) => request.destination === "font",
            handler: "CacheFirst",
            options: {
              cacheName: "fonts-cache",
              expiration: {
                maxEntries: 40,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
            },
          },
          {
            urlPattern: ({ url, request }) =>
              request.method === "GET" &&
              (url.pathname.startsWith("/api/") ||
                url.pathname.includes("aviationstack") ||
                url.hostname.includes("aviationstack.com")),
            handler: "NetworkFirst",
            options: {
              cacheName: "api-cache",
              networkTimeoutSeconds: 5,
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 12,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: ({ request }) => request.destination === "image",
            handler: "CacheFirst",
            options: {
              cacheName: "images-cache",
              expiration: {
                maxEntries: 120,
                maxAgeSeconds: 60 * 60 * 24 * 30,
              },
            },
          },
        ],
      },

      devOptions: {
        enabled: true,
      },

      manifest: {
        id: '/',
        name: 'TUI Aircraft Logbook',
        short_name: 'TUI Logbook',
        description: 'Aircraft movement logging app',
        theme_color: '#0f172a',
        background_color: '#0f172a',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        orientation: 'portrait',

        icons: [
          {
            src: 'icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },

          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'icon-192-maskable.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable',
          },
          {
            src: 'icon-512-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
    }),
  ],
})