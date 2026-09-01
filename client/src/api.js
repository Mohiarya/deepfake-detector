// VITE_API_BASE_URL is set at build time (see .env.production). Falls
// back to localhost so local `npm run dev` needs no setup.
export const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";
