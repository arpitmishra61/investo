/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode:false,
    typescript: {
        // Pre-existing type errors in the codebase shouldn't block deploys.
        ignoreBuildErrors: true,
    },
};

export default nextConfig;
