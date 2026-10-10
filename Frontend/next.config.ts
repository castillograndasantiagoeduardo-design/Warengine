import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Permite que Next.js compile archivos de @warengine/contracts,
  // que viven fuera de la carpeta Frontend/ (en Shared/contracts/src/).
  transpilePackages: ["@warengine/contracts"],

  // Soporte para Turbopack (por defecto en Next.js 16)
  turbopack: {
    resolveAlias: {
      "@warengine/contracts": path.resolve(
        __dirname,
        "../Shared/contracts/src/index.ts"
      ),
    },
  },

  // Resuelve el alias de TypeScript en tiempo de compilación de webpack.
  webpack(config) {
    config.resolve.alias = {
      ...config.resolve.alias,
      "@warengine/contracts": path.resolve(
        __dirname,
        "../Shared/contracts/src/index.ts"
      ),
    };
    return config;
  },
};

export default nextConfig;
