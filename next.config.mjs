/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    '@fullcalendar/common',
    '@fullcalendar/core',
    '@fullcalendar/react',
    '@fullcalendar/daygrid',
    '@fullcalendar/timegrid',
    '@fullcalendar/interaction',
  ],
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
