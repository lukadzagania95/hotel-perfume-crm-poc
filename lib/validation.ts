const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function requiredText(value: FormDataEntryValue | null, label: string, maxLength = 200) {
  const text = String(value ?? "").trim();

  if (!text) {
    throw new Error(`${label} is required.`);
  }

  if (text.length > maxLength) {
    throw new Error(`${label} must be ${maxLength} characters or fewer.`);
  }

  return text;
}

export function optionalText(value: FormDataEntryValue | null, label: string, maxLength = 1000) {
  const text = String(value ?? "").trim();

  if (text.length > maxLength) {
    throw new Error(`${label} must be ${maxLength} characters or fewer.`);
  }

  return text;
}

export function validEmail(value: FormDataEntryValue | null, label: string) {
  const email = requiredText(value, label, 320).toLowerCase();

  if (!EMAIL_PATTERN.test(email)) {
    throw new Error(`${label} must be a valid email address.`);
  }

  return email;
}

export function nonNegativeInteger(value: FormDataEntryValue | null, label: string) {
  const number = Number(value);

  if (!Number.isSafeInteger(number) || number < 0) {
    throw new Error(`${label} must be a non-negative whole number.`);
  }

  return number;
}

export function positiveInteger(value: FormDataEntryValue | null, label: string) {
  const number = Number(value);

  if (!Number.isSafeInteger(number) || number < 1 || number > 3650) {
    throw new Error(`${label} must be a whole number between 1 and 3650.`);
  }

  return number;
}
