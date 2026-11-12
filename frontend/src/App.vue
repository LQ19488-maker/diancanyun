<template>
  <!-- 中文语言包：分页的“前往 / 条每页”、日期选择器等文案才会是中文 -->
  <el-config-provider :locale="zhCn">
    <router-view />
  </el-config-provider>
</template>

<script setup>
import zhCn from 'element-plus/es/locale/lang/zh-cn'
</script>
