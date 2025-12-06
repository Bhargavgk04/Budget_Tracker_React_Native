export const formatCurrency = (amount, currency = 'INR') => {
  if (currency === 'INR') {
    // Indian numbering system with lakhs and crores
    const formatter = new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
    return formatter.format(amount);
  }
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount);
};

export const formatDate = (date, format = 'DD/MM/YYYY') => {
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  
  switch (format) {
    case 'DD/MM/YYYY':
      return `${day}/${month}/${year}`;
    case 'MMM DD, YYYY':
      return d.toLocaleDateString('en-IN', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    default:
      return `${day}/${month}/${year}`;
  }
};

export const formatNumber = (num) => {
  if (num >= 10000000) {
    return (num / 10000000).toFixed(1) + ' Cr';
  } else if (num >= 100000) {
    return (num / 100000).toFixed(1) + ' L';
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
};

export const getRelativeTime = (date) => {
  const now = new Date();
  const diffInMs = now - new Date(date);
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  
  if (diffInDays === 0) return 'Today';
  if (diffInDays === 1) return 'Yesterday';
  if (diffInDays < 7) return `${diffInDays} days ago`;
  if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
  return formatDate(date);
};