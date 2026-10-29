/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  outputFileTracingIncludes: { "/api/**": ["./rulepacks/snapshots/**", "./samples/**"] },
};
export default nextConfig;
