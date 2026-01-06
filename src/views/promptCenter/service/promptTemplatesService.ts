// Prompt 模板相关接口封装
// 这里假设已经有 axiosService 和 promptHost 可用
// @ts-ignore
import axiosService from '@/server/api/https.ts'
// 声明由外部注入的 host 变量（例如在全局或环境配置中定义）
declare const promptHost: string

const promptTemplateService = {
  // 获取 prompt 模板广场模板列表
  getPromptTemplates: (
    pageNum: string,
    pageSize: string,
    reqParams: any
  ): any =>
    axiosService.get(`${promptHost}/model_service/api/templates`, {
      pageNum,
      pageSize,
      ...reqParams,
    }),

  // 创建自定义模板
  createPromptTemplate: (data: any): any =>
    axiosService.post(`${promptHost}/model_service/api/templates`, data),

  // 根据模板类型获取标签分类
  getTemplateTags: (templateType: string): any =>
    axiosService.get(`${promptHost}/model_service/api/template_tags`, {
      templateType,
    }),

  // （如有需要）根据ID获取模板详情
  getTemplateDetail: (templateId: string): any =>
    axiosService.get(
      `${promptHost}/model_service/api/templates/${templateId}`
    ),
}

export default promptTemplateService

