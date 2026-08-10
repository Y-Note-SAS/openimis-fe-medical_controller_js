export const formatMonthYear = (dateString) => {
    const [year, month, day] = dateString.split("-").map(Number);

    const date = new Date(year, month - 1, day);

    const result = date.toLocaleDateString("fr-FR", {
        month: "long",
        year: "numeric",
    });

    return result.charAt(0).toUpperCase() + result.slice(1);
};

export const getFirstDayOfMonth = (year, month) => {
    const mm = String(month).padStart(2, '0');
    return `${year}-${mm}-01`;
};