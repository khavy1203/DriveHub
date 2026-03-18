import { TRAFFIC_BASE_URL } from 'src/core/constants/config';
import { TrafficApiRawResult } from '../types';

export const formatLicensePlate = (plate: string): string => plate.trim().toUpperCase().replace(/\s/g, '');

export const buildTrafficCheckUrl = (plate: string, vehicleType: string): string =>
  `${TRAFFIC_BASE_URL}/${plate}/${vehicleType}`;

export const hasElectronWebRequest = (): boolean => Boolean((window as any).electronAPI?.webRequest);

export const requestTrafficWeb = async (url: string): Promise<TrafficApiRawResult> => {
  const res = await fetch(url, { method: 'GET', credentials: 'omit' });
  if (!res.ok) throw new Error(`Status ${res.status}`);

  const contentType = res.headers.get('content-type') || '';
  return contentType.includes('application/json') ? res.json() : res.text();
};

export const extractResultHtml = (raw: TrafficApiRawResult): { html: string | null; message?: string } => {
  if (typeof raw === 'string') return { html: raw };
  if (raw?.resultHtml || raw?.data) return { html: raw.resultHtml || raw.data || null };
  if (raw?.message) return { html: null, message: raw.message };
  return { html: null };
};

export const sanitizeResultHtml = (rawHtml: string): string => {
  const element = document.createElement('div');
  element.innerHTML = rawHtml;

  ['button', '.modal', '.btn', 'script', 'style', 'a[href*="play.google.com"]', 'a[href*="apps.apple.com"]'].forEach(
    (selector) => element.querySelectorAll(selector).forEach((node) => node.remove())
  );

  element.querySelectorAll('b,span,div').forEach((node) => {
    if (node.textContent?.includes('Tra cứu nhanh hơn tại ứng dụng')) node.remove();
  });

  const showViolationData = element.querySelector('#showViolationData');
  if (showViolationData instanceof HTMLElement) {
    showViolationData.style.display = 'block';
    showViolationData.style.opacity = '1';
  }

  element.querySelectorAll('[style]').forEach((node) => {
    if (node instanceof HTMLElement) {
      if (node.style.display === 'none') node.style.display = 'block';
      if (node.style.opacity === '0') node.style.opacity = '1';
    }
  });

  return element.innerHTML;
};
