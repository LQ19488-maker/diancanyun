import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/api'
import { ROLE, ROLE_HOME } from '@/constants/enums'

const TOKEN_KEY = 'dcy_token'
const PROFILE_KEY = 'dcy_profile'

/**
 * 用户会话。三类使用者共用一套：
 *   MERCHANT 商家 / RIDER 骑手 / CUSTOMER 顾客
 * token 与资料都落 localStorage，刷新后守卫能直接恢复，不会把用户踢回登录页。
 */
export const useUserStore = defineStore('user', () => {
  const token = ref(localStorage.getItem(TOKEN_KEY) || '')
  const profile = ref(JSON.parse(localStorage.getItem(PROFILE_KEY) || 'null'))

  const isLogin = computed(() => Boolean(token.value))
  const role = computed(() => profile.value?.role || '')
  const name = computed(() => profile.value?.name || profile.value?.username || '未登录')
  const isMerchant = computed(() => role.value === ROLE.MERCHANT)
  const isRider = computed(() => role.value === ROLE.RIDER)
  const isCustomer = computed(() => role.value === ROLE.CUSTOMER)
  /** 该角色登录后应该去的首页 */
  const homePath = computed(() => ROLE_HOME[role.value] || '/login')

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

  return {
    token,
    profile,
    isLogin,
    role,
    name,
    isMerchant,
    isRider,
    isCustomer,
    homePath,
    login,
    fetchProfile,
    logout
  }
})
