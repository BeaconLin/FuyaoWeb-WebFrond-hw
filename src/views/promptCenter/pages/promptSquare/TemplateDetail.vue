<template>
  <div class="page">
    <div class="page-header">
      <el-button @click="goBack">返回</el-button>
      <h2 class="page-title">{{ template?.title || '模板详情' }}</h2>
      <div class="header-actions">
        <el-button
          v-if="isEditMode"
          type="primary"
          :loading="submitting"
          @click="handleSave"
        >
          保存
        </el-button>
        <el-button
          v-else-if="canEdit"
          @click="handleEnterEdit"
        >
          <el-icon><Edit /></el-icon>
          编辑
        </el-button>
        <el-button
          v-if="!isEditMode"
          @click="handleCopy(template?.content)"
        >
          <el-icon><CopyDocument /></el-icon>
          复制
        </el-button>
      </div>
    </div>

    <div v-loading="loading" class="content-container">
      <!-- 编辑模式 -->
      <el-card v-if="isEditMode" shadow="hover" class="edit-card">
        <el-form
          ref="formRef"
          :model="form"
          :rules="rules"
          label-width="110px"
          class="form"
        >
          <el-form-item label="模板名称" prop="templateName">
            <el-input
              v-model="form.templateName"
              placeholder="请输入模板名称"
              maxlength="100"
              show-word-limit
            />
          </el-form-item>

          <el-form-item label="相关标签" prop="tag">
            <el-select
              v-model="form.tag"
              filterable
              placeholder="请选择相关标签"
              class="full-width"
            >
              <el-option
                v-for="tag in tagOptions"
                :key="tag.value"
                :label="tag.label"
                :value="tag.value"
              />
            </el-select>
          </el-form-item>

          <el-form-item label="模板内容" prop="content">
            <el-input
              v-model="form.content"
              type="textarea"
              :autosize="{ minRows: 6, maxRows: 12 }"
              placeholder="请输入模板内容"
            />
          </el-form-item>

          <el-form-item label="使用案例" prop="example">
            <el-input
              v-model="form.example"
              type="textarea"
              :autosize="{ minRows: 4, maxRows: 8 }"
              placeholder="请输入使用案例"
            />
          </el-form-item>

          <el-form-item>
            <el-button type="primary" :loading="submitting" @click="handleSave">
              保存
            </el-button>
            <el-button @click="handleCancelEdit">取消</el-button>
          </el-form-item>
        </el-form>
      </el-card>

      <!-- 展示模式 -->
      <div v-else class="detail-container">
        <div class="detail-content">
          <!-- 左侧区域 -->
          <div class="detail-left">
            <!-- 上方：内容/示例输入切换 -->
            <div class="left-top">
              <el-tabs v-model="leftActiveTab" class="content-tabs">
                <el-tab-pane label="模板内容" name="content">
                  <div class="content-wrapper">
                    <pre class="template-content-text">{{ template?.content }}</pre>
                    <el-button
                      class="copy-content-btn"
                      size="small"
                      type="primary"
                      plain
                      @click.stop="handleCopy(template?.content)"
                    >
                      <el-icon><CopyDocument /></el-icon>
                      复制
                    </el-button>
                  </div>
                </el-tab-pane>
                <el-tab-pane label="示例输入" name="example">
                  <div class="example-wrapper single">
                    <div class="example-section">
                      <div class="example-label">完整Prompt：</div>
                      <pre class="example-text">{{ getFullPrompt(template) }}</pre>
                    </div>
                  </div>
                </el-tab-pane>
              </el-tabs>
            </div>

            <!-- 下方：模板相关信息 -->
            <div class="left-bottom">
              <div class="info-item">
                <span class="info-label">模板ID：</span>
                <span class="info-value">{{ template?.id }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">模板来源：</span>
                <span class="info-value">{{ getTemplateSource(template) }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">场景类型：</span>
                <span class="info-value">文生文</span>
              </div>
              <div class="info-item">
                <span class="info-label">参数格式：</span>
                <span class="info-value" v-text="'{{}}'"></span>
              </div>
              <div class="info-item">
                <span class="info-label">创建时间：</span>
                <span class="info-value">{{ template?.createTime }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">浏览量：</span>
                <span class="info-value">{{ template?.viewCount }}</span>
              </div>
            </div>
          </div>

          <!-- 右侧区域：推理结果 -->
          <div class="detail-right">
            <el-tabs v-model="rightActiveTab" class="model-tabs">
              <el-tab-pane
                v-for="result in template?.inferenceResults"
                :key="result.modelName"
                :label="result.modelName"
                :name="result.modelName"
              >
                <div class="inference-result">
                  <pre class="result-text">{{ result.result }}</pre>
                </div>
              </el-tab-pane>
            </el-tabs>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { CopyDocument, Edit } from '@element-plus/icons-vue'
import promptTemplateService from '../../service/promptTemplatesService'

const router = useRouter()
const route = useRoute()
const formRef = ref()
const submitting = ref(false)
const loading = ref(false)

// 判断是否为编辑模式
const isEditMode = computed(() => {
  return route.query.mode === 'edit'
})

// 判断是否可以编辑（只有自定义模板可以编辑）
const canEdit = computed(() => {
  return template.value && template.value.source === 'custom'
})

// 模板数据
const template = ref(null)

// 表单数据
const form = reactive({
  templateName: '',
  tag: '',
  content: '',
  example: '',
})

// 标签选项
const tagOptions = [
  { label: '对话', value: 'dialogue' },
  { label: '写作', value: 'writing' },
  { label: '翻译', value: 'translation' },
  { label: '代码', value: 'code' },
  { label: '分析', value: 'analysis' },
  { label: '总结', value: 'summary' },
  { label: '创意', value: 'creative' },
]

// 表单验证规则
const rules = {
  templateName: [
    { required: true, message: '请输入模板名称', trigger: 'blur' },
  ],
  tag: [{ required: true, message: '请选择一个标签', trigger: 'change' }],
  content: [{ required: true, message: '请输入模板内容', trigger: 'blur' }],
  example: [{ required: true, message: '请输入使用案例', trigger: 'blur' }],
}

// Tab状态
const leftActiveTab = ref('content')
const rightActiveTab = ref('')

// 生成假数据模板（用于模拟接口数据）
const generateMockTemplateData = (templateId) => {
  const mockTemplates = {
    'example-001': {
      id: 'example-001',
      title: '代码生成助手',
      templateName: '代码生成助手',
      tag: 'code',
      content: '你是一个专业的编程助手。请根据以下需求生成代码：\n\n需求描述：{{requirement}}\n编程语言：{{language}}\n\n请提供完整的、可运行的代码，并附上必要的注释说明。',
      example: '需求描述：创建一个用户登录功能\n编程语言：JavaScript',
      exampleInput: '需求描述：创建一个用户登录功能\n编程语言：JavaScript',
      source: 'custom',
      createTime: new Date().toLocaleString('zh-CN'),
      viewCount: 2560,
      favoriteCount: 128,
      inferenceResults: [
        {
          modelName: 'GPT-4',
          result: '以下是使用JavaScript实现的用户登录功能代码：\n\n```javascript\n// 用户登录功能\nfunction login(username, password) {\n  // 验证用户名和密码\n  if (username && password) {\n    // 执行登录逻辑\n    return { success: true, message: "登录成功" }\n  }\n  return { success: false, message: "用户名或密码不能为空" }\n}\n```',
        },
        {
          modelName: 'Claude-3',
          result: '基于您的需求，我为您创建了一个用户登录功能。代码包含输入验证和错误处理机制，确保安全性。',
        },
      ],
    },
    'example-002': {
      id: 'example-002',
      title: '文章摘要生成器',
      templateName: '文章摘要生成器',
      tag: 'summary',
      content: '请对以下文章进行摘要，要求：\n1. 提取核心观点\n2. 总结主要内容\n3. 控制在200字以内\n\n文章内容：\n{{article}}',
      example: '文章内容：人工智能正在改变我们的生活方式，从智能家居到自动驾驶，AI技术已经深入到各个领域。',
      exampleInput: '文章内容：人工智能正在改变我们的生活方式，从智能家居到自动驾驶，AI技术已经深入到各个领域。',
      source: 'custom',
      createTime: new Date().toLocaleString('zh-CN'),
      viewCount: 1890,
      favoriteCount: 89,
      inferenceResults: [
        {
          modelName: 'GPT-4',
          result: '本文主要阐述了人工智能技术在各个领域的广泛应用，包括智能家居和自动驾驶等，展现了AI对现代生活的深刻影响。',
        },
      ],
    },
    'example-003': {
      id: 'example-003',
      title: '问题解答助手',
      templateName: '问题解答助手',
      tag: 'qa',
      content: '你是一个知识渊博的助手。请详细回答以下问题：\n\n用户问题：{{question}}\n\n请提供准确、详细的答案，如果涉及专业领域，请提供相关背景知识。',
      example: '用户问题：什么是Vue.js？它有什么特点？',
      exampleInput: '用户问题：什么是Vue.js？它有什么特点？',
      source: 'custom',
      createTime: new Date().toLocaleString('zh-CN'),
      viewCount: 3420,
      favoriteCount: 156,
      inferenceResults: [
        {
          modelName: 'GPT-4',
          result: 'Vue.js是一个用于构建用户界面的渐进式JavaScript框架。它的主要特点包括：\n1. 响应式数据绑定\n2. 组件化开发\n3. 虚拟DOM\n4. 轻量级和易学易用\n5. 丰富的生态系统',
        },
        {
          modelName: 'Claude-3',
          result: 'Vue.js是一个流行的前端框架，以其简洁的API和优秀的性能而闻名。它支持组件化开发，使得代码更加模块化和可维护。',
        },
      ],
    },
    'example-004': {
      id: 'example-004',
      title: '创意写作模板',
      templateName: '创意写作模板',
      tag: 'writing',
      content: '请根据以下要求创作一篇文章：\n\n主题：{{topic}}\n风格：{{style}}\n字数：{{wordCount}}\n\n要求文章结构清晰，语言生动，富有创意。',
      example: '主题：人工智能的未来\n风格：科普\n字数：1000',
      exampleInput: '主题：人工智能的未来\n风格：科普\n字数：1000',
      source: 'custom',
      createTime: new Date().toLocaleString('zh-CN'),
      viewCount: 4560,
      favoriteCount: 203,
      inferenceResults: [
        {
          modelName: 'GPT-4',
          result: '人工智能的未来：探索无限可能\n\n人工智能（AI）作为21世纪最重要的技术之一，正在以前所未有的速度改变着我们的世界。从医疗诊断到自动驾驶，从智能推荐到自然语言处理，AI的应用已经渗透到生活的方方面面...',
        },
      ],
    },
  }

  // 如果模板ID在假数据中存在，返回对应的数据
  if (mockTemplates[templateId]) {
    return mockTemplates[templateId]
  }

  // 否则返回一个默认的假数据模板
  return {
    id: templateId,
    title: '自定义模板',
    templateName: '自定义模板',
    tag: 'dialogue',
    content: '这是一个自定义模板的内容。\n\n变量示例：{{variable}}',
    example: '变量示例：这是变量的值',
    exampleInput: '变量示例：这是变量的值',
    source: 'custom',
    createTime: new Date().toLocaleString('zh-CN'),
    viewCount: 0,
    favoriteCount: 0,
    inferenceResults: [],
  }
}

// 加载模板数据
const loadTemplateData = async () => {
  const templateId = route.params.templateId
  if (!templateId) {
    ElMessage.error('模板ID不存在')
    router.push({ name: 'prompt-square' })
    return
  }

  loading.value = true
  try {
    const res = await promptTemplateService.getTemplateDetail(templateId)
    if (res && res.code === 0 && res.data) {
      template.value = res.data
      // 如果是编辑模式，填充表单
      if (isEditMode.value) {
        fillFormFromTemplate(res.data)
      }
      // 设置右侧默认选中第一个模型
      if (template.value.inferenceResults && template.value.inferenceResults.length > 0) {
        rightActiveTab.value = template.value.inferenceResults[0].modelName
      }
    } else {
      // 接口失败时，使用假数据模拟
      console.warn('接口调用失败，使用假数据模拟:', res?.message || '接口调用失败')
      const mockData = generateMockTemplateData(templateId)
      template.value = mockData
      if (isEditMode.value) {
        fillFormFromTemplate(mockData)
      }
      if (template.value.inferenceResults && template.value.inferenceResults.length > 0) {
        rightActiveTab.value = template.value.inferenceResults[0].modelName
      }
    }
  } catch (error) {
    // 接口异常时，使用假数据模拟
    console.warn('接口调用异常，使用假数据模拟:', error)
    const mockData = generateMockTemplateData(templateId)
    template.value = mockData
    if (isEditMode.value) {
      fillFormFromTemplate(mockData)
    }
    if (template.value.inferenceResults && template.value.inferenceResults.length > 0) {
      rightActiveTab.value = template.value.inferenceResults[0].modelName
    }
  } finally {
    loading.value = false
  }
}

// 从模板数据填充表单
const fillFormFromTemplate = (templateData) => {
  form.templateName = templateData.title || templateData.templateName || ''
  form.tag = templateData.tag || ''
  form.content = templateData.content || ''
  form.example = templateData.exampleInput || templateData.example || ''
}

// 进入编辑模式
const handleEnterEdit = () => {
  router.push({
    name: 'template-detail',
    params: { templateId: route.params.templateId },
    query: { mode: 'edit' },
  })
}

// 取消编辑
const handleCancelEdit = () => {
  router.push({
    name: 'template-detail',
    params: { templateId: route.params.templateId },
  })
}

// 保存编辑
const handleSave = () => {
  formRef.value?.validate(async (valid) => {
    if (!valid) {
      return
    }
    submitting.value = true
    try {
      const payload = {
        templateName: form.templateName,
        tag: form.tag,
        content: form.content,
        example: form.example,
      }

      const templateId = route.params.templateId
      try {
        const res = await promptTemplateService.updatePromptTemplate(templateId, payload)
        if (res && res.code === 0) {
          ElMessage.success(res.message || '模板更新成功')
          // 更新本地模板数据
          if (template.value) {
            template.value.title = form.templateName
            template.value.templateName = form.templateName
            template.value.tag = form.tag
            template.value.content = form.content
            template.value.exampleInput = form.example
            template.value.example = form.example
          }
          // 退出编辑模式
          router.push({
            name: 'template-detail',
            params: { templateId },
          })
        } else {
          // 接口失败时，使用假数据模拟成功
          console.warn('更新接口调用失败，使用假数据模拟:', res?.message || '接口调用失败')
          ElMessage.success('模板更新成功（模拟）')
          // 更新本地模板数据
          if (template.value) {
            template.value.title = form.templateName
            template.value.templateName = form.templateName
            template.value.tag = form.tag
            template.value.content = form.content
            template.value.exampleInput = form.example
            template.value.example = form.example
          }
          // 退出编辑模式
          router.push({
            name: 'template-detail',
            params: { templateId },
          })
        }
      } catch (error) {
        // 接口异常时，使用假数据模拟成功
        console.warn('更新接口调用异常，使用假数据模拟:', error)
        ElMessage.success('模板更新成功（模拟）')
        // 更新本地模板数据
        if (template.value) {
          template.value.title = form.templateName
          template.value.templateName = form.templateName
          template.value.tag = form.tag
          template.value.content = form.content
          template.value.exampleInput = form.example
          template.value.example = form.example
        }
        // 退出编辑模式
        router.push({
          name: 'template-detail',
          params: { templateId },
        })
      }
    } catch (error) {
      ElMessage.error(error?.message || '更新模板失败')
    } finally {
      submitting.value = false
    }
  })
}

// 返回
const goBack = () => {
  router.push({ name: 'prompt-square' })
}

// 获取模板来源显示文本
const getTemplateSource = (template) => {
  if (!template) {
    return ''
  }
  if (template.source === 'preset') {
    return '预置模板'
  } else if (template.source === 'custom') {
    return template.createBy || '自定义模板'
  }
  return '未知'
}

// 解析示例输入，提取变量值映射
const parseExampleInput = (exampleInput) => {
  if (!exampleInput) {
    return {}
  }

  const variableMap = {}
  // 按行分割
  const lines = exampleInput.split('\n')

  lines.forEach((line) => {
    // 匹配格式：变量名：值
    const match = line.match(/^(.+?)：(.+)$/)
    if (match) {
      const label = match[1].trim()
      const value = match[2].trim()

      // 将中文标签映射到变量名
      const labelToVar = {
        '用户问题': 'question',
        '需求描述': 'requirement',
        '编程语言': 'language',
        '文章内容': 'article',
      }

      const varName = labelToVar[label] || label.toLowerCase()
      variableMap[varName] = value
    }
  })

  return variableMap
}

// 获取完整的prompt（替换变量后的）
const getFullPrompt = (template) => {
  if (!template || !template.content || !template.exampleInput) {
    return ''
  }

  // 解析示例输入，获取变量值映射
  const variableMap = parseExampleInput(template.exampleInput)

  // 替换模板内容中的变量
  let fullPrompt = template.content

  // 替换所有 {{variableName}} 格式的变量
  Object.keys(variableMap).forEach((varName) => {
    const regex = new RegExp(`\\{\\{${varName}\\}\\}`, 'g')
    fullPrompt = fullPrompt.replace(regex, variableMap[varName])
  })

  return fullPrompt
}

// 处理复制
const handleCopy = (content) => {
  navigator.clipboard
    .writeText(content)
    .then(() => {
      ElMessage.success('模板内容已复制到剪贴板')
    })
    .catch(() => {
      ElMessage.error('复制失败，请手动复制')
    })
}

// 监听路由变化，切换编辑模式时重新加载数据
watch(
  () => route.query.mode,
  () => {
    if (isEditMode.value && template.value) {
      fillFormFromTemplate(template.value)
    }
  },
)

// 组件挂载时加载数据
onMounted(() => {
  loadTemplateData()
})
</script>

<style scoped>
.page {
  padding: 20px 24px 32px;
  background: #f5f7fb;
  min-height: 100vh;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.page-title {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #303133;
  flex: 1;
  margin-left: 16px;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.content-container {
  min-height: 500px;
}

.edit-card {
  margin-bottom: 20px;
}

.form {
  padding: 8px 12px 4px;
}

.full-width {
  width: 100%;
}

.detail-container {
  background: #fff;
  border-radius: 4px;
  padding: 20px;
}

.detail-content {
  display: flex;
  gap: 24px;
  min-height: 500px;
}

.detail-left {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.detail-right {
  flex: 1;
  border-left: 1px solid #ebeef5;
  padding-left: 24px;
}

.left-top {
  flex: 1;
  min-height: 300px;
}

.content-tabs :deep(.el-tab-pane) {
  height: 100%;
}

.content-wrapper {
  position: relative;
  height: 100%;
  min-height: 250px;
  background: #f5f7fa;
  border-radius: 4px;
  padding: 16px;
}

.template-content-text {
  margin: 0;
  font-size: 14px;
  line-height: 1.8;
  color: #303133;
  white-space: pre-wrap;
  word-wrap: break-word;
  padding-bottom: 40px;
}

.copy-content-btn {
  position: absolute;
  bottom: 16px;
  right: 16px;
}

.example-wrapper {
  height: 100%;
  min-height: 250px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.example-section {
  flex: 1;
  background: #f5f7fa;
  border-radius: 4px;
  padding: 16px;
}

.example-label {
  font-size: 14px;
  font-weight: 600;
  color: #606266;
  margin-bottom: 12px;
}

.example-text {
  margin: 0;
  font-size: 14px;
  line-height: 1.8;
  color: #303133;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.left-bottom {
  background: #fafafa;
  border-radius: 4px;
  padding: 16px;
}

.info-item {
  display: flex;
  margin-bottom: 12px;
  font-size: 14px;
}

.info-item:last-child {
  margin-bottom: 0;
}

.info-label {
  color: #909399;
  min-width: 100px;
  font-weight: 500;
}

.info-value {
  color: #303133;
  flex: 1;
}

.model-tabs {
  height: 100%;
}

.inference-result {
  height: 100%;
  min-height: 400px;
  background: #f5f7fa;
  border-radius: 4px;
  padding: 16px;
}

.result-text {
  margin: 0;
  font-size: 14px;
  line-height: 1.8;
  color: #303133;
  white-space: pre-wrap;
  word-wrap: break-word;
}
</style>
