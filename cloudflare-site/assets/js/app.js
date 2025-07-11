
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
        
        const response = await fetch(`/api/lessons.json`);
        const lessons = await response.json();
        
        const todaysLesson = lessons.find(lesson => lesson.day === dayOfYear);
        
        if (todaysLesson) {
            displayTodaysLesson(todaysLesson);
        }
    } catch (error) {
        console.error('Error loading today's lesson:', error);
    }
}

function displayTodaysLesson(lesson) {
    const container = document.getElementById('today-lesson-content');
    if (container) {
        container.innerHTML = `
            <h3>${lesson.title}</h3>
            <p>${lesson.learning_objective}</p>
            <a href="/lessons/day-${lesson.day}/" class="btn primary">Start Today's Lesson</a>
        `;
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
        const response = await fetch(`/api/search.json`);
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
        
        const resultsHTML = results.slice(0, 10).map(lessonId => `
            <div class="search-result">
                <h4>${lessonId}</h4>
                <a href="/lessons/${lessonId}/" class="btn secondary">View Lesson</a>
            </div>
        `).join('');
        
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
    currentUrl.pathname = currentUrl.pathname.replace(/\/age-\d+\//, `/age-${age}/`);
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
