import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Permite que Next.js compile archivos de @warengine/contracts,
  // instalado localmente desde Shared/contracts/.
  transpilePackages: ["@warengine/contracts"],
};

export default nextConfig;
