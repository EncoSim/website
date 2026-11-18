# Encosim Web Interface

Web interface for Encosim, a TTRPG encounter simulator and balancer

## Builds and Environments

Vite modes select the matching `.env.<mode>` file:

- `npm run dev` — run a development server with a local API (`.env.dev`).
- `npm run dev:staging` — run a development server on the host (`.env.staging`).
- `npm run build` — create a production build (`.env.production`).
- `npm run build:staging` — create a staging build (`.env.staging`).

Copy `.env.example` and fill in the necessary variables
