import WasteBankSetting from '../models/wasteBankSetting.model.mjs';

const DEFAULTS = {
  bank_name: 'Bank Sampah',
  bank_address: '',
  logo_url: '',
  app_short_name: 'Bank Sampah',
  app_tagline: 'Sistem Manajemen Bank Sampah',
  theme_color: '#2563eb',
};

export async function getBrandingSettings() {
  const [
    bankName,
    bankAddress,
    logoUrl,
    appShortName,
    appTagline,
    themeColor,
  ] = await Promise.all([
    WasteBankSetting.getSetting('BANK_NAME'),
    WasteBankSetting.getSetting('BANK_ADDRESS'),
    WasteBankSetting.getSetting('LOGO_URL'),
    WasteBankSetting.getSetting('APP_SHORT_NAME'),
    WasteBankSetting.getSetting('APP_TAGLINE'),
    WasteBankSetting.getSetting('THEME_COLOR'),
  ]);

  return {
    bank_name: bankName || DEFAULTS.bank_name,
    bank_address: bankAddress || DEFAULTS.bank_address,
    logo_url: logoUrl || DEFAULTS.logo_url,
    app_short_name: appShortName || bankName || DEFAULTS.app_short_name,
    app_tagline: appTagline || DEFAULTS.app_tagline,
    theme_color: themeColor || DEFAULTS.theme_color,
  };
}

export function resolvePublicUrl(req, pathOrUrl) {
  if (!pathOrUrl) return '';
  if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')) {
    return pathOrUrl;
  }
  const base = process.env.PUBLIC_URL || `${req.protocol}://${req.get('host')}`;
  return `${base}${pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`}`;
}
