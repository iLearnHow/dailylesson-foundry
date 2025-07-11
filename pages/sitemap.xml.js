import { getDayOfYear } from '../utils/dateUtils';

function generateSitemap() {
  const baseUrl = 'https://mynextlesson.com';
  const currentDate = new Date();
  const currentDayOfYear = getDayOfYear(currentDate);
  
  // Static pages
  const staticPages = [
    '',
    '/about',
    '/how-it-works',
    '/admin/monitor',
    '/advanced-lesson'
  ];
  
  // Generate URLs for all 365 days
  const dailyPages = [];
  for (let day = 1; day <= 365; day++) {
    const date = new Date(2025, 0, day); // January 1st + day offset
    const dateString = date.toISOString().split('T')[0];
    const formattedDate = dateString.replace(/-/g, '');
    
    // Main daily lesson page
    dailyPages.push(`/daily-lesson/${formattedDate}`);
    
    // Age-specific pages
    const ages = [8, 12, 16, 25, 35, 45, 55, 65, 75];
    const tones = ['fun', 'grandmother', 'neutral'];
    
    for (const age of ages) {
      for (const tone of tones) {
        dailyPages.push(`/daily-lesson/${formattedDate}?age=${age}&tone=${tone}`);
      }
    }
  }
  
  const allUrls = [...staticPages, ...dailyPages];
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${allUrls.map(url => `
  <url>
    <loc>${baseUrl}${url}</loc>
    <lastmod>${currentDate.toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>${url === '' ? '1.0' : url.includes('/daily-lesson/') ? '0.9' : '0.8'}</priority>
  </url>`).join('')}
</urlset>`;
}

export default function Sitemap() {
  return null;
}

export async function getServerSideProps({ res }) {
  const sitemap = generateSitemap();
  
  res.setHeader('Content-Type', 'text/xml');
  res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate');
  res.write(sitemap);
  res.end();
  
  return {
    props: {},
  };
} 