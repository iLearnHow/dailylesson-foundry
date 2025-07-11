import React from 'react';

export default function About() {
  return (
    <div className="max-w-3xl mx-auto p-8">
      <h1 className="text-4xl font-bold mb-4">About Us</h1>
      <p className="mb-6 text-lg">Empowering every learner with instant, high-quality, personalized daily lessons—anywhere, anytime.</p>
      <h2 className="text-2xl font-semibold mt-6 mb-2">Our Mission</h2>
      <p className="mb-4">To make world-class, adaptive education accessible to all through automation, transparency, and robust monitoring.</p>
      <h2 className="text-2xl font-semibold mt-6 mb-2">Our Vision</h2>
      <p className="mb-4">A world where every student has access to daily, personalized learning powered by technology and real curriculum data.</p>
      <h2 className="text-2xl font-semibold mt-6 mb-2">Team</h2>
      <ul className="mb-4 list-disc list-inside">
        <li>Founder: [Your Name]</li>
        <li>Contributors: [List key contributors]</li>
        <li>Advisors: [List advisors]</li>
      </ul>
      <h2 className="text-2xl font-semibold mt-6 mb-2">Contact</h2>
      <p>Email: <a href="mailto:info@mynextlesson.com" className="text-blue-600 underline">info@mynextlesson.com</a></p>
    </div>
  );
} 