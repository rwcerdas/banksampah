import { defineStore } from 'pinia';
import { fetchPublicBranding } from '@/services/brandingService';
import { getImgUrl } from '@/utils/apiUrl';

const FALLBACK = {
  bank_name: 'Bank Sampah',
  bank_address: '',
  logo_url: '',
  app_short_name: 'Bank Sampah',
  app_tagline: 'Sistem Manajemen Bank Sampah',
  theme_color: '#2563eb',
};

function setLinkRel(rel, href) {
  if (!href) return;
  let el = document.querySelector(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement('link');
    el.rel = rel;
    document.head.appendChild(el);
  }
  el.href = href;
}

export const useBrandingStore = defineStore('branding', {
  state: () => ({
    loaded: false,
    ...FALLBACK,
    logo_url_absolute: '',
  }),

  getters: {
    displayName: (state) => state.bank_name || FALLBACK.bank_name,
    shortName: (state) => state.app_short_name || state.bank_name || FALLBACK.app_short_name,
    tagline: (state) => state.app_tagline || FALLBACK.app_tagline,
    logoSrc: (state) => {
      if (state.logo_url_absolute) return state.logo_url_absolute;
      if (state.logo_url) return getImgUrl(state.logo_url);
      return '';
    },
    initials: (state) => {
      const name = state.bank_name || FALLBACK.bank_name;
      return name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((w) => w[0]?.toUpperCase() || '')
        .join('') || 'BS';
    },
  },

  actions: {
    applyToDocument() {
      const title = this.displayName;
      document.title = title;
      setLinkRel('icon', this.logoSrc || undefined);
      setLinkRel('apple-touch-icon', this.logoSrc || undefined);

      let themeMeta = document.querySelector('meta[name="theme-color"]');
      if (!themeMeta) {
        themeMeta = document.createElement('meta');
        themeMeta.name = 'theme-color';
        document.head.appendChild(themeMeta);
      }
      themeMeta.content = this.theme_color || FALLBACK.theme_color;

      let appleTitle = document.querySelector('meta[name="apple-mobile-web-app-title"]');
      if (!appleTitle) {
        appleTitle = document.createElement('meta');
        appleTitle.name = 'apple-mobile-web-app-title';
        document.head.appendChild(appleTitle);
      }
      appleTitle.content = this.shortName;

      let manifestLink = document.querySelector('link[rel="manifest"]');
      if (!manifestLink) {
        manifestLink = document.createElement('link');
        manifestLink.rel = 'manifest';
        document.head.appendChild(manifestLink);
      }
      manifestLink.href = '/api/branding/manifest.webmanifest';

      localStorage.setItem('ecobank_branding', JSON.stringify({
        bank_name: this.bank_name,
        logo_url: this.logo_url,
        logo_src: this.logoSrc,
        app_short_name: this.app_short_name,
      }));
    },

    setBranding(data = {}) {
      this.bank_name = data.bank_name ?? this.bank_name;
      this.bank_address = data.bank_address ?? this.bank_address;
      this.logo_url = data.logo_url ?? this.logo_url;
      this.app_short_name = data.app_short_name ?? this.app_short_name;
      this.app_tagline = data.app_tagline ?? this.app_tagline;
      this.theme_color = data.theme_color ?? this.theme_color;
      this.logo_url_absolute = data.logo_url_absolute ?? this.logo_url_absolute;
      this.loaded = true;
      this.applyToDocument();
    },

    async load() {
      try {
        const data = await fetchPublicBranding();
        this.setBranding(data);
      } catch (err) {
        console.warn('Branding load failed, using defaults:', err.message);
        this.loaded = true;
        this.applyToDocument();
      }
    },

    async refresh() {
      await this.load();
    },
  },
});
