export function isValidTrialEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(value.trim());
}

export function isValidTrialPhone(value: string) {
  const digits = value.replace(/\D/g, "");
  return (digits.length === 10 && digits.startsWith("0")) || (digits.length === 13 && digits.startsWith("2250"));
}

export function hasValidTrialContact(phone: string, email: string) {
  return isValidTrialPhone(phone) || isValidTrialEmail(email);
}
