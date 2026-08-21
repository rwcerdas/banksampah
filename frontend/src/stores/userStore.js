import { defineStore } from 'pinia';
import api from '@/utils/api';          // ✅ axios instance (sudah ada interceptor)
import { apiUrl } from '@/utils/apiUrl'; // ✅ helper URL otomatis prefix /api

export const useUserStore = defineStore('user', {
  state: () => ({
    token: localStorage.getItem('token') || '',
    user: JSON.parse(localStorage.getItem('user') || '{}'),
  }),

  getters: {
    isAuthenticated: (state) => !!state.token,
    username: (state) => state.user?.username || '',
    role: (state) => state.user?.role || '',
    namaLengkap: (state) => state.user?.nama_lengkap || '',
    fotoUrl: (state) => state.user?.foto_url || '',
    mustChangePassword: (state) => state.user?.mustChangePassword === true,
  },

  actions: {
    initAuth() {
      const token = localStorage.getItem('token');
      if (token) {
        this.token = token;
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      }
    },
    /** 
     * 🔐 Login User
     */
    async login(username, password) {
      try {
        // 🧠 Debug: cek environment & konfigurasi runtime
        console.groupCollapsed('🔍 [DEBUG] Login Request Info');
        console.log('🌐 import.meta.env.VITE_API_BASE_URL =', import.meta.env.VITE_API_BASE_URL);
        console.log('🧭 apiUrl("auth/login") =', apiUrl('auth/login'));
        console.log('⚙️ api.defaults.baseURL =', api.defaults.baseURL);
        console.groupEnd();

        // 🚀 Kirim request login
        const { data } = await api.post(apiUrl('auth/login'), { username, password });

        // ✅ Simpan token & user info di state + localStorage
        this.token = data.token;
        this.user = data.user;

        // Pastikan semua data penting ada di dalam user object
        this.user.assigned_rt = data.user.assigned_rt;
        this.user.assigned_rw = data.user.assigned_rw;
        this.user.mustChangePassword = data.user.mustChangePassword;

        localStorage.setItem('token', this.token);
        localStorage.setItem('user', JSON.stringify(this.user));

        // Set header Authorization default untuk semua request berikutnya
        api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;

        return data;
      } catch (err) {
        console.error('❌ Login failed:', err);

        // Tangani pesan error dari backend dengan aman
        const message =
          err.response?.data?.message ||
          err.message ||
          'Terjadi kesalahan saat login.';

        // Lempar error agar bisa ditampilkan di form login (misal LoginView)
        throw { message };
      }
    },

    /**
     * 📋 Ambil profil user aktif
     * (opsional — misal untuk halaman Dashboard atau Profil)
     */
    async fetchProfile() {
      try {
        const { data } = await api.get(apiUrl('auth/me'));
        this.user = data;
        localStorage.setItem('user', JSON.stringify(data));
        console.log('👤 Profile fetched:', data);
      } catch (err) {
        console.error('❌ Gagal mengambil profil user:', err);
      }
    },

    /**
     * 💾 Set user & token manual (fallback untuk integrasi eksternal)
     */
    setUser(payload) {
      this.token = payload.token;
      this.user = {
        username: payload.username,
        nama_lengkap: payload.nama_lengkap,
        role: payload.role,
        assigned_rt: payload.assigned_rt,
        assigned_rw: payload.assigned_rw,
      };

      localStorage.setItem('token', this.token);
      localStorage.setItem('user', JSON.stringify(this.user));
      api.defaults.headers.common['Authorization'] = `Bearer ${this.token}`;
    },

    /**
     * 🧾 Kompatibilitas lama (legacy method)
     */
    setAuth(token, user) {
      this.token = token;
      this.user = user;

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    },

    /**
     * 🖼️ Update foto profil user di state & localStorage
     */
    updateProfilePhoto(foto_url) {
      if (this.user) {
        this.user = { ...this.user, foto_url };
        localStorage.setItem('user', JSON.stringify(this.user));
      }
    },

    /**
     * 🔄 Sync profile data dari backend /api/auth/me
     */
    async fetchProfile() {
      try {
        if (!this.token) return;
        const { data } = await api.get(apiUrl('auth/me'));
        if (data && (data._id || data.id)) {
          this.user = { ...this.user, ...data };
          localStorage.setItem('user', JSON.stringify(this.user));
        }
      } catch (err) {
        console.error('❌ Sync profile failed:', err);
      }
    },

    /**
     * 👤 Update data profil user di state & localStorage
     */
    updateUserInfo(userObj) {
      if (this.user) {
        this.user = { ...this.user, ...userObj };
        localStorage.setItem('user', JSON.stringify(this.user));
      }
    },

    /**
     * 🚪 Logout user & bersihkan data lokal
     */
    logout() {
      console.log('👋 Logging out user...');
      this.token = '';
      this.user = {};

      localStorage.removeItem('token');
      localStorage.removeItem('user');
      delete api.defaults.headers.common['Authorization'];
    },
  },
});