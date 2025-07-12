import React from 'react';

export default function LearnMore() {
  return (
    <div className="max-w-3xl mx-auto p-8">
      <h1 className="text-4xl font-bold mb-4">How It Works</h1>
      <p className="mb-6 text-lg">Our system delivers instant, high-quality, personalized daily lessons using real curriculum data and DNA-powered adaptation.</p>
      <h2 className="text-2xl font-semibold mt-6 mb-2">Lesson Generation</h2>
      <p className="mb-4">Lessons are pre-generated for every age, tone, language, and day, ensuring instant access and reliability. If a lesson is missing, it is generated on-demand and stored for future use.</p>
      <h2 className="text-2xl font-semibold mt-6 mb-2">Automation & Monitoring</h2>
      <p className="mb-4">The system automatically checks for missing or low-quality lessons and triggers generation as needed. All fallback events are logged and reviewed for quality improvement.</p>
      <h2 className="text-2xl font-semibold mt-6 mb-2">Fallbacks & Transparency</h2>
      <p className="mb-4">If a lesson is missing, the UI explains what happened and why, turning errors into learning moments. Monitoring dashboards and public APIs provide transparency into system health.</p>
      <h2 className="text-2xl font-semibold mt-6 mb-2">Student Feedback</h2>
      <p>Every fallback or error is logged and used to improve the system, making students active participants in quality assurance.</p>
    </div>
  );
} 