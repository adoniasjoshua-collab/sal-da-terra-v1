import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Revista Gamificada lessons are read from disk at request time (trail, player, dashboard, EBD roll call).
  outputFileTracingIncludes: {
    "/conhecimento/revista": ["./content/revista/licoes/*.json"],
    "/conhecimento/revista/*": ["./content/revista/licoes/*.json"],
    "/dashboard": ["./content/revista/licoes/*.json"],
    "/eventos/*": ["./content/revista/licoes/*.json"],
  },
};

export default nextConfig;
