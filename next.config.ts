import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  /* config options here */
  reactStrictMode: false,
  async redirects() {
    return [
      // Anciens liens de la première version HTML (monofichier) :
      // ils redirigent désormais vers l'app Next.js Atelya.
      { source: "/download/atelier-coupe.html", destination: "/", permanent: true },
      { source: "/download/atelier-coupe", destination: "/", permanent: true },
      { source: "/atelier-coupe.html", destination: "/", permanent: true },
      { source: "/download", destination: "/", permanent: true },
    ];
  },
};

export default nextConfig;
