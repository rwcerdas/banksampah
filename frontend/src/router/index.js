import { createRouter, createWebHistory } from 'vue-router';
import { useUserStore } from '@/stores/userStore';

const AdminLayout = () => import('@/layouts/AdminLayout.vue');
const NasabahLayout = () => import('@/layouts/NasabahLayout.vue');
const AuthLayout = () => import('@/layouts/AuthLayout.vue');

const routes = [
  {
    path: '/setup',
    component: AuthLayout,
    children: [
      {
        path: '',
        name: 'Setup',
        component: () => import('@/views/auth/SetupWizard.vue'),
        meta: { title: 'Setup EcoBank', public: true },
      },
    ],
  },
  {
    path: '/login',
    component: AuthLayout,
    children: [
      {
        path: '',
        name: 'Login',
        component: () => import('@/views/auth/LoginView.vue'),
        meta: { title: 'Login', public: true },
      },
    ],
  },
  {
    path: '/force-change-password',
    name: 'ForceChangePassword',
    component: () => import('@/views/auth/ForceChangePassword.vue'),
    meta: { title: 'Ganti Password', requiresAuth: true },
  },
  {
    path: '/admin',
    component: AdminLayout,
    meta: { requiresAuth: true, requiredRole: ['admin'] },
    children: [
      { path: '', redirect: '/admin/dashboard' },
      { path: 'dashboard', name: 'AdminDashboard', component: () => import('@/views/admin/WasteBankDashboard.vue'), meta: { title: 'Dashboard' } },
      { path: 'customers', name: 'AdminCustomers', component: () => import('@/views/admin/WasteBankCustomers.vue'), meta: { title: 'Nasabah' } },
      { path: 'customers/:id/transactions', name: 'CustomerHistory', component: () => import('@/views/admin/CustomerTransactionHistory.vue'), meta: { title: 'Mutasi Nasabah' } },
      { path: 'transactions', name: 'AdminTransactions', component: () => import('@/views/admin/WasteBankTransactions.vue'), meta: { title: 'Transaksi' } },
      { path: 'withdrawals', name: 'AdminWithdrawals', component: () => import('@/views/admin/WasteBankWithdrawals.vue'), meta: { title: 'Penarikan' } },
      { path: 'history', name: 'AdminHistory', component: () => import('@/views/admin/WasteBankHistory.vue'), meta: { title: 'Riwayat' } },
      { path: 'reports', name: 'AdminReports', component: () => import('@/views/admin/WasteBankReports.vue'), meta: { title: 'Laporan' } },
      { path: 'categories', name: 'AdminCategories', component: () => import('@/views/admin/WasteBankCategories.vue'), meta: { title: 'Kategori & Harga' } },
      { path: 'collectors', name: 'AdminCollectors', component: () => import('@/views/admin/WasteBankCollectors.vue'), meta: { title: 'Pengepul' } },
      { path: 'education', name: 'AdminEducation', component: () => import('@/views/admin/WasteBankEducation.vue'), meta: { title: 'Edukasi' } },
      { path: 'cash', name: 'AdminCash', component: () => import('@/views/admin/WasteBankCash.vue'), meta: { title: 'Kas Pengurus' } },
      { path: 'settings', name: 'AdminSettings', component: () => import('@/views/admin/WasteBankSettings.vue'), meta: { title: 'Pengaturan' } },
    ],
  },
  {
    path: '/nasabah',
    component: NasabahLayout,
    meta: { requiresAuth: true, requiredRole: ['nasabah'] },
    children: [
      { path: '', name: 'NasabahDashboard', component: () => import('@/views/nasabah/NasabahDashboard.vue'), meta: { title: 'Beranda Nasabah' } },
      { path: 'about', name: 'NasabahAbout', component: () => import('@/views/nasabah/About.vue'), meta: { title: 'Tentang Kami' } },
    ],
  },
  { path: '/', redirect: '/login' },
  { path: '/:pathMatch(.*)*', name: 'NotFound', component: () => import('@/views/auth/NotFound.vue') },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach(async (to, _from, next) => {
  const userStore = useUserStore();

  if (to.meta.public && to.path !== '/login') {
    return next();
  }

  if (to.path === '/setup') {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || ''}/api/setup/status`);
      const data = await res.json();
      if (data.initialized && to.path === '/setup') {
        return next('/login');
      }
    } catch {
      // allow setup if API unreachable during first boot
    }
    return next();
  }

  if (to.path === '/login' && !userStore.isAuthenticated) {
    try {
      const base = import.meta.env.VITE_API_BASE_URL || '';
      const res = await fetch(`${base}/api/setup/status`);
      const data = await res.json();
      if (!data.initialized) return next('/setup');
    } catch {
      // continue to login
    }
  }

  if (to.meta.requiresAuth && !userStore.isAuthenticated) {
    return next('/login');
  }

  if (userStore.isAuthenticated && userStore.mustChangePassword) {
    if (to.path !== '/force-change-password' && to.path !== '/login') {
      return next('/force-change-password');
    }
  } else if (to.path === '/force-change-password' && userStore.isAuthenticated && !userStore.mustChangePassword) {
    return next(userStore.role === 'nasabah' ? '/nasabah' : '/admin/dashboard');
  }

  if (to.meta.requiredRole) {
    const allowed = to.meta.requiredRole.includes(userStore.role);
    if (!allowed) {
      if (userStore.role === 'nasabah') return next('/nasabah');
      if (userStore.role === 'admin') return next('/admin/dashboard');
      return next('/login');
    }
  }

  if (userStore.isAuthenticated && to.path === '/login') {
    return next(userStore.role === 'nasabah' ? '/nasabah' : '/admin/dashboard');
  }

  if (userStore.role === 'nasabah' && to.path.startsWith('/admin')) {
    return next('/nasabah');
  }
  if (userStore.role === 'admin' && to.path.startsWith('/nasabah')) {
    return next('/admin/dashboard');
  }

  next();
});

export default router;
