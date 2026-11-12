<template>
  <div class="page-wrap">
    <PageHeader :title="title" subtitle="该页面尚未实现，路由与权限已就绪">
      <template #extra>
        <el-tag type="info" effect="light" size="small">开发中</el-tag>
      </template>
    </PageHeader>

    <el-card shadow="never">
      <el-empty :description="`${title} 正在开发中，接口就绪后接入`" :image-size="90">
        <el-button type="primary" plain @click="$router.push('/dashboard')">返回工作台</el-button>
      </el-empty>
    </el-card>
  </div>
</template>

<script setup>
import PageHeader from '@/components/PageHeader.vue'

defineProps({
  title: { type: String, default: '页面' }
})
</script>
