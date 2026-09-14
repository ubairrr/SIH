import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Next.js 16's dev/build server otherwise auto-appends an "agent rules"
  // block to the project's CLAUDE.md on every run — this repo's CLAUDE.md
  // carries mandatory git-attribution/push rules and should not be mutated
  // by the framework.
  agentRules: false,
};

export default nextConfig;
