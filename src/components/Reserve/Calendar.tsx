import { useState } from 'react';
import './Calendar.css';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

function toDateStr(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

interface CalendarProps {
  reservedDates: Set<string>;
  selectedDate: string;
  onSelectDate: (date: string) => void;
}

export function Calendar({ reservedDates, selectedDate, onSelectDate }: CalendarProps) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const todayStr = toDateStr(today.getFullYear(), today.getMonth(), today.getDate());

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const prev = () => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  };

  const next = () => {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  };

  const canGoPrev = viewYear > today.getFullYear() || (viewYear === today.getFullYear() && viewMonth > today.getMonth());

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(<div key={`e${i}`} className="calendar-cell empty" />);

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = toDateStr(viewYear, viewMonth, d);
    const isPast = dateStr < todayStr;
    const isReserved = reservedDates.has(dateStr);
    const isSelected = dateStr === selectedDate;
    const isToday = dateStr === todayStr;
    const disabled = isPast || isReserved;

    let cls = 'calendar-cell calendar-day';
    if (isPast) cls += ' calendar-day--past';
    if (isReserved && !isPast) cls += ' calendar-day--reserved';
    if (isSelected) cls += ' calendar-day--selected';
    if (isToday) cls += ' calendar-day--today';

    cells.push(
      <button
        key={d}
        className={cls}
        disabled={disabled}
        onClick={() => onSelectDate(dateStr)}
        aria-label={`${MONTHS[viewMonth]} ${d}, ${viewYear}${isReserved ? ' (reserved)' : ''}`}
        type="button"
      >
        {d}
      </button>
    );
  }

  return (
    <div className="calendar">
      <div className="calendar-nav">
        <button
          type="button"
          className="calendar-nav-btn"
          onClick={prev}
          disabled={!canGoPrev}
          aria-label="Previous month"
        >
          ‹
        </button>
        <span className="calendar-month-label">{MONTHS[viewMonth]} {viewYear}</span>
        <button
          type="button"
          className="calendar-nav-btn"
          onClick={next}
          aria-label="Next month"
        >
          ›
        </button>
      </div>
      <div className="calendar-header">
        {DAYS.map(d => <div key={d} className="calendar-cell calendar-weekday">{d}</div>)}
      </div>
      <div className="calendar-grid">
        {cells}
      </div>
    </div>
  );
}
