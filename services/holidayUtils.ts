// US Bank Holidays and T+2 Settlement Utilities

export function parseUTCDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export function formatUTCDate(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getNthWeekdayOfMonth(year: number, month: number, weekday: number, n: number): Date {
  if (n > 0) {
    let count = 0;
    for (let day = 1; day <= 31; day++) {
      const d = new Date(Date.UTC(year, month, day));
      if (d.getUTCMonth() !== month) break;
      if (d.getUTCDay() === weekday) {
        count++;
        if (count === n) return d;
      }
    }
  } else {
    for (let day = 31; day >= 1; day--) {
      const d = new Date(Date.UTC(year, month, day));
      if (d.getUTCMonth() === month && d.getUTCDay() === weekday) {
        return d;
      }
    }
  }
  return new Date(Date.UTC(year, month, 1));
}

function getFixedHolidayObserved(year: number, month: number, day: number): Date {
  const d = new Date(Date.UTC(year, month, day));
  const dow = d.getUTCDay();
  if (dow === 0) { // Sunday -> observed Monday
    return new Date(Date.UTC(year, month, day + 1));
  } else if (dow === 6) { // Saturday -> observed Friday
    return new Date(Date.UTC(year, month, day - 1));
  }
  return d;
}

export interface HolidayInfo {
  name: string;
  dateStr: string;
}

export function getUSBankHolidaysForYear(year: number): HolidayInfo[] {
  const holidays: HolidayInfo[] = [];

  const fixed = [
    { name: "New Year's Day", m: 0, d: 1 },
    { name: "Juneteenth National Independence Day", m: 5, d: 19 },
    { name: "Independence Day", m: 6, d: 4 },
    { name: "Veterans Day", m: 10, d: 11 },
    { name: "Christmas Day", m: 11, d: 25 }
  ];

  fixed.forEach(f => {
    const actual = new Date(Date.UTC(year, f.m, f.d));
    const obs = getFixedHolidayObserved(year, f.m, f.d);
    
    holidays.push({ name: f.name, dateStr: formatUTCDate(actual) });
    if (formatUTCDate(obs) !== formatUTCDate(actual)) {
      holidays.push({ name: `${f.name} (Observed)`, dateStr: formatUTCDate(obs) });
    }
  });

  holidays.push({ name: "Martin Luther King Jr. Day", dateStr: formatUTCDate(getNthWeekdayOfMonth(year, 0, 1, 3)) });
  holidays.push({ name: "Washington's Birthday (Presidents' Day)", dateStr: formatUTCDate(getNthWeekdayOfMonth(year, 1, 1, 3)) });
  holidays.push({ name: "Memorial Day", dateStr: formatUTCDate(getNthWeekdayOfMonth(year, 4, 1, -1)) });
  holidays.push({ name: "Labor Day", dateStr: formatUTCDate(getNthWeekdayOfMonth(year, 8, 1, 1)) });
  holidays.push({ name: "Columbus Day", dateStr: formatUTCDate(getNthWeekdayOfMonth(year, 9, 1, 2)) });
  holidays.push({ name: "Thanksgiving Day", dateStr: formatUTCDate(getNthWeekdayOfMonth(year, 10, 4, 4)) });

  // Good Friday (Friday before Easter)
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  const easter = new Date(Date.UTC(year, month - 1, day));
  const gf = new Date(easter);
  gf.setUTCDate(gf.getUTCDate() - 2);
  holidays.push({ name: "Good Friday", dateStr: formatUTCDate(gf) });

  return holidays;
}

export function isUSBankHoliday(dateStr: string): HolidayInfo | null {
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return null;
  const [y] = dateStr.split('-').map(Number);
  const holidays = getUSBankHolidaysForYear(y);
  const prevHolidays = getUSBankHolidaysForYear(y - 1);
  const nextHolidays = getUSBankHolidaysForYear(y + 1);
  const all = [...prevHolidays, ...holidays, ...nextHolidays];
  return all.find(h => h.dateStr === dateStr) || null;
}

export function isBusinessDay(dateStr: string): boolean {
  const d = parseUTCDate(dateStr);
  const dow = d.getUTCDay();
  if (dow === 0 || dow === 6) return false;
  if (isUSBankHoliday(dateStr)) return false;
  return true;
}

export function getTPlusTwoSettlementString(tradeDateStr?: string): string {
  const startStr = tradeDateStr || getTodayDateString();
  let current = parseUTCDate(startStr);
  let added = 0;
  while (added < 2) {
    current.setUTCDate(current.getUTCDate() + 1);
    const dateStr = formatUTCDate(current);
    if (isBusinessDay(dateStr)) {
      added++;
    }
  }
  return formatUTCDate(current);
}
