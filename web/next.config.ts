import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    // Explicitly set the root so Turbopack doesn't pick up a stray
    // package-lock.json higher up in the filesystem (e.g. C:\Users\krish\)
    // and resolve modules from the wrong directory.
    root: __dirname,
  },
};

export default nextConfig;
