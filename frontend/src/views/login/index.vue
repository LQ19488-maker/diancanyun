<template>
  <div class="login-page">
    <div class="login-card">
      <div class="brand">
        <span class="logo">🍜</span>
        <h1>点单云</h1>
        <p class="sub">{{ APP_SUBTITLE }}</p>
      </div>

      <el-form ref="formRef" :model="form" :rules="rules" size="large" @keyup.enter="onSubmit">
        <el-form-item prop="username">
          <el-input v-model="form.username" placeholder="请输入账号" clearable>
            <template #prefix><el-icon><User /></el-icon></template>
          </el-input>
        </el-form-item>
        <el-form-item prop="password">
          <el-input v-model="form.password" type="password" placeholder="请输入密码" show-password>
            <template #prefix><el-icon><Lock /></el-icon></template>
          </el-input>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" class="submit" :loading="loading" @click="onSubmit">登 录</el-button>
        </el-form-item>
      </el-form>

      <el-alert v-if="isMock" type="warning" :closable="false" class="demo-tip">
        <template #title>演示环境（无后端）</template>
        账号 <b>admin / admin1234</b>（管理员）　或　<b>staff / staff1234</b>（员工）
      </el-alert>

      <div class="footer">
        前端：{{ AUTHOR }} · 数据处理与可视化 II 课程项目
        <a :href="GITHUB_URL" target="_blank" rel="noreferrer">GitHub</a>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Lock, User } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import { IS_MOCK } from '@/api'
import { APP_SUBTITLE, AUTHOR, GITHUB_URL } from '@/constants/app'

const router = useRouter()
const route = useRoute()
const user = useUserStore()

const isMock = IS_MOCK
const formRef = ref(null)
const loading = ref(false)
const form = reactive({ username: IS_MOCK ? 'admin' : '', password: IS_MOCK ? 'admin1234' : '' })

const rules = {
  username: [{ required: true, message: '请输入账号', trigger: 'blur' }],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码至少 6 位', trigger: 'blur' }
  ]
}

async function onSubmit() {
  const valid = await formRef.value?.validate().then(() => true).catch(() => false)
  if (!valid) return
  loading.value = true
  try {
    await user.login({ username: form.username.trim(), password: form.password })
    ElMessage.success('登录成功')
    router.replace(route.query.redirect || '/dashboard')
  } catch (e) {
    ElMessage.error(e?.message || '登录失败')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-page {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #1f2d3d 0%, #2f4b6b 60%, #3f6b8f 100%);
}

.login-card {
  width: 380px;
  padding: 32px 28px 20px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.18);
}

.brand {
  text-align: center;
  margin-bottom: 20px;
}

.logo {
  font-size: 30px;
}

.brand h1 {
  margin: 6px 0 2px;
  font-size: 20px;
  letter-spacing: 2px;
  color: #1f2d3d;
}

.sub {
  margin: 0;
  font-size: 12px;
  color: #8c93a1;
}

.submit {
  width: 100%;
}

.demo-tip {
  margin-top: 4px;
  font-size: 12px;
  line-height: 1.7;
}

.footer {
  margin-top: 18px;
  text-align: center;
  font-size: 12px;
  color: #9aa3b2;
}

.footer a {
  margin-left: 6px;
  color: #4b7bec;
}
</style>
