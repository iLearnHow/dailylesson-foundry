import { OfflineLessonGenerator } from './pre_generate_all_lessons';
import { OfflineIndexBuilder } from './build_offline_indexes';
import { OfflineLessonServer } from './offline_server';
import * as fs from 'fs/promises';
import * as path from 'path';

interface OfflinePackageConfig {
  outputDir: string;
  generateLessons: boolean;
  buildIndexes: boolean;
  startServer: boolean;
  serverPort: number;
  skipExisting: boolean;
  maxConcurrent: number;
}

class OfflinePackageGenerator {
  private config: OfflinePackageConfig;
  private startTime: number;

  constructor(config: Partial<OfflinePackageConfig> = {}) {
    this.config = {
      outputDir: './offline-lessons',
      generateLessons: true,
      buildIndexes: true,
      startServer: false,
      serverPort: 3000,
      skipExisting: true,
      maxConcurrent: 3,
      ...config
    };
    this.startTime = Date.now();
  }

  async generateCompletePackage() {
    console.log('🎯 DAILY LESSON OFFLINE PACKAGE GENERATOR');
    console.log('==========================================');
    console.log(`📁 Output directory: ${this.config.outputDir}`);
    console.log(`🔄 Generate lessons: ${this.config.generateLessons}`);
    console.log(`🔍 Build indexes: ${this.config.buildIndexes}`);
    console.log(`🚀 Start server: ${this.config.startServer}`);
    console.log(`⏭️  Skip existing: ${this.config.skipExisting}`);
    console.log(`⚡ Max concurrent: ${this.config.maxConcurrent}`);
    console.log('');

    try {
      // Step 1: Generate all lessons
      if (this.config.generateLessons) {
        await this.generateAllLessons();
      }

      // Step 2: Build search indexes
      if (this.config.buildIndexes) {
        await this.buildSearchIndexes();
      }

      // Step 3: Create package manifest
      await this.createPackageManifest();

      // Step 4: Generate deployment instructions
      await this.generateDeploymentInstructions();

      // Step 5: Start server if requested
      if (this.config.startServer) {
        await this.startOfflineServer();
      }

      this.printFinalSummary();

    } catch (error) {
      console.error('❌ Fatal error during package generation:', error);
      process.exit(1);
    }
  }

  private async generateAllLessons() {
    console.log('📚 STEP 1: GENERATING ALL LESSONS');
    console.log('==================================');
    
    const generator = new OfflineLessonGenerator(this.config.outputDir);
    await generator.initialize();
    await generator.generateAllLessons();
    
    console.log('✅ Lesson generation complete!\n');
  }

  private async buildSearchIndexes() {
    console.log('🔍 STEP 2: BUILDING SEARCH INDEXES');
    console.log('==================================');
    
    const indexBuilder = new OfflineIndexBuilder(
      path.join(this.config.outputDir, 'lessons'),
      path.join(this.config.outputDir, 'index')
    );
    
    await indexBuilder.buildIndexes();
    
    console.log('✅ Index building complete!\n');
  }

  private async createPackageManifest() {
    console.log('📋 STEP 3: CREATING PACKAGE MANIFEST');
    console.log('=====================================');
    
    try {
      // Read metadata
      const metadataPath = path.join(this.config.outputDir, 'index', 'metadata.json');
      const metadataContent = await fs.readFile(metadataPath, 'utf8');
      const metadata = JSON.parse(metadataContent);
      
      // Count lesson files
      const lessonsDir = path.join(this.config.outputDir, 'lessons');
      const lessonFiles = await fs.readdir(lessonsDir);
      const lessonCount = lessonFiles.filter(file => file.endsWith('.json')).length;
      
      // Create manifest
      const manifest = {
        package_name: 'dailylesson-offline-package',
        version: '1.0.0',
        description: 'Complete offline package of all 365 daily lessons',
        generated_at: new Date().toISOString(),
        generation_time_minutes: Math.floor((Date.now() - this.startTime) / 60000),
        contents: {
          total_lessons: lessonCount,
          total_days: metadata.total_days,
          ages: metadata.ages,
          tones: metadata.tones,
          languages: metadata.languages,
          categories: metadata.categories.length,
          subjects: metadata.subjects.length
        },
        directories: {
          lessons: 'lessons/',
          indexes: 'index/',
          metadata: 'metadata/',
          reports: 'reports/',
          static: 'static/'
        },
        file_sizes: await this.calculateFileSizes(),
        requirements: {
          node_version: '>=16.0.0',
          memory: '2GB+ recommended',
          storage: '1GB+ for full package'
        },
        usage: {
          server_command: 'npx ts-node scripts/offline_server.ts',
          api_endpoints: [
            'GET / - Server information',
            'GET /lessons - List all lessons',
            'GET /lessons/{lesson_id} - Get specific lesson',
            'GET /days/{day} - Get lessons for specific day',
            'GET /search?q={query} - Search lessons',
            'GET /calendar - Get calendar view'
          ]
        }
      };
      
      const manifestPath = path.join(this.config.outputDir, 'package-manifest.json');
      await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');
      
      console.log('✅ Package manifest created');
      console.log(`📊 Total lessons: ${lessonCount.toLocaleString()}`);
      console.log(`📅 Days covered: ${metadata.total_days}/365`);
      console.log(`⏱️  Generation time: ${Math.floor((Date.now() - this.startTime) / 60000)} minutes\n`);
      
    } catch (error) {
      console.error('❌ Error creating package manifest:', error);
      throw error;
    }
  }

  private async calculateFileSizes() {
    const sizes: { [key: string]: number } = {};
    
    try {
      // Calculate lessons directory size
      const lessonsDir = path.join(this.config.outputDir, 'lessons');
      const lessonFiles = await fs.readdir(lessonsDir);
      let lessonsSize = 0;
      
      for (const file of lessonFiles) {
        if (file.endsWith('.json')) {
          const filePath = path.join(lessonsDir, file);
          const stats = await fs.stat(filePath);
          lessonsSize += stats.size;
        }
      }
      
      sizes.lessons_mb = Math.round(lessonsSize / (1024 * 1024) * 100) / 100;
      
      // Calculate index directory size
      const indexDir = path.join(this.config.outputDir, 'index');
      const indexFiles = await fs.readdir(indexDir);
      let indexSize = 0;
      
      for (const file of indexFiles) {
        if (file.endsWith('.json')) {
          const filePath = path.join(indexDir, file);
          const stats = await fs.stat(filePath);
          indexSize += stats.size;
        }
      }
      
      sizes.indexes_mb = Math.round(indexSize / (1024 * 1024) * 100) / 100;
      
      // Calculate total size
      const totalSize = lessonsSize + indexSize;
      sizes.total_mb = Math.round(totalSize / (1024 * 1024) * 100) / 100;
      
    } catch (error) {
      console.warn('⚠️  Could not calculate file sizes:', error);
    }
    
    return sizes;
  }

  private async generateDeploymentInstructions() {
    console.log('📖 STEP 4: GENERATING DEPLOYMENT INSTRUCTIONS');
    console.log('=============================================');
    
    const instructions = `# DailyLesson Offline Package - Deployment Instructions

## Overview
This package contains all 365 daily lessons pre-generated for offline use. The package includes:
- Complete lesson content for all age groups, tones, and languages
- Search indexes for fast lesson discovery
- HTTP server for serving lessons locally
- Deployment instructions and documentation

## Quick Start

### 1. Extract Package
\`\`\`bash
# Extract the package to your desired location
tar -xzf dailylesson-offline-package.tar.gz
cd offline-lessons
\`\`\`

### 2. Start the Server
\`\`\`bash
# Using Node.js
npx ts-node scripts/offline_server.ts

# Or using the provided script
./start-server.sh
\`\`\`

### 3. Access Lessons
Open your browser and navigate to:
- http://localhost:3000 - Server information
- http://localhost:3000/lessons - Browse all lessons
- http://localhost:3000/days/1 - Get lessons for day 1
- http://localhost:3000/search?q=science - Search for science lessons

## API Endpoints

### Get Server Information
\`\`\`
GET http://localhost:3000/
\`\`\`

### List All Lessons
\`\`\`
GET http://localhost:3000/lessons
\`\`\`

### Get Specific Lesson
\`\`\`
GET http://localhost:3000/lessons/{lesson_id}
\`\`\`

### Get Lessons for Specific Day
\`\`\`
GET http://localhost:3000/days/{day_number}
# day_number: 1-365
\`\`\`

### Search Lessons
\`\`\`
GET http://localhost:3000/search?q={search_term}
\`\`\`

### Get Calendar View
\`\`\`
GET http://localhost:3000/calendar
\`\`\`

## Configuration

### Environment Variables
- \`PORT\`: Server port (default: 3000)
- \`LESSONS_DIR\`: Path to lessons directory
- \`INDEX_DIR\`: Path to indexes directory
- \`STATIC_DIR\`: Path to static files directory

### Example Configuration
\`\`\`bash
export PORT=8080
export LESSONS_DIR=./lessons
export INDEX_DIR=./index
npx ts-node scripts/offline_server.ts
\`\`\`

## File Structure
\`\`\`
offline-lessons/
├── lessons/           # Individual lesson JSON files
├── index/            # Search indexes and metadata
├── metadata/         # Generation progress and results
├── reports/          # Generation reports
├── static/           # Static web files (optional)
├── package-manifest.json
└── README.md
\`\`\`

## Integration

### Embedding in Web Applications
\`\`\`javascript
// Fetch a lesson
const response = await fetch('http://localhost:3000/lessons/lesson_id');
const lesson = await response.json();

// Search lessons
const searchResponse = await fetch('http://localhost:3000/search?q=science');
const results = await searchResponse.json();
\`\`\`

### Mobile Applications
The server supports CORS and can be accessed from mobile applications running on the same network.

## Troubleshooting

### Server Won't Start
1. Check if port 3000 is available
2. Verify all required files are present
3. Check Node.js version (>=16.0.0)

### Lessons Not Found
1. Verify lessons directory exists
2. Check file permissions
3. Ensure lesson files are valid JSON

### Performance Issues
1. Increase server memory allocation
2. Use SSD storage for better I/O performance
3. Consider using a reverse proxy for high traffic

## Support
For issues or questions, refer to the package manifest or generation logs.
`;

    const instructionsPath = path.join(this.config.outputDir, 'DEPLOYMENT.md');
    await fs.writeFile(instructionsPath, instructions, 'utf8');
    
    console.log('✅ Deployment instructions created\n');
  }

  private async startOfflineServer() {
    console.log('🚀 STEP 5: STARTING OFFLINE SERVER');
    console.log('==================================');
    
    const server = new OfflineLessonServer({
      port: this.config.serverPort,
      lessonsDir: path.join(this.config.outputDir, 'lessons'),
      indexDir: path.join(this.config.outputDir, 'index'),
      staticDir: path.join(this.config.outputDir, 'static')
    });
    
    await server.start();
  }

  private printFinalSummary() {
    const totalTime = Math.floor((Date.now() - this.startTime) / 60000);
    
    console.log('\n🎉 OFFLINE PACKAGE GENERATION COMPLETE!');
    console.log('========================================');
    console.log(`📁 Package location: ${this.config.outputDir}`);
    console.log(`⏱️  Total time: ${totalTime} minutes`);
    console.log(`📊 Package size: See package-manifest.json for details`);
    console.log('\n📋 Next steps:');
    console.log(`  1. Review package-manifest.json for package details`);
    console.log(`  2. Read DEPLOYMENT.md for usage instructions`);
    console.log(`  3. Copy the ${this.config.outputDir} directory to your target machine`);
    console.log(`  4. Start the server: npx ts-node scripts/offline_server.ts`);
    console.log('\n🚀 Your offline lesson system is ready!');
  }
}

// Main execution function
async function main() {
  // Parse command line arguments
  const args = process.argv.slice(2);
  const config: Partial<OfflinePackageConfig> = {};
  
  for (const arg of args) {
    if (arg.startsWith('--output=')) {
      config.outputDir = arg.split('=')[1];
    } else if (arg === '--no-lessons') {
      config.generateLessons = false;
    } else if (arg === '--no-indexes') {
      config.buildIndexes = false;
    } else if (arg === '--start-server') {
      config.startServer = true;
    } else if (arg.startsWith('--port=')) {
      config.serverPort = parseInt(arg.split('=')[1]);
    } else if (arg === '--force') {
      config.skipExisting = false;
    } else if (arg.startsWith('--concurrent=')) {
      config.maxConcurrent = parseInt(arg.split('=')[1]);
    }
  }
  
  const generator = new OfflinePackageGenerator(config);
  
  try {
    await generator.generateCompletePackage();
  } catch (error) {
    console.error('❌ Fatal error during package generation:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

export { OfflinePackageGenerator, main }; 