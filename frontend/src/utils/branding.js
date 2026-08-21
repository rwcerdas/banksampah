import { getImgUrl } from '@/utils/apiUrl';

export function getCachedBranding() {
  try {
    return JSON.parse(localStorage.getItem('ecobank_branding') || '{}');
  } catch {
    return {};
  }
}

export function getPrintLogoUrl() {
  const cached = getCachedBranding();
  if (cached.logo_src) return cached.logo_src;
  if (cached.logo_url) return getImgUrl(cached.logo_url);
  return '';
}

export function getPrintBankName() {
  const cached = getCachedBranding();
  return cached.bank_name || 'Bank Sampah';
}
