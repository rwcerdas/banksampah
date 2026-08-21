/**
 * Preserve the date-range semantics historically used by the Waste Bank
 * dashboard and reports. Keeping this helper request-agnostic makes the behavior
 * testable without Express or MongoDB.
 */
export const parseWasteBankRangeDate = (query = {}, now = new Date()) => {
    const { monthFrom, monthTo, year, quickFilter } = query;
    let startDate;
    let endDate;

    if (quickFilter) {
        const months = parseInt(quickFilter);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - months + 1);
        startDate.setDate(1);
        startDate.setHours(0, 0, 0, 0);
    } else if (monthFrom && monthTo && year) {
        startDate = new Date(parseInt(year), parseInt(monthFrom) - 1, 1, 0, 0, 0);
        endDate = new Date(parseInt(year), parseInt(monthTo), 0, 23, 59, 59);
    } else {
        const month = parseInt(query.month) || now.getMonth() + 1;
        const selectedYear = parseInt(query.year) || now.getFullYear();
        startDate = new Date(selectedYear, month - 1, 1, 0, 0, 0);
        endDate = new Date(selectedYear, month, 0, 23, 59, 59);
    }

    return { startDate, endDate };
};

export default parseWasteBankRangeDate;
