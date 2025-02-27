import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import vuetify from './plugins/vuetify'
import router from './router'

// 创建应用实例
const app = createApp(App)

// 使用Pinia进行状态管理
const pinia = createPinia()
app.use(pinia)

// 使用Vuetify进行UI组件管理
app.use(vuetify)

// 使用路由
app.use(router)

// 挂载应用
app.mount('#app')