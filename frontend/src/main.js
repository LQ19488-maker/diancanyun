import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './styles/index.css'

/**
 * 按需引入的补丁：Element Plus 的「函数式组件」（ElMessage / ElMessageBox）
 * 不走模板解析，unplugin 不会自动带出它们的样式。
 * 不引这两行会出现：确认框没有定位样式 → 跑到左上角、字体也不明显；toast 同理。
 */
import 'element-plus/theme-chalk/el-message.css'
import 'element-plus/theme-chalk/el-message-box.css'

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.mount('#app')
