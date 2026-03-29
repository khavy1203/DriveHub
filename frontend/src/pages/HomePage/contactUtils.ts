const MOBILE_USER_AGENT_REGEX = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;

const DEFAULT_CONTACT_PHONE_RAW = '0987980417';

export const isMobileDevice = (): boolean =>
  typeof navigator !== 'undefined' && MOBILE_USER_AGENT_REGEX.test(navigator.userAgent || '');

const normalizeContactRaw = (): string => {
  const fromEnv = (process.env.REACT_APP_CONTACT_PHONE || '').replace(/[^\d+]/g, '');
  return (fromEnv || DEFAULT_CONTACT_PHONE_RAW).replace(/[^\d+]/g, '');
};

/** Visible label (Vietnamese 0xxx spacing when 10 digits) */
export const getContactPhoneDisplayLabel = (): string => {
  const raw = normalizeContactRaw();
  const digits = raw.startsWith('+') ? raw.slice(1) : raw;
  const d = digits.replace(/\D/g, '');
  if (d.length === 10 && d.startsWith('0')) {
    return `${d.slice(0, 4)} ${d.slice(4, 7)} ${d.slice(7)}`;
  }
  return d || DEFAULT_CONTACT_PHONE_RAW;
};

/** Digits-only or + prefix; used for tel: href */
export const getContactTelHref = (): string => {
  const raw = normalizeContactRaw();
  if (raw.startsWith('+')) return `tel:${raw}`;
  const digits = raw.replace(/\D/g, '');
  if (digits.startsWith('84')) return `tel:+${digits}`;
  if (digits.startsWith('0')) return `tel:+84${digits.slice(1)}`;
  return `tel:+84${digits}`;
};
