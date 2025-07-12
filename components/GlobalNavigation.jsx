import React, { useState } from 'react';
import Link from 'next/link';
import { generateAllDays, getCurrentDayOfYear } from '../utils/dateUtils';

export default function GlobalNavigation() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const allDays = generateAllDays();
  const currentDayOfYear = getCurrentDayOfYear();
  
  // Group days by month
  const daysByMonth = allDays.reduce((acc, day) => {
    if (!acc[day.month]) {
      acc[day.month] = [];
    }
    acc[day.month].push(day);
    return acc;
  }, {});
  
  const months = Object.keys(daysByMonth);
  
  return (
    <nav className="bg-white shadow-lg border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and main nav */}
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0">
              <h1 className="text-2xl font-bold text-blue-600">MyNextLesson</h1>
            </Link>
            
            <div className="hidden md:ml-6 md:flex md:space-x-8">
              <Link href="/" className="text-gray-900 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium">
                Home
              </Link>
              <Link href="/about" className="text-gray-900 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium">
                About
              </Link>
              <Link href="/how-it-works" className="text-gray-900 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium">
                How It Works
              </Link>
              <Link href="/advanced-lesson" className="text-gray-900 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium">
                Advanced Generator
              </Link>
            </div>
          </div>
          
          {/* Today's lesson button */}
          <div className="flex items-center">
            <Link 
              href={`/daily-lesson/${allDays[currentDayOfYear - 1]?.formattedDate || '20250101'}`}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              Today's Lesson
            </Link>
          </div>
          
          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-900 hover:text-blue-600 p-2"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link href="/" className="text-gray-900 hover:text-blue-600 block px-3 py-2 rounded-md text-base font-medium">
              Home
            </Link>
            <Link href="/about" className="text-gray-900 hover:text-blue-600 block px-3 py-2 rounded-md text-base font-medium">
              About
            </Link>
            <Link href="/how-it-works" className="text-gray-900 hover:text-blue-600 block px-3 py-2 rounded-md text-base font-medium">
              How It Works
            </Link>
            <Link href="/advanced-lesson" className="text-gray-900 hover:text-blue-600 block px-3 py-2 rounded-md text-base font-medium">
              Advanced Generator
            </Link>
          </div>
        </div>
      )}
      
      {/* Calendar Navigation */}
      <div className="bg-gray-50 border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Daily Lessons Calendar</h3>
          
          {/* Month selector */}
          <div className="flex flex-wrap gap-2 mb-4">
            {months.map((month) => (
              <button
                key={month}
                onClick={() => setSelectedMonth(selectedMonth === month ? null : month)}
                className={`px-3 py-1 rounded-md text-sm font-medium ${
                  selectedMonth === month 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-white text-gray-700 hover:bg-gray-100 border'
                }`}
              >
                {month}
              </button>
            ))}
          </div>
          
          {/* Days grid */}
          <div className="grid grid-cols-7 md:grid-cols-14 lg:grid-cols-31 gap-1">
            {allDays.map((day) => {
              const isCurrentDay = day.dayOfYear === currentDayOfYear;
              const isSelectedMonth = !selectedMonth || day.month === selectedMonth;
              
              if (!isSelectedMonth) return null;
              
              return (
                <Link
                  key={day.dayOfYear}
                  href={`/daily-lesson/${day.formattedDate}`}
                  className={`p-2 text-center text-xs rounded-md hover:bg-blue-100 transition-colors ${
                    isCurrentDay 
                      ? 'bg-blue-600 text-white font-bold' 
                      : 'bg-white text-gray-700 border hover:border-blue-300'
                  }`}
                  title={`${day.weekday}, ${day.month} ${day.dayOfMonth} - Day ${day.dayOfYear}`}
                >
                  <div className="font-medium">{day.dayOfMonth}</div>
                  <div className="text-xs opacity-75">{day.dayOfYear}</div>
                </Link>
              );
            })}
          </div>
          
          {/* Quick navigation */}
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="text-sm text-gray-600">Quick Jump:</span>
            {[1, 32, 60, 91, 121, 152, 182, 213, 244, 274, 305, 335].map((dayOfYear) => {
              const day = allDays[dayOfYear - 1];
              if (!day) return null;
              
              return (
                <Link
                  key={dayOfYear}
                  href={`/daily-lesson/${day.formattedDate}`}
                  className="text-sm text-blue-600 hover:text-blue-800 underline"
                >
                  {day.month}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
} 