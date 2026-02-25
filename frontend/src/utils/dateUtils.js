/**
 * Formats a date string or object to DD/MM/YYYY
 * @param {string|Date} dateVal 
 * @returns {string}
 */
export const formatDate = (dateVal) => {
    if (!dateVal) return '-';
    const date = new Date(dateVal);
    if (isNaN(date.getTime())) return dateVal;

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
};
