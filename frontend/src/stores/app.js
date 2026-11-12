import { defineStore } from 'pinia'
import { ref } from 'vue'

/** 与业务无关的界面状态，只放这里的，别往 user store 里塞 */
export const useAppStore = defineStore('app', () => {
  const sidebarCollapsed = ref(localStorage.getItem('dcy_sidebar') === '1')

  function toggleSidebar() {
    sidebarCollapsed.value = !sidebarCollapsed.value
    localStorage.setItem('dcy_sidebar', sidebarCollapsed.value ? '1' : '0')
  }

  return { sidebarCollapsed, toggleSidebar }
})
