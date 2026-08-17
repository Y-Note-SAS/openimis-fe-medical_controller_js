export const formatMonthYear = (dateString) => {
    if (!dateString || typeof dateString !== "string") {
        return "";
    }

    const [year, month, day] = dateString.split("-").map(Number);

    if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
        return "";
    }

    const date = new Date(year, month - 1, day);

    const result = date.toLocaleDateString("fr-FR", {
        month: "long",
        year: "numeric",
    });

    return result.charAt(0).toUpperCase() + result.slice(1);
};

export const getMonth = (dateString) => {
    if (!dateString || typeof dateString !== "string") {
        return null;
    }

    const parts = dateString.split("-").map(Number);
    const [, month] = parts;
    return Number.isFinite(month) ? month : null;
};

export const getYear = (dateString) => {
    if (!dateString || typeof dateString !== "string") {
        return null;
    }

    const parts = dateString.split("-").map(Number);
    const [year] = parts;
    return Number.isFinite(year) ? year : null;
};

export const getFirstDayOfMonth = (year, month) => {
    const mm = String(month).padStart(2, '0');
    return `${year}-${mm}-01`;
};

export const getLastDayOfMonth = (year, month) => {
  const mm = String(month).padStart(2, '0');
  const lastDay = new Date(year, month, 0).getDate();
  return `${year}-${mm}-${String(lastDay).padStart(2, '0')}`;
};