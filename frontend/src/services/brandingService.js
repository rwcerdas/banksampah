import api from '@/utils/api';

export async function fetchPublicBranding() {
  const { data } = await api.get('/api/branding');
  return data.data;
}
