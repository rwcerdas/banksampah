import express from 'express';
import { getBrandingSettings, resolvePublicUrl } from '../services/branding.service.mjs';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const branding = await getBrandingSettings();
    res.json({
      success: true,
      data: {
        ...branding,
        logo_url_absolute: resolvePublicUrl(req, branding.logo_url),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/manifest.webmanifest', async (req, res) => {
  try {
    const branding = await getBrandingSettings();
    const iconUrl = resolvePublicUrl(req, branding.logo_url);
    const icons = iconUrl
      ? [
          { src: iconUrl, sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: iconUrl, sizes: '512x512', type: 'image/png', purpose: 'any' },
        ]
      : [];

    res.setHeader('Content-Type', 'application/manifest+json');
    res.json({
      name: branding.bank_name,
      short_name: branding.app_short_name,
      description: branding.app_tagline,
      start_url: '/nasabah',
      display: 'standalone',
      orientation: 'portrait',
      background_color: '#0f172a',
      theme_color: branding.theme_color,
      scope: '/',
      icons,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
