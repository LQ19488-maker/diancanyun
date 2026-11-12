import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/api'

const TOKEN_KEY = 'dcy_token'
const PROFILE_KEY = 'dcy_profile'

/**
 * 用户会话。
 * token 与 profile 都落 localStorage，刷新后守卫能直接恢复，不会把用户踢回登录页。
 */
export const useUserStore = defineStore('user', () => {
  const token = ref(localStorage.getItem(TOKEN_KEY) || '')
  const profile = ref(JSON.parse(localStorage.getItem(PROFILE_KEY) || 'null'))

  const isLogin = computed(() => Boolean(token.value))
  const role = computed(() => profile.value?.role || '')
  const name = computed(() => profile.value?.name || profile.value?.username || '未登录')
  const isAdmin = computed(() => role.value === 'ADMIN')

  function persist() {
    if (token.value) localStorage.setItem(TOKEN_KEY, token.value)
    else localStorage.removeItem(TOKEN_KEY)
    if (profile.value) localStorage.setItem(PROFILE_KEY, JSON.stringify(profile.value))
    else localStorage.removeItem(PROFILE_KEY)
  }

  /** 登录：拿到 token 后立刻拉一次个人信息，保证权限判断不落空 */
  async function login(payload) {
    const data = await api.auth.login(payload)
    token.value = data.token
    profile.value = data.user || null
    persist()
    if (!profile.value) await fetchProfile()
    return data
  }

  async function fetchProfile() {
    const data = await api.auth.me()
    profile.value = data
    persist()
    return data
  }

  function logout() {
    token.value = ''
    profile.value = null
    persist()
  }

  return { token, profile, isLogin, role, name, isAdmin, login, fetchProfile, logout }
})
