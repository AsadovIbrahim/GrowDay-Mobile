/**
 * Safely parses a YYYY-MM-DD date string (or ISO date string) into a local Date object 
 * set to midnight (00:00:00) in the user's local timezone.
 * Prevents UTC timezone shift where new Date('2026-07-20') parses as UTC midnight
 * and shifts to July 19th in timezones behind UTC (like US/iOS Simulator VM defaults).
 */
export const parseLocalDate = (dateInput) => {
    if (!dateInput) {
        const d = new Date();
        d.setHours(0, 0, 0, 0);
        return d;
    }
    if (dateInput instanceof Date) {
        const d = new Date(dateInput);
        d.setHours(0, 0, 0, 0);
        return d;
    }
    const str = String(dateInput);
    const cleanStr = str.includes('T') ? str.split('T')[0] : str;
    const parts = cleanStr.split('-');
    if (parts.length === 3) {
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);
        if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
            return new Date(year, month, day, 0, 0, 0, 0);
        }
    }
    const d = new Date(dateInput);
    d.setHours(0, 0, 0, 0);
    return d;
};

/**
 * Returns YYYY-MM-DD formatted string in local time.
 */
export const getLocalDateString = (d = new Date()) => {
    const dateObj = typeof d === 'string' ? parseLocalDate(d) : d;
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};
