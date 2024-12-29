import { createApp } from 'vue'
import { router } from './router'
import App from './App.vue'
import './style.css'
import { Plus, Close } from '@element-plus/icons-vue'
import 'element-plus/theme-chalk/dark/css-vars.css'
import { MonacoProvider } from './services/Monaco/MonacoProvider'

MonacoProvider.run();

const app = createApp(App)
app.use(router)
app.component('Plus', Plus)
app.component('Close', Close)
app.mount('#app')
