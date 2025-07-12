import DailyFortuneSystem from '../components/DailyFortuneSystem';

export default function MyNextLesson() {
  // Optionally, handle lesson selection from calendar
  const handleLessonSelect = (year, month, day) => {
    // TODO: Load lesson for the selected date
    // For now, just log
    console.log('Selected lesson:', { year, month, day });
  };
  return <DailyFortuneSystem onLessonSelect={handleLessonSelect} />;
} 