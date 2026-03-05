export const formatCurrency = (amount) => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const curr = user.currency || 'UZS';
    const num = Number(amount || 0);
    if (curr === 'USD') return `$${num.toLocaleString()}`;
    return `${num.toLocaleString()} UZS`;
};
