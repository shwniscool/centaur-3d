/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === "production";
const repo = "centaur-3d";

const nextConfig = {
  reactStrictMode: true,
  output: "export",
  images: { unoptimized: true },
  basePath: isProd ? `/${repo}` : "",
  assetPrefix: isProd ? `/${repo}/` : "",
  trailingSlash: true,
};
module.exports = nextConfig;
