// Simple Express.js API for Universal Lessons
const express = require('express');
const path = require('path');
const app = express();

// Middleware
app.use(express.json());
app.use(express.static('public')); // Put your HTML in /public folder

// Simplified lesson DNA (just the essentials)
const lessonDNA = {
  negotiation_skills: {
    title: "Collaborative Problem Solving",
    concept: "Understanding others' interests creates better solutions",
    ageExamples: {
      early_childhood: "when you and a friend both want the same toy",
      youth: "when your group disagrees about weekend plans", 
      young_adult: "when roommates disagree about household decisions",
      midlife: "when family members have different preferences",
      wisdom_years: "when helping others find common ground"
    }
  }
  // Add other lessons here...
};

// Tone patterns
const tonePatterns = {
  grandmother: {
    opening: ["Oh sweetheart,", "My dear,", "Precious one,"],
    encouragement: ["What a wise soul you are!", "You have such insight!"],
    closing: ["Rest well, dear heart", "What a treasure you are"]
  },
  fun: {
    opening: ["Alright superstar!", "Ready to level up?", "Time for magic!"],
    encouragement: ["BOOM! You nailed it!", "You're crushing this!"],
    closing: ["You're going to be amazing!", "See you tomorrow, champion!"]
  },
  neutral: {
    opening: ["Today we're exploring", "Let's examine", "Here's what's important"],
    encouragement: ["Excellent thinking", "You understand", "That's exactly right"],
    closing: ["This foundation will serve you well", "You've built valuable skills"]
  }
};

// Simple lesson generator
function generateLesson(lessonId, age, tone, language = 'english') {
  const lesson = lessonDNA[lessonId];
  if (!lesson) throw new Error('Lesson not found');
  
  const ageCategory = getAgeCategory(age);
  const tonePattern = tonePatterns[tone];
  const example = lesson.ageExamples[ageCategory];
  
  return {
    metadata: {
      title: lesson.title,
      age: age,
      ageCategory: ageCategory,
      tone: tone,
      language: language,
      generatedAt: new Date().toISOString()
    },
    scripts: [
      {
        type: "opening",
        voiceText: `${randomChoice(tonePattern.opening)} ${lesson.title} is about ${lesson.concept}. Let's explore this together.`
      },
      {
        type: "example",
        voiceText: `Imagine ${example}. This is a perfect time to practice ${lesson.concept}.`
      },
      {
        type: "question",
        voiceText: `What do you think works better - trying to convince others you're right, or understanding what they really need?`
      },
      {
        type: "encouragement", 
        voiceText: `${randomChoice(tonePattern.encouragement)} ${randomChoice(tonePattern.closing)}`
      }
    ]
  };
}

function getAgeCategory(age) {
  if (age <= 7) return 'early_childhood';
  if (age <= 17) return 'youth';
  if (age <= 35) return 'young_adult'; 
  if (age <= 65) return 'midlife';
  return 'wisdom_years';
}

function randomChoice(array) {
  return array[Math.floor(Math.random() * array.length)];
}

// API Routes
app.get('/api/lessons', (req, res) => {
  res.json(Object.keys(lessonDNA));
});

app.post('/api/generate', (req, res) => {
  try {
    const { lessonId, age, tone, language } = req.body;
    
    // Validate inputs
    if (!lessonId || !age || !tone) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const lesson = generateLesson(lessonId, age, tone, language);
    res.json(lesson);
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Serve frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🎓 Universal Lessons API running on port ${PORT}`);
});

// Export for serverless deployment
module.exports = app;