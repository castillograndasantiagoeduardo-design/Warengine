import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Permite que Next.js compile archivos de @warengine/contracts,
  // instalado localmente desde Shared/contracts/.
  transpilePackages: ["@warengine/contracts"],
};

export default nextConfig;
