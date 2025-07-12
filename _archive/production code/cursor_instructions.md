# 🎯 CURSOR IMPLEMENTATION GUIDE - DailyLesson Real System

## OBJECTIVE
Replace the existing strategic lessons system with RealLessonPlayer component that uses actual assets and data.

## ⚠️ CRITICAL INSTRUCTIONS FOR CURSOR

### DO NOT:
- ❌ Merge with existing modal code
- ❌ Keep any "EnhancedLessonModal" components
- ❌ Use fake customization features
- ❌ Keep placeholder audio paths
- ❌ Modify the RealLessonPlayer code provided

### DO:
- ✅ Complete replacement of strategic lessons system
- ✅ Use provided RealLessonPlayer component exactly as written
- ✅ Save as new file: `/components/RealLessonPlayer.jsx`
- ✅ Update imports in main pages to use new component
- ✅ Preserve existing Ken image files and audio directory structure

## 📁 FILE STRUCTURE REQUIREMENTS

```
/components/
  └── RealLessonPlayer.jsx (NEW - create this file)

/public/
  ├── ken-wallpaper.jpg (EXISTING - keep)
  ├── ken-correct-answer.jpg (EXISTING - keep)
  ├── ken-wrong-answer.jpg (EXISTING - keep)
  ├── ken-fortune.jpg (EXISTING - keep)
  └── generated-audio/
      └── strategic-lessons/
          ├── day-2-script-*.mp3 (EXISTING - 397 files)
          ├── day-7-script-*.mp3 (EXISTING)
          ├── day-18-script-*.mp3 (EXISTING)
          └── [other lesson audio files] (EXISTING)
```

## 🔧 IMPLEMENTATION STEPS

### Step 1: Create RealLessonPlayer Component
```bash
# Create new component file
touch components/RealLessonPlayer.jsx
```

### Step 2: Copy Component Code
Copy the complete RealLessonPlayer component code (provided separately) into `/components/RealLessonPlayer.jsx`

### Step 3: Update Main Page Import
```javascript
// In your strategic lessons page file
// REMOVE old imports like:
// import EnhancedLessonModal from './components/EnhancedLessonModal';

// ADD new import:
import RealLessonPlayer from './components/RealLessonPlayer';
```

### Step 4: Replace Page Content
```javascript
// REPLACE existing strategic lessons page content with:
export default function StrategicLessonsPage() {
  return <RealLessonPlayer />;
}
```

## 🎯 SYSTEM SPECIFICATIONS

### Real Audio Files (397 total)
- **Location**: `/public/generated-audio/strategic-lessons/`
- **Naming Pattern**: `day-{DAY}-script-{SEGMENT}-{DESCRIPTION}.mp3`
- **Strategic Days**: 2, 7, 18, 53, 67, 72, 79, 160
- **Segments per lesson**: ~10 files (intro, questions, feedback, fortune)

### Ken Image System
- **Wallpaper**: `/ken-wallpaper.jpg` (default/intro)
- **Correct Answer**: `/ken-correct-answer.jpg`
- **Wrong Answer**: `/ken-wrong-answer.jpg`
- **Fortune**: `/ken-fortune.jpg`

### API Endpoints (Cloudflare Workers)
- **Base URL**: `http://localhost:8787` (dev) / `https://api.dailylesson.org` (prod)
- **Lesson Data**: `/api/lesson/{day}`
- **Health Check**: `/api/health`

### Payment Integration Points
- **Free Lesson**: Day 7 only
- **Paid Lessons**: Days 2, 18, 53, 67, 72, 79, 160 ($4.99 each)
- **Payment Modal**: Built-in simple Stripe integration ready

## ✅ TESTING CHECKLIST

After implementation, verify:

1. **Component Loads**: Page displays without errors
2. **Audio Files**: Day 7 audio plays correctly
3. **Ken Images**: Ken wallpaper displays properly
4. **Lesson Selection**: Can click on different lesson days
5. **Payment Modal**: Shows for paid lessons (Days 2, 18, etc.)
6. **API Connection**: Console shows successful API calls or graceful fallback

## 🚨 TROUBLESHOOTING

### If audio doesn't play:
```bash
# Verify audio files exist
ls -la public/generated-audio/strategic-lessons/day-7*
```

### If Ken images don't show:
```bash
# Verify Ken images exist
ls -la public/ken-*.jpg
```

### If API calls fail:
```bash
# Start Cloudflare Workers
cd backend
wrangler dev --port 8787
```

## 📞 EXPECTED CONSOLE OUTPUT

Successful implementation should show:
```
🔍 Loading lesson data for Day 7
✅ Loaded lesson data: {...}
🔊 Playing: /generated-audio/strategic-lessons/day-7-script-1-intro_question1.mp3
✅ Audio ready: [audio file path]
```

## 🎯 SUCCESS CRITERIA

Implementation is complete when:
- ✅ Day 7 lesson plays audio correctly
- ✅ Ken image appears and changes during lesson
- ✅ Audio controls work (play/pause)
- ✅ Payment modal appears for paid lessons
- ✅ No console errors related to missing files
- ✅ Clean, functional interface matching design

## 🚀 NEXT STEPS (After Implementation)

1. **Test Day 7 thoroughly** (free lesson)
2. **Add Stripe integration** to payment modal
3. **Test paid lesson flow** (Day 2, 18, etc.)
4. **Deploy to production**
5. **Launch with real customers**

---

**REMEMBER**: This is a complete replacement, not a modification. The old modal system should be completely removed and replaced with this real, working system that uses actual audio files and data.