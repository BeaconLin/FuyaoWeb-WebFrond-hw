<script setup>
import { ElButton, ElCard, ElDivider, ElSpace, ElTag } from 'element-plus'
import { useCounterStore } from '../stores/counter'

const counter = useCounterStore()
</script>

<template>
  <main class="page">
    <ElCard class="hero">
      <h1>{{ counter.title }}</h1>
      <p class="subtitle">快速确认路由、状态管理与 Element Plus 已生效。</p>
      <ElDivider />
      <ElSpace wrap>
        <ElButton type="primary" @click="counter.increment">
          点我 +1
        </ElButton>
        <ElButton @click="counter.reset">重置</ElButton>
        <ElTag type="success">当前计数：{{ counter.count }}</ElTag>
      </ElSpace>
    </ElCard>
  </main>
</template>

<style scoped>
.page {
  padding: 32px;
  display: flex;
  justify-content: center;
}
.hero {
  max-width: 640px;
  width: 100%;
}
.subtitle {
  color: #4b5563;
  margin: 8px 0 0;
}
</style>

