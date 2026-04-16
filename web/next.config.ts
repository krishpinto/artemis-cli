import type { NextConfig } from "next";
import { readFileSync } from "fs";
import { resolve } from "path";

// Read the version from the CLI's package.json (one level up from web/).
// This way the sidebar always shows the real published version automatically.
const { version } = JSON.parse(readFileSync(resolve(__dirname, "../package.json"), "utf8"));

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_VERSION: version,
  },
  turbopack: {
    // Explicitly set the root so Turbopack doesn't pick up a stray
    // package-lock.json higher up in the filesystem (e.g. C:\Users\krish\)
    // and resolve modules from the wrong directory.
    root: __dirname,
  },
};

export default nextConfig;
