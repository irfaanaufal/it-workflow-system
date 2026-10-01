/**
 * Generate array of page numbers to display in mobile pagination.
 * Shows at most 5 page buttons with smart windowing.
 */
export function getMobilePageNumbers(currentPage, totalPages) {
    const pages = [];
    if (totalPages <= 5) {
        for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else if (currentPage <= 3) {
        for (let i = 1; i <= 5; i++) pages.push(i);
    } else if (currentPage >= totalPages - 2) {
        for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i);
    } else {
        for (let i = currentPage - 2; i <= currentPage + 2; i++) pages.push(i);
    }
    return pages;
}
