// Shared, user-facing validation helpers. Server validation remains authoritative;
// these helpers prevent avoidable invalid entries before a request is submitted.
export const sanitizePhone = (value = '') => {
  const hasLeadingPlus = String(value).trim().startsWith('+');
  const digits = String(value).replace(/\D/g, '').slice(0, 12);
  return hasLeadingPlus ? `+${digits}` : digits;
};

export const isPhilippineMobile = (value = '') => /^(?:\+63|63|0)9\d{9}$/.test(String(value).replace(/[\s-]/g, ''));
export const isValidEmail = (value = '') => !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
export const isPositiveNumber = value => Number.isFinite(Number(value)) && Number(value) > 0;
export const isWholeNumber = value => Number.isInteger(Number(value)) && Number(value) > 0;
export const isPastOrToday = value => Boolean(value) && new Date(`${value}T00:00:00`) <= new Date(new Date().toDateString());
export const isAtLeastAge = (dob, years = 18) => {
  if (!isPastOrToday(dob)) return false;
  const birth = new Date(`${dob}T00:00:00`);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  if (today < new Date(today.getFullYear(), birth.getMonth(), birth.getDate())) age -= 1;
  return age >= years;
};

export const firstValidationError = checks => checks.find(([, valid]) => !valid)?.[0] || '';
