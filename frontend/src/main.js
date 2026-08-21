import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';
import { useUserStore } from './stores/userStore.js';
import { useBrandingStore } from './stores/brandingStore.js';
import '@fontsource-variable/inter';
import './style.css';

async function bootstrap() {
  const app = createApp(App);
  const pinia = createPinia();
  app.use(pinia);
  app.use(router);

  const userStore = useUserStore();
  userStore.initAuth();

  const brandingStore = useBrandingStore();
  await brandingStore.load();

  app.mount('#app');
}

bootstrap();
