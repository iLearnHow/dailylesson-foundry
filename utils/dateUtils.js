// Date utility functions for DailyLesson Foundry

export function getDayOfYear(date) {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date - start;
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.floor(diff / oneDay);
}

export function getDateFromDayOfYear(year, dayOfYear) {
  const date = new Date(year, 0, dayOfYear);
  return date.toISOString().split('T')[0];
}

export function formatDateForUrl(date) {
  return date.replace(/-/g, '');
}

export function getCurrentDayOfYear() {
  return getDayOfYear(new Date());
}

export function getDateString(dayOfYear, year = 2025) {
  return getDateFromDayOfYear(year, dayOfYear);
}

export function getMonthName(dayOfYear) {
  const date = new Date(2025, 0, dayOfYear);
  return date.toLocaleDateString('en-US', { month: 'long' });
}

export function getDayOfMonth(dayOfYear) {
  const date = new Date(2025, 0, dayOfYear);
  return date.getDate();
}

export function getWeekday(dayOfYear) {
  const date = new Date(2025, 0, dayOfYear);
  return date.toLocaleDateString('en-US', { weekday: 'long' });
}

export function generateAllDays() {
  const days = [];
  for (let day = 1; day <= 365; day++) {
    const date = new Date(2025, 0, day);
    const dateString = date.toISOString().split('T')[0];
    const formattedDate = dateString.replace(/-/g, '');
    
    days.push({
      dayOfYear: day,
      date: dateString,
      formattedDate,
      month: getMonthName(day),
      dayOfMonth: getDayOfMonth(day),
      weekday: getWeekday(day)
    });
  }
  return days;
} 