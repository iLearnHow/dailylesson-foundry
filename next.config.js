/** @type {import('next').NextConfig} */
const nextConfig = {
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  exportPathMap: async function(defaultPathMap) {
    return {
      '/': { page: '/' },
      '/advanced-lesson': { page: '/advanced-lesson' },
      '/admin/monitor': { page: '/admin/monitor' },
      '/learn-more-about-lessons': { page: '/learn-more-about-lessons' },
      '/about': { page: '/about' }
    };
  }
}

module.exports = nextConfig 