import { describe, expect, it } from 'vitest';
import { parseWasteBankRangeDate } from '../dateRange.mjs';

describe('parseWasteBankRangeDate', () => {
    const now = new Date(2026, 6, 29, 12, 0, 0);

    it('uses the selected month and year', () => {
        const result = parseWasteBankRangeDate({ month: '2', year: '2026' }, now);

        expect(result.startDate).toEqual(new Date(2026, 1, 1, 0, 0, 0));
        expect(result.endDate).toEqual(new Date(2026, 2, 0, 23, 59, 59));
    });

    it('supports an inclusive month range', () => {
        const result = parseWasteBankRangeDate(
            { monthFrom: '2', monthTo: '4', year: '2026' },
            now
        );

        expect(result.startDate).toEqual(new Date(2026, 1, 1, 0, 0, 0));
        expect(result.endDate).toEqual(new Date(2026, 4, 0, 23, 59, 59));
    });

    it('preserves the historical quick-filter behavior', () => {
        const result = parseWasteBankRangeDate({ quickFilter: '3' }, now);

        expect(result.startDate).toEqual(new Date(2026, 4, 1, 0, 0, 0));
        expect(result.endDate).toEqual(new Date(2026, 7, 0, 23, 59, 59));
    });

    it('defaults to the current month', () => {
        const result = parseWasteBankRangeDate({}, now);

        expect(result.startDate).toEqual(new Date(2026, 6, 1, 0, 0, 0));
        expect(result.endDate).toEqual(new Date(2026, 7, 0, 23, 59, 59));
    });
});
