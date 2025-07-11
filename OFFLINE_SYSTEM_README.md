# DailyLesson Offline System

## Overview

This system pre-generates all 365 daily lessons for offline use, creating a complete package that can be deployed on any machine without internet connectivity. The system generates lessons for all combinations of age groups, tones, and languages, providing comprehensive educational content for global deployment.

## What's Generated

### Complete Lesson Coverage
- **365 Days**: Every day of the year has unique educational content
- **5 Age Groups**: 5, 12, 25, 45, 75 years old
- **3 Tones**: Fun, Grandmother, Neutral delivery styles
- **5 Languages**: English, Spanish, French, German, Chinese
- **Total**: 27,375 unique lesson variations (365 × 5 × 3 × 5)

### Content Structure
Each lesson includes:
- Complete lesson scripts with 3x3x3 structure
- Age-appropriate content adaptation
- Tone-specific delivery instructions
- Language-localized content
- Educational objectives and learning outcomes
- Production notes for implementation

## Quick Start

### 1. Generate Complete Package
```bash
# Generate all lessons with default settings
./scripts/generate-offline.sh

# Generate with custom output directory
./scripts/generate-offline.sh --output=/path/to/offline-lessons

# Generate and start server immediately
./scripts/generate-offline.sh --start-server --port=8080
```

### 2. Start Offline Server
```bash
# Navigate to output directory
cd offline-lessons

# Start the server
npx ts-node scripts/offline_server.ts

# Or use environment variables
PORT=8080 npx ts-node scripts/offline_server.ts
```

### 3. Access Lessons
Open your browser to:
- `http://localhost:3000` - Server information
- `http://localhost:3000/lessons` - Browse all lessons
- `http://localhost:3000/days/1` - Get lessons for day 1
- `http://localhost:3000/search?q=science` - Search lessons

## System Architecture

### Core Components

#### 1. Lesson Generator (`scripts/pre_generate_all_lessons.ts`)
- Generates all 27,375 lesson variations
- Handles age, tone, and language adaptation
- Saves lessons as individual JSON files
- Provides progress tracking and error handling

#### 2. Index Builder (`scripts/build_offline_indexes.ts`)
- Creates search indexes for fast lesson discovery
- Builds category-based indexes (by day, age, tone, language)
- Generates calendar and full-text search indexes
- Optimizes for offline performance

#### 3. Offline Server (`scripts/offline_server.ts`)
- HTTP server for serving lessons locally
- RESTful API for lesson access
- Search and filtering capabilities
- CORS support for web applications

#### 4. Package Generator (`scripts/generate_offline_package.ts`)
- Orchestrates the complete generation process
- Creates deployment instructions and manifests
- Handles configuration and error management
- Provides comprehensive reporting

### File Structure
```
offline-lessons/
├── lessons/                    # Individual lesson JSON files
│   ├── daily_lesson_20240101_1_5_fun_english.json
│   ├── daily_lesson_20240101_1_5_fun_spanish.json
│   └── ... (27,375 files)
├── index/                      # Search indexes
│   ├── search-index.json       # Main search index
│   ├── by-day-index.json       # Lessons by day
│   ├── by-age-index.json       # Lessons by age
│   ├── by-tone-index.json      # Lessons by tone
│   ├── by-language-index.json  # Lessons by language
│   ├── calendar-index.json     # Calendar view
│   ├── fulltext-search-index.json # Full-text search
│   └── metadata.json           # Package metadata
├── metadata/                   # Generation tracking
│   ├── generation-progress.json
│   └── generation-results.json
├── reports/                    # Generation reports
│   └── generation-report.json
├── static/                     # Static web files (optional)
├── package-manifest.json       # Package information
└── DEPLOYMENT.md              # Deployment instructions
```

## API Reference

### Server Information
```http
GET /
```
Returns server status, metadata, and available endpoints.

### List All Lessons
```http
GET /lessons
```
Returns a paginated list of all available lessons.

### Get Specific Lesson
```http
GET /lessons/{lesson_id}
```
Returns the complete lesson content for a specific lesson ID.

### Get Lessons by Day
```http
GET /days/{day_number}
```
Returns all lesson variations for a specific day (1-365).

### Search Lessons
```http
GET /search?q={search_term}
```
Searches lessons by title, subject, or tags.

### Get Calendar View
```http
GET /calendar
```
Returns a calendar view of all available days.

### Get Indexes
```http
GET /indexes
```
Returns information about all available search indexes.

## Configuration Options

### Generation Options
```bash
--output=DIR          # Output directory (default: ./offline-lessons)
--no-lessons          # Skip lesson generation
--no-indexes          # Skip index building
--start-server        # Start server after generation
--port=PORT           # Server port (default: 3000)
--force               # Force regeneration (don't skip existing)
--concurrent=N        # Max concurrent generations (default: 3)
```

### Environment Variables
```bash
PORT=3000                    # Server port
LESSONS_DIR=./lessons        # Lessons directory path
INDEX_DIR=./index           # Indexes directory path
STATIC_DIR=./static         # Static files directory path
```

## Deployment Scenarios

### 1. Local Development
```bash
# Generate and start server for development
./scripts/generate-offline.sh --start-server --port=3000
```

### 2. Production Server
```bash
# Generate complete package
./scripts/generate-offline.sh --output=/opt/dailylesson

# Start production server
cd /opt/dailylesson
PORT=80 npx ts-node scripts/offline_server.ts
```

### 3. Docker Deployment
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY offline-lessons/ .
RUN npm install -g ts-node typescript
EXPOSE 3000
CMD ["npx", "ts-node", "scripts/offline_server.ts"]
```

### 4. Mobile/Embedded Systems
```bash
# Generate minimal package (text only)
./scripts/generate-offline.sh --no-indexes --output=/sdcard/lessons

# Use lightweight server
PORT=8080 npx ts-node scripts/offline_server.ts
```

## Performance Considerations

### Generation Performance
- **Estimated Time**: 3-6 hours for complete generation
- **Memory Usage**: 2GB+ recommended
- **Storage**: 1GB+ for complete package
- **CPU**: Multi-core recommended for faster generation

### Server Performance
- **Concurrent Users**: 100+ simultaneous connections
- **Response Time**: <100ms for indexed queries
- **Memory Usage**: 500MB+ for loaded indexes
- **Storage I/O**: SSD recommended for better performance

### Optimization Tips
1. Use SSD storage for better I/O performance
2. Increase Node.js memory allocation for large indexes
3. Use reverse proxy (nginx) for high traffic
4. Consider CDN for static assets in production

## Integration Examples

### Web Application
```javascript
// Fetch a specific lesson
const response = await fetch('http://localhost:3000/lessons/daily_lesson_20240101_1_5_fun_english');
const lesson = await response.json();

// Search for science lessons
const searchResponse = await fetch('http://localhost:3000/search?q=science');
const results = await searchResponse.json();

// Get lessons for specific day
const dayResponse = await fetch('http://localhost:3000/days/1');
const dayLessons = await dayResponse.json();
```

### Mobile Application
```javascript
// React Native example
const fetchLesson = async (lessonId) => {
  try {
    const response = await fetch(`http://192.168.1.100:3000/lessons/${lessonId}`);
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch lesson:', error);
  }
};
```

### Command Line Tools
```bash
# Get lesson for specific day and age
curl "http://localhost:3000/days/1" | jq '.lessons[] | select(.age_target == 5)'

# Search for physics lessons
curl "http://localhost:3000/search?q=physics" | jq '.results[0:5]'

# Get server statistics
curl "http://localhost:3000/" | jq '.metadata'
```

## Troubleshooting

### Common Issues

#### Generation Fails
1. **Check Node.js version**: Ensure Node.js 16+ is installed
2. **Verify dependencies**: Run `npm install` to install required packages
3. **Check disk space**: Ensure sufficient storage for 27,375 lesson files
4. **Memory issues**: Increase Node.js memory allocation with `--max-old-space-size=4096`

#### Server Won't Start
1. **Port conflicts**: Check if port 3000 is available
2. **File permissions**: Ensure read access to lessons and indexes directories
3. **Missing files**: Verify all required files are present in output directory

#### Performance Issues
1. **Slow queries**: Check if indexes are properly built
2. **High memory usage**: Consider using a reverse proxy
3. **Slow file access**: Use SSD storage for better I/O performance

### Debug Mode
```bash
# Enable debug logging
DEBUG=* npx ts-node scripts/offline_server.ts

# Check generation progress
cat offline-lessons/metadata/generation-progress.json

# Verify lesson count
ls offline-lessons/lessons/*.json | wc -l
```

## Monitoring and Maintenance

### Health Checks
```bash
# Check server status
curl http://localhost:3000/

# Verify lesson count
curl http://localhost:3000/indexes | jq '.total_lessons'

# Test search functionality
curl "http://localhost:3000/search?q=test" | jq '.total_results'
```

### Logging
The system provides comprehensive logging:
- Generation progress and errors
- Server request logs
- Performance metrics
- Error tracking and reporting

### Backup and Recovery
```bash
# Create backup of generated package
tar -czf dailylesson-backup-$(date +%Y%m%d).tar.gz offline-lessons/

# Restore from backup
tar -xzf dailylesson-backup-20240101.tar.gz
```

## Future Enhancements

### Planned Features
1. **Audio Generation**: Pre-generate audio files for all lessons
2. **Video Generation**: Create video content for offline viewing
3. **Compression**: Implement lesson compression for smaller packages
4. **Incremental Updates**: Support for partial lesson updates
5. **Multi-language UI**: Localized user interface
6. **Analytics**: Offline usage tracking and reporting

### Customization Options
1. **Lesson Filtering**: Generate only specific age groups or languages
2. **Content Customization**: Modify lesson content for specific regions
3. **Branding**: Custom branding and styling options
4. **Integration APIs**: Additional API endpoints for specific use cases

## Support and Documentation

### Additional Resources
- `DEPLOYMENT.md`: Detailed deployment instructions
- `package-manifest.json`: Complete package information
- Generation reports in `reports/` directory
- API documentation in server responses

### Getting Help
1. Check the troubleshooting section above
2. Review generation logs in `metadata/` directory
3. Verify package manifest for configuration details
4. Test with minimal configuration first

---

**Note**: This offline system provides a complete, self-contained educational platform that can operate without internet connectivity, making it ideal for deployment in areas with limited or no internet access. 