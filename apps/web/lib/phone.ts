export function normalizeIndianMobile(input: string): string {
  if (!input) return '';
  const digits = input.replace(/\D/g, '');
  if (!digits) return '';

  // Take the last 10 digits as the local Indian mobile number
  let local = digits;
  if (local.length > 10) {
    local = local.slice(-10);
  }

  if (!local) return '';

  return `+91${local}`;
}

/** Local 10-digit part only (for search prefix). E.g. "+91 98765" -> "98765". */
export function getLocalDigitsForSearch(input: string): string {
  if (!input) return '';
  const digits = input.replace(/\D/g, '');
  const local = digits.startsWith('91') ? digits.slice(2) : digits;
  return local.slice(0, 10);
}

export function formatIndianMobile(input: string): string {
  if (!input) return '';

  const normalized = normalizeIndianMobile(input);
  const digits = normalized.replace(/\D/g, '');

  // Expecting "+91" + 10 digits → total 12 chars
  if (!digits.startsWith('91')) {
    return input;
  }

  const local = digits.slice(2); // strip country code

  if (local.length <= 5) {
    return `+91 ${local}`;
  }

  const first = local.slice(0, 5);
  const second = local.slice(5, 10);

  return `+91 ${first} ${second}`;
}

