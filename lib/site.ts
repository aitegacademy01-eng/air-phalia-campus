// Canonical public URL. Override with NEXT_PUBLIC_SITE_URL when a custom domain is attached.
const prod=process.env.VERCEL_PROJECT_PRODUCTION_URL;
export const SITE_URL=(process.env.NEXT_PUBLIC_SITE_URL||(prod?"https://"+prod:"http://localhost:3000")).replace(/\/$/,"");
