import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { FiCalendar, FiChevronLeft, FiChevronRight, FiX } from 'react-icons/fi';

interface PersianDatePickerProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  minYear?: number;
  maxYear?: number;
  error?: string;
  disablePast?: boolean;
}

const monthNames = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'];
const weekDays = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'];
const persianDigits = '۰۱۲۳۴۵۶۷۸۹';

const toPersianDigits = (value: string | number) => String(value).replace(/\d/g, digit => persianDigits[Number(digit)]);
const toLatinDigits = (value: string) => value
  .replace(/[۰-۹]/g, digit => String(persianDigits.indexOf(digit)))
  .replace(/[٠-٩]/g, digit => String('٠١٢٣٤٥٦٧٨٩'.indexOf(digit)));

const div = (a: number, b: number) => Math.trunc(a / b);
const mod = (a: number, b: number) => a - Math.trunc(a / b) * b;

const jalCal = (jy: number) => {
  const breaks = [-61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181, 1210, 1635, 2060, 2097, 2192, 2262, 2324, 2394, 2456, 3178];
  const gy = jy + 621;
  let leapJ = -14;
  let jp = breaks[0];
  let jump = 0;
  if (jy < jp || jy >= breaks[breaks.length - 1]) throw new Error('Invalid Jalaali year');
  for (let i = 1; i < breaks.length; i += 1) {
    const jm = breaks[i];
    jump = jm - jp;
    if (jy < jm) break;
    leapJ += div(jump, 33) * 8 + div(mod(jump, 33), 4);
    jp = jm;
  }
  let n = jy - jp;
  leapJ += div(n, 33) * 8 + div(mod(n, 33) + 3, 4);
  if (mod(jump, 33) === 4 && jump - n === 4) leapJ += 1;
  const leapG = div(gy, 4) - div((div(gy, 100) + 1) * 3, 4) - 150;
  const march = 20 + leapJ - leapG;
  if (jump - n < 6) n = n - jump + div(jump + 4, 33) * 33;
  let leap = mod(mod(n + 1, 33) - 1, 4);
  if (leap === -1) leap = 4;
  return { leap, gy, march };
};

const g2d = (gy: number, gm: number, gd: number) => {
  let d = div((gy + div(gm - 8, 6) + 100100) * 1461, 4)
    + div(153 * mod(gm + 9, 12) + 2, 5) + gd - 34840408;
  d = d - div(div(gy + 100100 + div(gm - 8, 6), 100) * 3, 4) + 752;
  return d;
};

const d2g = (jdn: number) => {
  let j = 4 * jdn + 139361631;
  j = j + div(div(4 * jdn + 183187720, 146097) * 3, 4) * 4 - 3908;
  const i = div(mod(j, 1461), 4) * 5 + 308;
  const gd = div(mod(i, 153), 5) + 1;
  const gm = mod(div(i, 153), 12) + 1;
  const gy = div(j, 1461) - 100100 + div(8 - gm, 6);
  return { gy, gm, gd };
};

const jalaliToGregorian = (jy: number, jm: number, jd: number) => {
  const r = jalCal(jy);
  return d2g(g2d(r.gy, 3, r.march) + (jm - 1) * 31 - div(jm, 7) * (jm - 7) + jd - 1);
};

const getToday = () => {
  const parts = new Intl.DateTimeFormat('en-US-u-ca-persian', { year: 'numeric', month: 'numeric', day: 'numeric' }).formatToParts(new Date());
  const find = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find(part => part.type === type)?.value || 1);
  return { year: find('year'), month: find('month'), day: find('day') };
};

const parseDate = (value: string) => {
  const match = toLatinDigits(value).match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/);
  if (!match) return null;
  return { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) };
};

const PersianDatePicker: React.FC<PersianDatePickerProps> = ({ value, onChange, label = 'تاریخ تولد شمسی', minYear = 1300, maxYear, error, disablePast = false }) => {
  const today = useMemo(() => getToday(), []);
  const inputId = useId();
  const selected = parseDate(value);
  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(selected?.year || today.year);
  const [viewMonth, setViewMonth] = useState(selected?.month || today.month);
  const rootRef = useRef<HTMLDivElement>(null);
  const finalMaxYear = maxYear || today.year;
  const errorId = `${inputId}-error`;

  useEffect(() => {
    if (!open) return;
    const closeOnOutside = (event: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpen(false); };
    document.addEventListener('pointerdown', closeOnOutside);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOnOutside);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [open]);

  const firstGregorian = jalaliToGregorian(viewYear, viewMonth, 1);
  const firstWeekDay = (new Date(firstGregorian.gy, firstGregorian.gm - 1, firstGregorian.gd).getDay() + 1) % 7;
  const nextMonth = viewMonth === 12 ? { year: viewYear + 1, month: 1 } : { year: viewYear, month: viewMonth + 1 };
  const nextGregorian = jalaliToGregorian(nextMonth.year, nextMonth.month, 1);
  const daysInMonth = Math.round((Date.UTC(nextGregorian.gy, nextGregorian.gm - 1, nextGregorian.gd) - Date.UTC(firstGregorian.gy, firstGregorian.gm - 1, firstGregorian.gd)) / 86400000);

  const moveMonth = (direction: -1 | 1) => {
    const next = viewMonth + direction;
    if (next < 1 && viewYear > minYear) { setViewYear(viewYear - 1); setViewMonth(12); }
    else if (next > 12 && viewYear < finalMaxYear) { setViewYear(viewYear + 1); setViewMonth(1); }
    else if (next >= 1 && next <= 12) setViewMonth(next);
  };

  const selectDay = (day: number) => {
    onChange(`${viewYear}/${String(viewMonth).padStart(2, '0')}/${String(day).padStart(2, '0')}`);
    setOpen(false);
  };

  const selectToday = () => {
    setViewYear(today.year);
    setViewMonth(today.month);
    onChange(`${today.year}/${String(today.month).padStart(2, '0')}/${String(today.day).padStart(2, '0')}`);
    setOpen(false);
  };

  const handleTypedValue = (raw: string) => {
    const digits = toLatinDigits(raw).replace(/[^\d]/g, '').slice(0, 8);
    const formatted = [digits.slice(0, 4), digits.slice(4, 6), digits.slice(6, 8)].filter(Boolean).join('/');
    const parsed = parseDate(formatted);
    if (parsed && parsed.year >= minYear && parsed.year <= finalMaxYear && parsed.month >= 1 && parsed.month <= 12) {
      setViewYear(parsed.year);
      setViewMonth(parsed.month);
    }
    onChange(formatted);
  };

  const openPicker = () => {
    const parsed = parseDate(value);
    if (parsed && parsed.year >= minYear && parsed.year <= finalMaxYear && parsed.month >= 1 && parsed.month <= 12) {
      setViewYear(parsed.year);
      setViewMonth(parsed.month);
    }
    setOpen(true);
  };

  return (
    <div className="persian-datepicker" ref={rootRef}>
      <label className="form-label" htmlFor={inputId}><FiCalendar aria-hidden="true" /> {label}</label>
      <div className="persian-datepicker-input-wrap">
        <input
          id={inputId}
          className="form-input persian-datepicker-input"
          inputMode="numeric"
          autoComplete="bday"
          dir="ltr"
          placeholder="۱۴۰۰/۰۱/۰۱"
          value={toPersianDigits(value)}
          onChange={event => handleTypedValue(event.target.value)}
          onFocus={openPicker}
          onBlur={event => {
            const nextTarget = event.relatedTarget as Node | null;
            if (!nextTarget || !rootRef.current?.contains(nextTarget)) setOpen(false);
          }}
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          style={error ? { borderColor: '#dc2626' } : undefined}
        />
        <button type="button" className="persian-datepicker-trigger" onClick={() => setOpen(current => !current)} aria-label="باز کردن تقویم شمسی" aria-expanded={open}>
          <FiCalendar aria-hidden="true" />
        </button>
      </div>
      {error && <p id={errorId} className="profile-field-error" role="alert">{error}</p>}
      {open && <>
        <button type="button" className="persian-datepicker-backdrop" onClick={() => setOpen(false)} aria-label="بستن تقویم" />
        <div className="persian-datepicker-popover" role="dialog" aria-modal="false" aria-label="انتخاب تاریخ شمسی">
          <div className="persian-datepicker-mobile-head"><strong>{label}</strong><button type="button" onClick={() => setOpen(false)} aria-label="بستن"><FiX /></button></div>
          <div className="persian-datepicker-header">
            <button type="button" onClick={() => moveMonth(-1)} disabled={viewYear === minYear && viewMonth === 1} aria-label="ماه قبل"><FiChevronRight /></button>
            <div>
              <select aria-label="ماه" value={viewMonth} onChange={event => setViewMonth(Number(event.target.value))}>{monthNames.map((name, index) => <option key={name} value={index + 1}>{name}</option>)}</select>
              <select aria-label="سال" value={viewYear} onChange={event => setViewYear(Number(event.target.value))}>{Array.from({ length: finalMaxYear - minYear + 1 }, (_, index) => finalMaxYear - index).map(year => <option key={year} value={year}>{toPersianDigits(year)}</option>)}</select>
            </div>
            <button type="button" onClick={() => moveMonth(1)} disabled={viewYear === finalMaxYear && viewMonth === 12} aria-label="ماه بعد"><FiChevronLeft /></button>
          </div>
          <div className="persian-datepicker-weekdays" aria-hidden="true">{weekDays.map(day => <span key={day}>{day}</span>)}</div>
          <div className="persian-datepicker-grid">
            {Array.from({ length: firstWeekDay }, (_, index) => <span key={`blank-${index}`} />)}
            {Array.from({ length: daysInMonth }, (_, index) => index + 1).map(day => {
              const isSelected = selected?.year === viewYear && selected.month === viewMonth && selected.day === day;
              const isToday = today.year === viewYear && today.month === viewMonth && today.day === day;
              const isPast = disablePast && (viewYear < today.year
                || (viewYear === today.year && viewMonth < today.month)
                || (viewYear === today.year && viewMonth === today.month && day < today.day));
              return <button key={day} type="button" disabled={isPast} className={`${isSelected ? 'is-selected' : ''} ${isToday ? 'is-today' : ''}`} onClick={() => selectDay(day)} aria-pressed={isSelected}>{toPersianDigits(day)}</button>;
            })}
          </div>
          <div className="persian-datepicker-footer">
            <button type="button" onClick={selectToday}>انتخاب امروز</button>
            {value && <button type="button" onClick={() => { onChange(''); setOpen(false); }}>پاک کردن</button>}
          </div>
        </div>
      </>}
    </div>
  );
};

export default PersianDatePicker;
