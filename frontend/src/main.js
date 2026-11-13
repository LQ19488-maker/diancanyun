import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './styles/index.css'
import { IS_MOCK } from './api/http'

/**
 * 按需引入的补丁：Element Plus 的「函数式组件」（ElMessage / ElMessageBox）
 * 不走模板解析，unplugin 不会自动带出它们的样式。
 * 不引这两行会出现：确认框没有定位样式 → 跑到左上角、字体也不明显；toast 同理。
 */
import 'element-plus/theme-chalk/el-message.css'
import 'element-plus/theme-chalk/el-message-box.css'

/**
 * 演示站不记住登录状态。
 *
 * 原因：本站是交出去给人随手点开的演示版（GitHub Pages），
 * 如果沿用 localStorage 里的 token，别人打开就直接进了后台，
 * 看不到登录页也感觉不到"需要登录"。所以每次页面加载先把会话清掉，
 * 一律从登录页开始；登录之后在同一个会话里正常操作，刷新或重新打开则回到登录页。
 *
 * 想让演示站也记住登录：把下面这段删掉即可（或改成 sessionStorage）。
 */
if (IS_MOCK) {
  localStorage.removeItem('dcy_token')
  localStorage.removeItem('dcy_profile')
}

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.mount('#app')
