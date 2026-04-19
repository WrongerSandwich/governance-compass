import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/archetypes/pragmatic-centrist",
        destination: "/archetypes#institutional-moderate",
        permanent: true,
      },
      {
        source: "/archetypes/civic-institutionalist",
        destination: "/archetypes#institutional-moderate",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
