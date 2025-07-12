# CLAUDE.md - DailyLesson Foundry System Reference

## 🎯 **SYSTEM OVERVIEW**
**DailyLesson Foundry** is a universal educational platform that generates personalized lessons for 6,000+ combinations (age × tone × language × 365 days) using sophisticated adaptation engines.

## 🕰️ **WORLD CLOCK & TOPIC-OF-THE-DAY LOGIC**
- **UTC as Source of Truth**: The homepage always uses UTC to determine "today"—never local system time.
- **Curriculum Sync**: The UTC day-of-year is mapped to the correct topic using the curriculum/daily topics system.
- **Calendar/Day/Topic Picker**: Students can pick any day to explore its lesson, but by default, the homepage shows the correct topic for today (no negotiation default).
- **Robust to Time Zones**: Handles DST, leap years, and all edge cases using IANA time zone data and best practices from `world_clock_guide.md`.

## 🏗️ **ARCHITECTURE**

### **Frontend (Next.js)**
- **Location**: `components/lesson-player/App.tsx` - Main lesson interface with age, tone, language, and day/topic controls
- **Homepage**: Always displays today's topic (synced to UTC), with a calendar/day picker for exploration
- **Deployment**: Cloudflare Pages → `mynextlesson.com`

### **Backend (Cloudflare Workers)**
- **Location**: `api/index.ts` - Main API with Hono framework
- **Curriculum Loader**: `api/curriculum-loader.ts` - Maps day-of-year to topic
- **Key Endpoint**: `/v1/daily-lesson?age=25&tone=fun&language=english&dayOfYear=192`

## 🔧 **CORE ENGINES**

### **1. Age Contextualizer**
- **Purpose**: Adapts content to cognitive stages (early_childhood, youth, young_adult, midlife, wisdom_years)
- **Key Files**: `age_contextualizer.js`, integrated in `simple-orchestrator.ts`
- **Logic**: Maps age to complexity level, attention span, vocabulary, examples

### **2. Tone Delivery Engine**
- **Purpose**: Creates authentic voice personalities
- **Profiles**: `fun` (energetic_explorer), `grandmother` (wise_nurturer), `neutral` (knowledgeable_guide)
- **Key Files**: `tone_delivery_engine.js`, integrated in `simple-orchestrator.ts`

### **3. Language Engine**
- **Purpose**: Cultural adaptation and translation
- **Key Files**: `language_engine.js`, integrated in `simple-orchestrator.ts`
- **Status**: Basic implementation, ready for expansion

### **4. Narrative Weaver**
- **Purpose**: Orchestrates 3x2x1 lesson structure
- **Key Files**: `narrative_weaver.js`, integrated in `simple-orchestrator.ts`
- **Structure**: Opening → 3 Questions → Daily Fortune

## 📚 **LESSON DNA SYSTEM**

### **Current Lesson (July 11)**
- **Topic**: "Acoustics - The Science of Sound and Hearing"
- **DNA File**: `lessons/acoustics_july11_dna.json`
- **Day of Year**: 192
- **Core Principle**: "sound_physics_enables_communication_and_accessibility"

### **Curriculum Files**
- **Location**: Monthly JSON files (e.g., `july_curriculum.json`)
- **Structure**: 365 days with unique topics and learning objectives
- **Loader**: `api/curriculum-loader.ts` (ready for integration)

## 🚀 **DEPLOYMENT PIPELINE**

### **Automated Workflows**
1. **Workers**: `.github/workflows/deploy-cloudflare.yml`
2. **Pages**: `.github/workflows/deploy-pages.yml`
3. **Trigger**: Push to `main` branch
4. **Requirements**: `CLOUDFLARE_API_TOKEN` in GitHub secrets

### **Manual Commands**
```bash
# Deploy Workers
wrangler deploy

# Deploy Pages
npx wrangler pages deploy ./out --project-name=dailylesson-foundry

# Build Frontend
npm run build
```

## 🔑 **KEY CONFIGURATION FILES**

### **wrangler.toml**
- **Purpose**: Cloudflare Workers configuration
- **Key Settings**: `compatibility_flags = ["nodejs_compat"]`
- **Environments**: development, staging, production

### **next.config.js**
- **Purpose**: Next.js configuration
- **Key Setting**: `output: 'export'` for static generation
- **Note**: API routes disabled in static export

### **package.json**
- **Dependencies**: Next.js, Hono, micro, stripe
- **Scripts**: `dev`, `build`, `start`

## 🎯 **CURRENT STATUS**

### **✅ Working**
- Real lesson generation with age/tone/language adaptation
- World clock-synced, topic-of-the-day homepage
- Calendar/day/topic picker for lesson exploration
- Cloudflare Workers API live and serving lessons
- Cloudflare Pages frontend deployed
- GitHub Actions automation configured

### **🔄 Ready for Expansion**
- 365-day curriculum system
- Multi-language support
- Video generation pipeline
- Database integration (D1, KV, R2)

## 🚨 **CRITICAL REMINDERS**

### **Development Workflow**
1. **Never use `main_orchestrator.js`** - Use `api/simple-orchestrator.ts` instead
2. **Frontend API calls** must use production URL: `https://ilearn-api.nicoletterankin.workers.dev`
3. **Static export** means no API routes in Next.js - all API calls go to Cloudflare Workers
4. **Lesson DNA** must be complete with all age expressions and tone profiles

### **Deployment Checklist**
- [ ] Test lesson generation locally
- [ ] Verify API endpoints work
- [ ] Build frontend: `npm run build`
- [ ] Deploy Workers: `wrangler deploy`
- [ ] Deploy Pages: `npx wrangler pages deploy ./out --project-name=dailylesson-foundry`

### **Error Prevention**
- **Node.js compatibility**: Always use `compatibility_flags = ["nodejs_compat"]` in wrangler.toml
- **File paths**: Use relative paths in Cloudflare Workers environment
- **API integration**: Frontend calls external API, not Next.js API routes
- **Lesson structure**: Must include all 5 scripts (opening, 3 questions, fortune)

## 🌐 **LIVE ENDPOINTS**

### **API**
- **Health Check**: `https://ilearn-api.nicoletterankin.workers.dev/`
- **Test Lesson**: `https://ilearn-api.nicoletterankin.workers.dev/v1/test-acoustics?age=25&tone=fun&language=english`
- **Daily Lesson**: `https://ilearn-api.nicoletterankin.workers.dev/v1/daily-lesson?age=25&tone=fun&language=english`

### **Frontend**
- **Production**: `https://mynextlesson.com`
- **Pages Dev**: `https://dailylesson-foundry.pages.dev`

## 📈 **SCALABILITY TARGETS**
- **6,000+ lesson combinations** per day
- **365 unique topics** per year
- **Multiple languages** (English, Spanish, French, German, Chinese, Japanese, Arabic, Hindi)
- **Age ranges**: 5-85 years old
- **Tone variations**: Fun, Grandmother, Neutral

## 🔍 **TROUBLESHOOTING**

### **Common Issues**
1. **Wrangler build errors**: Check `compatibility_flags` and Node.js imports
2. **API not responding**: Verify Worker deployment and environment variables
3. **Frontend not loading**: Check Pages deployment and build output
4. **Lesson generation fails**: Verify lesson DNA structure and orchestrator logic

### **Debug Commands**
```bash
# Check Worker status
wrangler whoami
wrangler dev --port 8787

# Check Pages status
npx wrangler pages project list

# Test API locally
curl http://localhost:8787/v1/test-acoustics?age=25&tone=fun&language=english
```

---

**Last Updated**: July 11, 2025  
**System Version**: 1.1.0  
**Status**: Production Ready ✅ 

# System Documentation Update (July 2025)

## CI/CD Lesson Coverage Check
- After pre-generation, the CI/CD pipeline calls `/api/monitor/lesson-coverage`.
- If lesson coverage is below 99%, the build fails and deployment is blocked.
- This ensures only high-quality, fully-covered lesson sets are deployed.

## Admin Dashboard (`/admin/monitor`)
- Password protected (password: `abl`).
- Visualizes lesson coverage, missing/low-quality lessons, and fallback events.
- Allows CSV/JSON export of all logs for further analysis.

## Fallback Logging
- All lesson fetch failures or low-quality results are logged via `/api/monitor/log-fallback`.
- Fallback logs are viewable and exportable from the admin dashboard.

## Learn More Page (`/learn-more-about-lessons`)
- Password protected (password: `abl`).
- Student-friendly and technical: explains lesson generation, preloading, fallback, and how students help improve the system.
- Links to public APIs for transparency and learning.

## Consistency Checks
- Ensure lesson generation, pre-generation, and monitoring logic use the same age, tone, and language options.
- Ensure all endpoints and scripts use the same key naming and data structure for lessons.
- Monitor for any mismatches between what is generated, what is stored, and what is checked by monitoring endpoints.

---

**Next: Reviewing the codebase for inconsistencies between lesson generation, pre-generation, and monitoring logic.** 