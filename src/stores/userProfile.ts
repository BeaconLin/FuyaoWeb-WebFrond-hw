import { defineStore } from 'pinia'
import { reactive } from 'vue'

export const userProfileStore = defineStore('userProfile', () => {
  // 简单的用户信息示例，后续可接入真实登录态
  const userInfo = reactive({
    userId: 'a00123456',
    userName: 'alibaba',
  })

  return {
    userInfo,
  }
})

