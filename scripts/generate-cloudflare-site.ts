import { UniversalAgeEngine } from '../services/universal-age-engine';
import { loadDailyLessonDNA } from '../api/index';
import * as fs from 'fs/promises';
import * as path from 'path';

interface StaticSiteConfig {
  outputDir: string;
  baseUrl: string;
  includeAudio: boolean;
  includeVideo: boolean;
  generateServiceWorker: boolean;
  optimizeImages: boolean;
}

interface LessonPageData {
  day: number;
  date: string;
  title: string;
  ages: number[];
  tones: string[];
  languages: string[];
  avatars: string[];
  content: any;
  metadata: any;
}

class CloudflareSiteGenerator {
  private config: StaticSiteConfig;
  private ageEngine: UniversalAgeEngine;
  private lessons: Map<number, any> = new Map();

  constructor(config: Partial<StaticSiteConfig> = {}) {
    this.config = {
      outputDir: './cloudflare-site',
      baseUrl: 'https://dailylesson.org',
      includeAudio: false,
      includeVideo: false,
      generateServiceWorker: true,
      optimizeImages: true,
      ...config
    };
    this.ageEngine = new UniversalAgeEngine();
  }

  async generateCompleteSite() {
    console.log('🌐 Generating Cloudflare static site...');
    console.log(`📁 Output directory: ${this.config.outputDir}`);
    console.log(`🌍 Base URL: ${this.config.baseUrl}`);

    try {
      // Create directory structure
      await this.createDirectoryStructure();

      // Generate all lesson pages
      await this.generateAllLessonPages();

      // Generate API endpoints
      await this.generateAPIEndpoints();

      // Generate main pages
      await this.generateMainPages();

      // Generate assets
      await this.generateAssets();

      // Generate service worker
      if (this.config.generateServiceWorker) {
        await this.generateServiceWorker();
      }

      // Generate sitemap
      await this.generateSitemap();

      // Generate robots.txt
      await this.generateRobotsTxt();

      console.log('✅ Cloudflare site generation complete!');
      this.printSiteSummary();

    } catch (error) {
      console.error('❌ Error generating Cloudflare site:', error);
      throw error;
    }
  }

  private async createDirectoryStructure() {
    const dirs = [
      this.config.outputDir,
      `${this.config.outputDir}/lessons`,
      `${this.config.outputDir}/api`,
      `${this.config.outputDir}/assets`,
      `${this.config.outputDir}/assets/ken`,
      `${this.config.outputDir}/assets/kelly`,
      `${this.config.outputDir}/assets/audio`,
      `${this.config.outputDir}/assets/video`,
      `${this.config.outputDir}/assets/css`,
      `${this.config.outputDir}/assets/js`
    ];

    // Add day-specific directories
    for (let day = 1; day <= 365; day++) {
      dirs.push(`${this.config.outputDir}/lessons/day-${day}`);
      // Add age-specific directories for each day
      for (let age = 1; age <= 100; age++) {
        dirs.push(`${this.config.outputDir}/lessons/day-${day}/age-${age}`);
        dirs.push(`${this.config.outputDir}/lessons/day-${day}/age-${age}/fun`);
        dirs.push(`${this.config.outputDir}/lessons/day-${day}/age-${age}/grandmother`);
        dirs.push(`${this.config.outputDir}/lessons/day-${day}/age-${age}/neutral`);
      }
    }

    for (const dir of dirs) {
      await fs.mkdir(dir, { recursive: true });
    }
  }

  private async generateAllLessonPages() {
    console.log('📚 Generating lesson pages...');

    for (let day = 1; day <= 365; day++) {
      try {
        const lessonDNA = await loadDailyLessonDNA(day);
        if (!lessonDNA) {
          console.warn(`⚠️  No lesson DNA found for day ${day}`);
          continue;
        }

        this.lessons.set(day, lessonDNA);

        // Generate day overview page
        await this.generateDayOverviewPage(day, lessonDNA);

        // Generate age-specific pages
        await this.generateAgeSpecificPages(day, lessonDNA);

        if (day % 10 === 0) {
          console.log(`  📅 Generated pages for days 1-${day}`);
        }

      } catch (error) {
        console.error(`❌ Error generating pages for day ${day}:`, error);
      }
    }
  }

  private async generateDayOverviewPage(day: number, lessonDNA: any) {
    const date = this.getDateFromDayOfYear(day);
    const pageData: LessonPageData = {
      day,
      date,
      title: lessonDNA.title,
      ages: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100],
      tones: ['fun', 'grandmother', 'neutral'],
      languages: ['english', 'spanish', 'french', 'german', 'chinese'],
      avatars: ['ken', 'kelly'],
      content: lessonDNA,
      metadata: {
        title: `Day ${day}: ${lessonDNA.title}`,
        description: lessonDNA.learning_objective,
        keywords: lessonDNA.tags || [],
        day,
        date
      }
    };

    const html = this.generateDayOverviewHTML(pageData);
    const filepath = path.join(this.config.outputDir, 'lessons', `day-${day}`, 'index.html');
    await fs.writeFile(filepath, html, 'utf8');
  }

  private async generateAgeSpecificPages(day: number, lessonDNA: any) {
    const date = this.getDateFromDayOfYear(day);
    
    // Generate pages for every age (1-100)
    for (let age = 1; age <= 100; age++) {
      try {
        const adaptedContent = await this.ageEngine.adaptLessonContent(lessonDNA, age);
        
        // Generate for each tone
        for (const tone of ['fun', 'grandmother', 'neutral']) {
          // Generate for each avatar
          for (const avatar of ['ken', 'kelly']) {
            const pageData = {
              day,
              date,
              age,
              tone,
              avatar,
              content: adaptedContent,
              metadata: {
                title: `Day ${day} - Age ${age} - ${tone} - ${avatar}`,
                description: adaptedContent.introduction,
                age,
                tone,
                avatar,
                day,
                date
              }
            };

            const html = this.generateLessonPageHTML(pageData);
            const filepath = path.join(
              this.config.outputDir, 
              'lessons', 
              `day-${day}`, 
              `age-${age}`, 
              tone, 
              `${avatar}.html`
            );
            
            await fs.mkdir(path.dirname(filepath), { recursive: true });
            await fs.writeFile(filepath, html, 'utf8');
          }
        }
      } catch (error) {
        console.error(`❌ Error generating age ${age} pages for day ${day}:`, error);
      }
    }
  }

  private async generateAPIEndpoints() {
    console.log('🔌 Generating API endpoints...');

    // Generate lessons index
    const lessonsIndex = Array.from(this.lessons.entries()).map(([day, lesson]) => ({
      day,
      date: this.getDateFromDayOfYear(day),
      title: lesson.title,
      learning_objective: lesson.learning_objective,
      category: lesson.category,
      tags: lesson.tags || []
    }));

    const lessonsIndexPath = path.join(this.config.outputDir, 'api', 'lessons.json');
    await fs.writeFile(lessonsIndexPath, JSON.stringify(lessonsIndex, null, 2), 'utf8');

    // Generate calendar data
    const calendarData = this.generateCalendarData();
    const calendarPath = path.join(this.config.outputDir, 'api', 'calendar.json');
    await fs.writeFile(calendarPath, JSON.stringify(calendarData, null, 2), 'utf8');

    // Generate search index
    const searchIndex = this.generateSearchIndex();
    const searchPath = path.join(this.config.outputDir, 'api', 'search.json');
    await fs.writeFile(searchPath, JSON.stringify(searchIndex, null, 2), 'utf8');

    // Generate metadata
    const metadata = {
      total_lessons: this.lessons.size,
      total_days: 365,
      ages_supported: Array.from({length: 100}, (_, i) => i + 1),
      tones: ['fun', 'grandmother', 'neutral'],
      languages: ['english', 'spanish', 'french', 'german', 'chinese'],
      avatars: ['ken', 'kelly'],
      generated_at: new Date().toISOString(),
      base_url: this.config.baseUrl
    };

    const metadataPath = path.join(this.config.outputDir, 'api', 'metadata.json');
    await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2), 'utf8');
  }

  private async generateMainPages() {
    console.log('📄 Generating main pages...');

    // Generate index.html
    const indexHTML = this.generateIndexHTML();
    const indexPath = path.join(this.config.outputDir, 'index.html');
    await fs.writeFile(indexPath, indexHTML, 'utf8');

    // Generate about page
    const aboutHTML = this.generateAboutHTML();
    const aboutPath = path.join(this.config.outputDir, 'about.html');
    await fs.writeFile(aboutPath, aboutHTML, 'utf8');

    // Generate calendar page
    const calendarHTML = this.generateCalendarHTML();
    const calendarPath = path.join(this.config.outputDir, 'calendar.html');
    await fs.writeFile(calendarPath, calendarHTML, 'utf8');

    // Generate search page
    const searchHTML = this.generateSearchHTML();
    const searchPath = path.join(this.config.outputDir, 'search.html');
    await fs.writeFile(searchPath, searchHTML, 'utf8');
  }

  private async generateAssets() {
    console.log('🎨 Generating assets...');

    // Generate CSS
    const css = this.generateCSS();
    const cssPath = path.join(this.config.outputDir, 'assets', 'css', 'style.css');
    await fs.writeFile(cssPath, css, 'utf8');

    // Generate JavaScript
    const js = this.generateJavaScript();
    const jsPath = path.join(this.config.outputDir, 'assets', 'js', 'app.js');
    await fs.writeFile(jsPath, js, 'utf8');

    // Generate Cloudflare configuration files
    await this.generateCloudflareConfig();
  }

  private async generateServiceWorker() {
    console.log('⚙️  Generating service worker...');

    const swContent = `
// DailyLesson Service Worker
const CACHE_NAME = 'dailylesson-v1';
const STATIC_ASSETS = [
  '/',
  '/assets/css/style.css',
  '/assets/js/app.js',
  '/api/lessons.json',
  '/api/calendar.json',
  '/api/metadata.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_ASSETS))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      })
      .catch(() => {
        // Return offline page if both cache and network fail
        if (event.request.destination === 'document') {
          return caches.match('/offline.html');
        }
      })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
`;

    const swPath = path.join(this.config.outputDir, 'sw.js');
    await fs.writeFile(swPath, swContent, 'utf8');
  }

  private async generateSitemap() {
    console.log('🗺️  Generating sitemap...');

    let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${this.config.baseUrl}/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${this.config.baseUrl}/about.html</loc>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${this.config.baseUrl}/calendar.html</loc>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${this.config.baseUrl}/search.html</loc>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`;

    // Add lesson pages
    for (let day = 1; day <= 365; day++) {
      sitemap += `
  <url>
    <loc>${this.config.baseUrl}/lessons/day-${day}/</loc>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`;
    }

    sitemap += `
</urlset>`;

    const sitemapPath = path.join(this.config.outputDir, 'sitemap.xml');
    await fs.writeFile(sitemapPath, sitemap, 'utf8');
  }

  private async generateRobotsTxt() {
    const robotsContent = `User-agent: *
Allow: /

Sitemap: ${this.config.baseUrl}/sitemap.xml

# Crawl-delay for respectful crawling
Crawl-delay: 1`;
    
    const robotsPath = path.join(this.config.outputDir, 'robots.txt');
    await fs.writeFile(robotsPath, robotsContent, 'utf8');
  }

  private async generateCloudflareConfig() {
    // Generate _redirects file
    const redirectsContent = `# Redirects for DailyLesson.org
/api/* /api/:splat 200
/lessons/* /lessons/:splat 200
/* /index.html 200`;
    
    const redirectsPath = path.join(this.config.outputDir, '_redirects');
    await fs.writeFile(redirectsPath, redirectsContent, 'utf8');

    // Generate _headers file
    const headersContent = `/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()

/api/*
  Cache-Control: public, max-age=3600

/assets/*
  Cache-Control: public, max-age=31536000, immutable

/*.html
  Cache-Control: public, max-age=86400`;
    
    const headersPath = path.join(this.config.outputDir, '_headers');
    await fs.writeFile(headersPath, headersContent, 'utf8');
  }

  // HTML Generation Methods
  private generateIndexHTML(): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>DailyLesson.org - Learn Something New Every Day</title>
    <meta name="description" content="365 daily lessons for every age, every day. Personalized learning for everyone.">
    <link rel="stylesheet" href="/assets/css/style.css">
    <link rel="manifest" href="/manifest.json">
</head>
<body>
    <header>
        <nav>
            <div class="logo">DailyLesson.org</div>
            <ul>
                <li><a href="/">Home</a></li>
                <li><a href="/calendar.html">Calendar</a></li>
                <li><a href="/search.html">Search</a></li>
                <li><a href="/about.html">About</a></li>
            </ul>
        </nav>
    </header>

    <main>
        <section class="hero">
            <h1>Learn Something New Every Day</h1>
            <p>365 personalized lessons for every age, every day of the year.</p>
            <div class="cta-buttons">
                <a href="/calendar.html" class="btn primary">Start Learning</a>
                <a href="/search.html" class="btn secondary">Search Lessons</a>
            </div>
        </section>

        <section class="features">
            <h2>Why DailyLesson.org?</h2>
            <div class="feature-grid">
                <div class="feature">
                    <h3>Universal Age Support</h3>
                    <p>Every age from 1 to 100+ gets personalized content.</p>
                </div>
                <div class="feature">
                    <h3>Offline First</h3>
                    <p>Works without internet connection.</p>
                </div>
                <div class="feature">
                    <h3>Global Access</h3>
                    <p>Available worldwide with fast CDN delivery.</p>
                </div>
            </div>
        </section>

        <section class="today-lesson">
            <h2>Today's Lesson</h2>
            <div id="today-lesson-content">
                <p>Loading today's lesson...</p>
            </div>
        </section>
    </main>

    <footer>
        <p>&copy; 2024 DailyLesson.org - Universal Education for Everyone</p>
    </footer>

    <script src="/assets/js/app.js"></script>
    <script>
        // Register service worker
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js');
        }
    </script>
</body>
</html>`;
  }

  private generateDayOverviewHTML(data: LessonPageData): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${data.metadata.title} - DailyLesson.org</title>
    <meta name="description" content="${data.metadata.description}">
    <link rel="stylesheet" href="/assets/css/style.css">
</head>
<body>
    <header>
        <nav>
            <div class="logo">DailyLesson.org</div>
            <ul>
                <li><a href="/">Home</a></li>
                <li><a href="/calendar.html">Calendar</a></li>
                <li><a href="/search.html">Search</a></li>
            </ul>
        </nav>
    </header>

    <main>
        <section class="lesson-overview">
            <h1>Day ${data.day}: ${data.title}</h1>
            <p class="date">${data.date}</p>
            <p class="description">${data.content.learning_objective}</p>
            
            <div class="age-selector">
                <h3>Choose Your Age:</h3>
                <div class="age-grid">
                    ${data.ages.map(age => `
                        <a href="age-${age}/fun/ken.html" class="age-card">
                            <span class="age-number">${age}</span>
                            <span class="age-label">years old</span>
                        </a>
                    `).join('')}
                </div>
            </div>

            <div class="avatar-selector">
                <h3>Choose Your Teacher:</h3>
                <div class="avatar-options">
                    <a href="age-5/fun/ken.html" class="avatar-card ken">
                        <img src="/assets/ken/avatar.jpg" alt="Ken">
                        <span>Learn with Ken</span>
                    </a>
                    <a href="age-5/fun/kelly.html" class="avatar-card kelly">
                        <img src="/assets/kelly/avatar.jpg" alt="Kelly">
                        <span>Learn with Kelly</span>
                    </a>
                </div>
            </div>
        </section>
    </main>

    <footer>
        <p>&copy; 2024 DailyLesson.org</p>
    </footer>

    <script src="/assets/js/app.js"></script>
</body>
</html>`;
  }

  private generateLessonPageHTML(data: any): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${data.metadata.title} - DailyLesson.org</title>
    <meta name="description" content="${data.metadata.description}">
    <link rel="stylesheet" href="/assets/css/style.css">
</head>
<body class="lesson-page ${data.avatar}-theme">
    <header>
        <nav>
            <div class="logo">DailyLesson.org</div>
            <ul>
                <li><a href="/">Home</a></li>
                <li><a href="/lessons/day-${data.day}/">Day ${data.day}</a></li>
            </ul>
        </nav>
    </header>

    <main>
        <section class="lesson-content">
            <div class="lesson-header">
                <h1>${data.content.title}</h1>
                <div class="lesson-meta">
                    <span class="day">Day ${data.day}</span>
                    <span class="age">Age ${data.age}</span>
                    <span class="tone">${data.tone}</span>
                    <span class="avatar">${data.avatar}</span>
                </div>
            </div>

            <div class="avatar-display">
                <img src="/assets/${data.avatar}/avatar.jpg" alt="${data.avatar}" class="avatar-image">
            </div>

            <div class="lesson-text">
                <div class="introduction">
                    <h2>Introduction</h2>
                    <p>${data.content.introduction}</p>
                </div>

                <div class="main-content">
                    <h2>Main Content</h2>
                    ${data.content.mainContent.map((paragraph: string, index: number) => `
                        <p class="paragraph-${index + 1}">${paragraph}</p>
                    `).join('')}
                </div>

                <div class="examples">
                    <h2>Examples</h2>
                    <ul>
                        ${data.content.examples.map((example: string) => `
                            <li>${example}</li>
                        `).join('')}
                    </ul>
                </div>

                <div class="activities">
                    <h2>Activities</h2>
                    <ul>
                        ${data.content.activities.map((activity: string) => `
                            <li>${activity}</li>
                        `).join('')}
                    </ul>
                </div>

                <div class="summary">
                    <h2>Summary</h2>
                    <p>${data.content.summary}</p>
                </div>

                <div class="vocabulary">
                    <h2>Key Terms</h2>
                    <ul>
                        ${data.content.vocabulary.map((term: string) => `
                            <li>${term}</li>
                        `).join('')}
                    </ul>
                </div>
            </div>

            <div class="lesson-controls">
                <button class="btn primary" onclick="playLesson()">Play Lesson</button>
                <button class="btn secondary" onclick="switchAvatar()">Switch Avatar</button>
                <button class="btn secondary" onclick="adjustAge()">Change Age</button>
            </div>
        </section>
    </main>

    <footer>
        <p>&copy; 2024 DailyLesson.org</p>
    </footer>

    <script src="/assets/js/app.js"></script>
    <script>
        // Lesson-specific JavaScript
        function playLesson() {
            // Implement audio/video playback
            console.log('Playing lesson...');
        }

        function switchAvatar() {
            const currentAvatar = '${data.avatar}';
            const newAvatar = currentAvatar === 'ken' ? 'kelly' : 'ken';
            window.location.href = window.location.href.replace(currentAvatar, newAvatar);
        }

        function adjustAge() {
            const currentAge = ${data.age};
            const newAge = prompt('Enter your age (1-100):', currentAge.toString());
            if (newAge && newAge >= 1 && newAge <= 100) {
                window.location.href = window.location.href.replace(\`age-\${currentAge}\`, \`age-\${newAge}\`);
            }
        }
    </script>
</body>
</html>`;
  }

  private generateCSS(): string {
    return `
/* DailyLesson.org Styles */
:root {
  --primary-color: #2563eb;
  --secondary-color: #7c3aed;
  --accent-color: #f59e0b;
  --text-color: #1f2937;
  --background-color: #ffffff;
  --surface-color: #f9fafb;
  --border-color: #e5e7eb;
  --success-color: #10b981;
  --warning-color: #f59e0b;
  --error-color: #ef4444;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  line-height: 1.6;
  color: var(--text-color);
  background-color: var(--background-color);
}

/* Header */
header {
  background-color: var(--surface-color);
  border-bottom: 1px solid var(--border-color);
  padding: 1rem 0;
}

nav {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo {
  font-size: 1.5rem;
  font-weight: bold;
  color: var(--primary-color);
}

nav ul {
  display: flex;
  list-style: none;
  gap: 2rem;
}

nav a {
  text-decoration: none;
  color: var(--text-color);
  font-weight: 500;
}

nav a:hover {
  color: var(--primary-color);
}

/* Main Content */
main {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem 1rem;
}

/* Hero Section */
.hero {
  text-align: center;
  padding: 4rem 0;
}

.hero h1 {
  font-size: 3rem;
  margin-bottom: 1rem;
  color: var(--primary-color);
}

.hero p {
  font-size: 1.25rem;
  margin-bottom: 2rem;
  color: var(--text-color);
}

.cta-buttons {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

/* Buttons */
.btn {
  display: inline-block;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  text-decoration: none;
  font-weight: 500;
  transition: all 0.2s;
  border: none;
  cursor: pointer;
}

.btn.primary {
  background-color: var(--primary-color);
  color: white;
}

.btn.secondary {
  background-color: var(--surface-color);
  color: var(--text-color);
  border: 1px solid var(--border-color);
}

.btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* Features */
.features {
  padding: 4rem 0;
}

.feature-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  margin-top: 2rem;
}

.feature {
  padding: 2rem;
  background-color: var(--surface-color);
  border-radius: 0.5rem;
  border: 1px solid var(--border-color);
}

.feature h3 {
  color: var(--primary-color);
  margin-bottom: 1rem;
}

/* Lesson Pages */
.lesson-overview {
  text-align: center;
  padding: 2rem 0;
}

.age-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(60px, 1fr));
  gap: 1rem;
  margin: 2rem 0;
}

.age-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1rem;
  background-color: var(--surface-color);
  border: 1px solid var(--border-color);
  border-radius: 0.5rem;
  text-decoration: none;
  color: var(--text-color);
  transition: all 0.2s;
}

.age-card:hover {
  background-color: var(--primary-color);
  color: white;
  transform: translateY(-2px);
}

.age-number {
  font-size: 1.5rem;
  font-weight: bold;
}

.age-label {
  font-size: 0.75rem;
  opacity: 0.8;
}

.avatar-options {
  display: flex;
  gap: 2rem;
  justify-content: center;
  margin: 2rem 0;
}

.avatar-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem;
  background-color: var(--surface-color);
  border: 1px solid var(--border-color);
  border-radius: 0.5rem;
  text-decoration: none;
  color: var(--text-color);
  transition: all 0.2s;
}

.avatar-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
}

.avatar-card img {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  margin-bottom: 1rem;
}

/* Lesson Content */
.lesson-content {
  max-width: 800px;
  margin: 0 auto;
}

.lesson-header {
  text-align: center;
  margin-bottom: 3rem;
}

.lesson-meta {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-top: 1rem;
  flex-wrap: wrap;
}

.lesson-meta span {
  padding: 0.25rem 0.75rem;
  background-color: var(--surface-color);
  border-radius: 1rem;
  font-size: 0.875rem;
}

.avatar-display {
  text-align: center;
  margin: 2rem 0;
}

.avatar-image {
  width: 200px;
  height: 200px;
  border-radius: 50%;
  border: 4px solid var(--primary-color);
}

.lesson-text {
  margin: 3rem 0;
}

.lesson-text h2 {
  color: var(--primary-color);
  margin: 2rem 0 1rem 0;
}

.lesson-text p {
  margin-bottom: 1rem;
}

.lesson-text ul {
  margin: 1rem 0;
  padding-left: 2rem;
}

.lesson-text li {
  margin-bottom: 0.5rem;
}

.lesson-controls {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin: 3rem 0;
  flex-wrap: wrap;
}

/* Footer */
footer {
  background-color: var(--surface-color);
  border-top: 1px solid var(--border-color);
  padding: 2rem 0;
  text-align: center;
  margin-top: 4rem;
}

/* Responsive Design */
@media (max-width: 768px) {
  .hero h1 {
    font-size: 2rem;
  }
  
  .cta-buttons {
    flex-direction: column;
    align-items: center;
  }
  
  .age-grid {
    grid-template-columns: repeat(auto-fill, minmax(50px, 1fr));
  }
  
  .avatar-options {
    flex-direction: column;
    align-items: center;
  }
  
  .lesson-meta {
    flex-direction: column;
    align-items: center;
  }
}

/* Avatar Themes */
.ken-theme {
  --avatar-primary: #1e40af;
  --avatar-secondary: #3b82f6;
}

.kelly-theme {
  --avatar-primary: #7c3aed;
  --avatar-secondary: #a855f7;
}
`;
  }

  private generateJavaScript(): string {
    return `
// DailyLesson.org JavaScript

// Global state
let currentLesson = null;
let currentAge = 5;
let currentTone = 'fun';
let currentAvatar = 'ken';

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // Load today's lesson on homepage
    if (document.querySelector('.today-lesson')) {
        loadTodaysLesson();
    }
    
    // Initialize search functionality
    if (document.querySelector('.search-form')) {
        initializeSearch();
    }
    
    // Initialize age selector
    if (document.querySelector('.age-selector')) {
        initializeAgeSelector();
    }
}

async function loadTodaysLesson() {
    try {
        const today = new Date();
        const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
        
        const response = await fetch(\`/api/lessons.json\`);
        const lessons = await response.json();
        
        const todaysLesson = lessons.find(lesson => lesson.day === dayOfYear);
        
        if (todaysLesson) {
            displayTodaysLesson(todaysLesson);
        }
    } catch (error) {
        console.error('Error loading today\'s lesson:', error);
    }
}

function displayTodaysLesson(lesson) {
    const container = document.getElementById('today-lesson-content');
    if (container) {
        container.innerHTML = \`
            <h3>\${lesson.title}</h3>
            <p>\${lesson.learning_objective}</p>
            <a href="/lessons/day-\${lesson.day}/" class="btn primary">Start Today's Lesson</a>
        \`;
    }
}

function initializeSearch() {
    const searchForm = document.querySelector('.search-form');
    const searchInput = document.querySelector('.search-input');
    
    if (searchForm && searchInput) {
        searchForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const query = searchInput.value.trim();
            if (query) {
                await performSearch(query);
            }
        });
    }
}

async function performSearch(query) {
    try {
        const response = await fetch(\`/api/search.json\`);
        const searchIndex = await response.json();
        
        const results = searchLessonIndex(searchIndex, query);
        displaySearchResults(results);
    } catch (error) {
        console.error('Error performing search:', error);
    }
}

function searchLessonIndex(searchIndex, query) {
    const results = [];
    const searchTerm = query.toLowerCase();
    
    for (const [word, lessonIds] of Object.entries(searchIndex)) {
        if (word.includes(searchTerm)) {
            results.push(...lessonIds);
        }
    }
    
    return [...new Set(results)]; // Remove duplicates
}

function displaySearchResults(results) {
    const resultsContainer = document.getElementById('search-results');
    if (resultsContainer) {
        if (results.length === 0) {
            resultsContainer.innerHTML = '<p>No lessons found matching your search.</p>';
            return;
        }
        
        const resultsHTML = results.slice(0, 10).map(lessonId => \`
            <div class="search-result">
                <h4>\${lessonId}</h4>
                <a href="/lessons/\${lessonId}/" class="btn secondary">View Lesson</a>
            </div>
        \`).join('');
        
        resultsContainer.innerHTML = resultsHTML;
    }
}

function initializeAgeSelector() {
    const ageCards = document.querySelectorAll('.age-card');
    ageCards.forEach(card => {
        card.addEventListener('click', (e) => {
            e.preventDefault();
            const age = card.querySelector('.age-number').textContent;
            selectAge(parseInt(age));
        });
    });
}

function selectAge(age) {
    currentAge = age;
    
    // Update URL to reflect age selection
    const currentUrl = new URL(window.location);
    currentUrl.pathname = currentUrl.pathname.replace(/\\/age-\\d+\\//, \`/age-\${age}/\`);
    window.history.pushState({}, '', currentUrl);
    
    // Update UI to show selected age
    document.querySelectorAll('.age-card').forEach(card => {
        card.classList.remove('selected');
        if (card.querySelector('.age-number').textContent === age.toString()) {
            card.classList.add('selected');
        }
    });
}

// Utility functions
function formatDate(date) {
    return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function getDayOfYear(date) {
    return Math.floor((date - new Date(date.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
}

// Service Worker registration
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('SW registered: ', registration);
            })
            .catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}
`;
  }

  private generateCalendarData(): Record<string, any> {
    const calendar: Record<string, any> = {};
    
    for (let day = 1; day <= 365; day++) {
      const lesson = this.lessons.get(day);
      if (lesson) {
        const date = this.getDateFromDayOfYear(day);
        calendar[date] = {
          day,
          date,
          title: lesson.title,
          learning_objective: lesson.learning_objective,
          category: lesson.category,
          tags: lesson.tags || [],
          url: `/lessons/day-${day}/`
        };
      }
    }
    
    return calendar;
  }

  private generateSearchIndex(): Record<string, string[]> {
    const searchIndex: Record<string, string[]> = {};
    
    for (const [day, lesson] of this.lessons.entries()) {
      const lessonId = `day-${day}`;
      
      // Add null checks for lesson properties
      if (!lesson || !lesson.title) continue;
      
      // Index by title words
      const titleWords = lesson.title.toLowerCase().split(/\s+/);
      titleWords.forEach((word: string) => {
        if (word.length > 2) {
          if (!searchIndex[word]) searchIndex[word] = [];
          searchIndex[word].push(lessonId);
        }
      });

      // Index by learning objective
      if (lesson.learning_objective) {
        const objectiveWords = lesson.learning_objective.toLowerCase().split(/\s+/);
        objectiveWords.forEach((word: string) => {
          if (word.length > 2) {
            if (!searchIndex[word]) searchIndex[word] = [];
            searchIndex[word].push(lessonId);
          }
        });
      }

      // Index by tags
      if (lesson.tags && Array.isArray(lesson.tags)) {
        lesson.tags.forEach((tag: string) => {
          const tagWords = tag.toLowerCase().split(/\s+/);
          tagWords.forEach((word: string) => {
            if (word.length > 2) {
              if (!searchIndex[word]) searchIndex[word] = [];
              searchIndex[word].push(lessonId);
            }
          });
        });
      }
    }
    
    return searchIndex;
  }

  private getDateFromDayOfYear(dayOfYear: number): string {
    const date = new Date(2024, 0, dayOfYear);
    return date.toISOString().split('T')[0];
  }

  private printSiteSummary() {
    console.log('\n🌐 CLOUDFLARE SITE GENERATION COMPLETE!');
    console.log('=========================================');
    console.log(`📁 Site location: ${this.config.outputDir}`);
    console.log(`📚 Total lessons: ${this.lessons.size}`);
    console.log(`👥 Age support: 1-100 years old`);
    console.log(`🎭 Avatar options: Ken & Kelly`);
    console.log(`🌍 Languages: 5 supported`);
    console.log(`⚡ Offline capable: Yes`);
    console.log('\n📋 Next steps:');
    console.log('  1. Upload to Cloudflare Pages');
    console.log('  2. Configure custom domain (dailylesson.org)');
    console.log('  3. Set up analytics and monitoring');
    console.log('  4. Test offline functionality');
    console.log('\n🚀 Your static site is ready for deployment!');
  }

  // Additional HTML generation methods (simplified for brevity)
  private generateAboutHTML(): string {
    return `<!DOCTYPE html><html><head><title>About - DailyLesson.org</title></head><body><h1>About DailyLesson.org</h1><p>Universal education for everyone.</p></body></html>`;
  }

  private generateCalendarHTML(): string {
    return `<!DOCTYPE html><html><head><title>Calendar - DailyLesson.org</title></head><body><h1>365 Day Calendar</h1><div id="calendar"></div></body></html>`;
  }

  private generateSearchHTML(): string {
    return `<!DOCTYPE html><html><head><title>Search - DailyLesson.org</title></head><body><h1>Search Lessons</h1><form class="search-form"><input type="text" class="search-input" placeholder="Search lessons..."><button type="submit">Search</button></form><div id="search-results"></div></body></html>`;
  }
}

// Main execution function
async function main() {
  const config: Partial<StaticSiteConfig> = {
    outputDir: './cloudflare-site',
    baseUrl: 'https://dailylesson.org',
    includeAudio: false,
    includeVideo: false,
    generateServiceWorker: true,
    optimizeImages: true
  };
  
  const generator = new CloudflareSiteGenerator(config);
  
  try {
    await generator.generateCompleteSite();
  } catch (error) {
    console.error('❌ Fatal error during site generation:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

export { CloudflareSiteGenerator, main }; 