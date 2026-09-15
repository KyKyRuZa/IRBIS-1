import toast from 'react-hot-toast';

export const showSuccess = (message) => toast.success(message, {
  duration: 3000,
  position: 'bottom-right',
});

export const showError = (message) => toast.error(message, {
  duration: 4000,
  position: 'bottom-right',
});

export const showInfo = (message) => toast(message, {
  duration: 3000,
  position: 'bottom-right',
  icon: 'ℹ️',
});

export const showFieldErrors = (issues) => {
  const unique = [];
  const seen = new Set();
  (issues || []).forEach((issue) => {
    const key = issue.path.join('.');
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(issue);
    }
  });
  const message = unique.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('; ');
  return showError(message || 'Исправьте ошибки в форме');
};
