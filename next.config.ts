import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Revista Gamificada lessons are read from disk at request time.
  outputFileTracingIncludes: {
    "/conhecimento/revista": ["./content/revista/licoes/*.json"],
    "/conhecimento/revista/*": ["./content/revista/licoes/*.json"],
  },
};

export default nextConfig;
