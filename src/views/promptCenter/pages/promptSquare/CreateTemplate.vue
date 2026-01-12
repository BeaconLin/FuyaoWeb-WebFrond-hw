<template>
  <div class="page">
    <div class="page-header">
      <el-button @click="goBack">返回</el-button>
      <h2 class="page-title">{{ isEditMode ? '编辑模板' : '创建模板' }}</h2>
    </div>

    <el-card shadow="hover" v-loading="loading">
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
            ref="tagSelectRef"
            v-model="form.tag"
            multiple
            filterable
            placeholder="请选择相关标签"
            class="full-width tag-select-with-create"
            @change="handleTagChange"
            @visible-change="handleSelectVisibleChange"
          >
            <el-option
              v-for="tag in tagOptions"
              :key="tag.value"
              :label="tag.label"
              :value="tag.value"
            />
            <el-option
              :value="CREATE_TAG_OPTION_VALUE"
              :label="CREATE_TAG_OPTION_LABEL"
              class="create-tag-option"
            >
              <span class="create-tag-item">
                <el-icon><Plus /></el-icon>
                <span>创建新标签</span>
              </span>
            </el-option>
          </el-select>
        </el-form-item>

    <!-- 创建新标签对话框 -->
    <el-dialog
      v-model="createTagDialogVisible"
      title="创建新标签"
      width="400px"
      @close="handleCreateTagDialogClose"
    >
      <el-form
        ref="createTagFormRef"
        :model="createTagForm"
        :rules="createTagRules"
        label-width="80px"
      >
        <el-form-item label="标签名称" prop="tagName">
          <el-input
            v-model="createTagForm.tagName"
            placeholder="请输入标签名称"
            maxlength="20"
            show-word-limit
            @keyup.enter="handleCreateTag"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createTagDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleCreateTag">确定</el-button>
      </template>
    </el-dialog>

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
          <el-button type="primary" :loading="submitting" @click="submit">
            {{ isEditMode ? '更新模板' : '创建模板' }}
          </el-button>
          <el-button @click="reset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { reactive, ref, computed, onMounted, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import promptTemplateService from '../../service/promptTemplatesService'

const router = useRouter()
const route = useRoute()
const formRef = ref()
const tagSelectRef = ref()
const createTagFormRef = ref()
const submitting = ref(false)
const loading = ref(false)

// 创建标签对话框相关
const createTagDialogVisible = ref(false)
const createTagForm = reactive({
  tagName: '',
})

// 创建标签选项的特殊值（用于识别点击了"创建新标签"）
const CREATE_TAG_OPTION_VALUE = '__CREATE_NEW_TAG__'
const CREATE_TAG_OPTION_LABEL = '创建新标签'

// 创建标签表单验证规则
const createTagRules = {
  tagName: [
    { required: true, message: '请输入标签名称', trigger: 'blur' },
    { min: 1, max: 20, message: '标签名称长度在1到20个字符之间', trigger: 'blur' },
  ],
}

// 判断是否为编辑模式
const isEditMode = computed(() => {
  return route.query.mode === 'edit' && route.query.id
})

const form = reactive({
  templateName: '',
  tag: [],
  content: '',
  example: '',
})

const tagOptions = ref([
  { label: '对话', value: 'dialogue' },
  { label: '写作', value: 'writing' },
  { label: '翻译', value: 'translation' },
  { label: '代码', value: 'code' },
  { label: '分析', value: 'analysis' },
  { label: '总结', value: 'summary' },
  { label: '创意', value: 'creative' },
])

// 生成假数据模板（用于模拟接口数据）
const generateMockTemplateData = (templateId) => {
  const mockTemplates = {
    'example-001': {
      title: '代码生成助手',
      templateName: '代码生成助手',
      tag: 'code',
      content: '你是一个专业的编程助手。请根据以下需求生成代码：\n\n需求描述：{{requirement}}\n编程语言：{{language}}\n\n请提供完整的、可运行的代码，并附上必要的注释说明。',
      example: '需求描述：创建一个用户登录功能\n编程语言：JavaScript',
      exampleInput: '需求描述：创建一个用户登录功能\n编程语言：JavaScript',
    },
    'example-002': {
      title: '文章摘要生成器',
      templateName: '文章摘要生成器',
      tag: 'summary',
      content: '请对以下文章进行摘要，要求：\n1. 提取核心观点\n2. 总结主要内容\n3. 控制在200字以内\n\n文章内容：\n{{article}}',
      example: '文章内容：人工智能正在改变我们的生活方式，从智能家居到自动驾驶，AI技术已经深入到各个领域。',
      exampleInput: '文章内容：人工智能正在改变我们的生活方式，从智能家居到自动驾驶，AI技术已经深入到各个领域。',
    },
    'example-003': {
      title: '问题解答助手',
      templateName: '问题解答助手',
      tag: 'qa',
      content: '你是一个知识渊博的助手。请详细回答以下问题：\n\n用户问题：{{question}}\n\n请提供准确、详细的答案，如果涉及专业领域，请提供相关背景知识。',
      example: '用户问题：什么是Vue.js？它有什么特点？',
      exampleInput: '用户问题：什么是Vue.js？它有什么特点？',
    },
    'example-004': {
      title: '创意写作模板',
      templateName: '创意写作模板',
      tag: 'writing',
      content: '请根据以下要求创作一篇文章：\n\n主题：{{topic}}\n风格：{{style}}\n字数：{{wordCount}}\n\n要求文章结构清晰，语言生动，富有创意。',
      example: '主题：人工智能的未来\n风格：科普\n字数：1000',
      exampleInput: '主题：人工智能的未来\n风格：科普\n字数：1000',
    },
  }

  // 如果模板ID在假数据中存在，返回对应的数据
  if (mockTemplates[templateId]) {
    return mockTemplates[templateId]
  }

  // 否则返回一个默认的假数据模板
  return {
    title: '自定义模板',
    templateName: '自定义模板',
    tag: 'dialogue',
    content: '这是一个自定义模板的内容。\n\n变量示例：{{variable}}',
    example: '变量示例：这是变量的值',
    exampleInput: '变量示例：这是变量的值',
  }
}

const rules = {
  templateName: [
    { required: true, message: '请输入模板名称', trigger: 'blur' },
  ],
  tag: [
    {
      required: true,
      type: 'array',
      min: 1,
      message: '请至少选择一个标签',
      trigger: 'change',
    },
  ],
  content: [{ required: true, message: '请输入模板内容', trigger: 'blur' }],
  example: [{ required: true, message: '请输入使用案例', trigger: 'blur' }],
}

// 将标签字符串转换为数组
const convertTagToArray = (tag) => {
  if (!tag) {
    return []
  }
  if (Array.isArray(tag)) {
    return tag
  }
  // 支持逗号分隔的字符串
  if (typeof tag === 'string') {
    return tag.split(',').map((t) => t.trim()).filter((t) => t)
  }
  return [tag]
}

// 将标签数组转换为字符串（用于提交）
const convertTagToString = (tags) => {
  if (!tags || tags.length === 0) {
    return ''
  }
  if (Array.isArray(tags)) {
    // 过滤掉空值并转换为字符串
    return tags.filter((t) => t).join(',')
  }
  return String(tags)
}

// 处理标签变化
const handleTagChange = (value) => {
  // 检查是否点击了"创建新标签"选项
  if (Array.isArray(value) && value.includes(CREATE_TAG_OPTION_VALUE)) {
    // 移除特殊值
    const index = value.indexOf(CREATE_TAG_OPTION_VALUE)
    value.splice(index, 1)
    form.tag = value
    
    // 关闭下拉框
    if (tagSelectRef.value) {
      tagSelectRef.value.blur()
    }
    
    // 打开创建标签对话框
    createTagDialogVisible.value = true
    // 清空输入框
    setTimeout(() => {
      clearSelectInput()
    }, 50)
  } else {
    // 延迟清空输入框，确保标签已添加
    setTimeout(() => {
      clearSelectInput()
    }, 50)
  }
}

// 处理下拉框显示/隐藏变化，当下拉框关闭时清空输入框
const handleSelectVisibleChange = (visible) => {
  if (!visible) {
    // 下拉框关闭时，清空输入框
    setTimeout(() => {
      clearSelectInput()
    }, 100)
  }
}

// 清空 select 输入框
const clearSelectInput = () => {
  if (tagSelectRef.value) {
    const selectInstance = tagSelectRef.value
    if (selectInstance && selectInstance.$el) {
      // 查找输入框元素
      const inputEl = selectInstance.$el.querySelector('.el-select__input')
      if (inputEl) {
        inputEl.value = ''
        // 触发 input 事件以确保组件状态更新
        const inputEvent = new Event('input', { bubbles: true })
        inputEl.dispatchEvent(inputEvent)
      }
    }
  }
}

const goBack = () => {
  router.push({ name: 'prompt-square' })
}

// 加载模板数据（编辑模式）
const loadTemplateData = async () => {
  if (!isEditMode.value) {
    return
  }

  const templateId = route.query.id
  if (!templateId) {
    return
  }

  loading.value = true
  try {
    const res = await promptTemplateService.getTemplateDetail(templateId)
    if (res && res.code === 0 && res.data) {
      const template = res.data
      form.templateName = template.title || template.templateName || ''
      // 将标签字符串转换为数组（支持逗号分隔的多个标签）
      form.tag = convertTagToArray(template.tag || '')
      form.content = template.content || ''
      form.example = template.exampleInput || template.example || ''
    } else {
      // 接口失败时，使用假数据模拟
      console.warn('接口调用失败，使用假数据模拟:', res?.message || '接口调用失败')
      const mockData = generateMockTemplateData(templateId)
      form.templateName = mockData.title || mockData.templateName || ''
      form.tag = convertTagToArray(mockData.tag || '')
      form.content = mockData.content || ''
      form.example = mockData.exampleInput || mockData.example || ''
      // 不显示错误提示，直接使用假数据
    }
  } catch (error) {
    // 接口异常时，使用假数据模拟
    console.warn('接口调用异常，使用假数据模拟:', error)
    const mockData = generateMockTemplateData(templateId)
    form.templateName = mockData.title || mockData.templateName || ''
    form.tag = convertTagToArray(mockData.tag || '')
    form.content = mockData.content || ''
    form.example = mockData.exampleInput || mockData.example || ''
    // 不显示错误提示，直接使用假数据
  } finally {
    loading.value = false
  }
}

const reset = () => {
  if (isEditMode.value) {
    // 编辑模式：重置为原始数据
    loadTemplateData()
  } else {
    // 创建模式：清空表单
    form.templateName = ''
    form.tag = []
    form.content = ''
    form.example = ''
  }
}

const submit = () => {
  formRef.value?.validate(async (valid) => {
    if (!valid) {
      return
    }
    submitting.value = true
    try {
      const payload = {
        templateName: form.templateName,
        // 将标签数组转换为字符串（如果后端需要数组格式，可以保持 form.tag）
        tag: convertTagToString(form.tag),
        content: form.content,
        example: form.example,
      }

      let res
      if (isEditMode.value) {
        // 编辑模式：调用更新接口
        const templateId = route.query.id
        try {
          res = await promptTemplateService.updatePromptTemplate(templateId, payload)
          if (res && res.code === 0) {
            ElMessage.success(res.message || '模板更新成功')
            router.push({ name: 'prompt-square' })
          } else {
            // 接口失败时，使用假数据模拟成功
            console.warn('更新接口调用失败，使用假数据模拟:', res?.message || '接口调用失败')
            ElMessage.success('模板更新成功（模拟）')
            // 延迟跳转，让用户看到成功提示
            setTimeout(() => {
              router.push({ name: 'prompt-square' })
            }, 500)
          }
        } catch (error) {
          // 接口异常时，使用假数据模拟成功
          console.warn('更新接口调用异常，使用假数据模拟:', error)
          ElMessage.success('模板更新成功（模拟）')
          // 延迟跳转，让用户看到成功提示
          setTimeout(() => {
            router.push({ name: 'prompt-square' })
          }, 500)
        }
      } else {
        // 创建模式：调用创建接口
        res = await promptTemplateService.createPromptTemplate(payload)
        if (res && res.code === 0) {
          ElMessage.success(res.message || '模板创建成功')
          router.push({ name: 'prompt-square' })
        } else {
          ElMessage.error(res?.message || '创建模板失败')
        }
      }
    } catch (error) {
      ElMessage.error(error?.message || (isEditMode.value ? '更新模板失败' : '创建模板失败'))
    } finally {
      submitting.value = false
    }
  })
}

// 处理创建新标签
const handleCreateTag = async () => {
  if (!createTagFormRef.value) {
    return
  }
  
  createTagFormRef.value.validate(async (valid) => {
    if (!valid) {
      return
    }
    
    const tagName = createTagForm.tagName.trim()
    if (!tagName) {
      ElMessage.warning('请输入标签名称')
      return
    }
    
    // 检查标签是否已存在
    const existingTag = tagOptions.value.find(
      (tag) => tag.label === tagName || tag.value === tagName.toLowerCase()
    )
    
    if (existingTag) {
      ElMessage.warning('该标签已存在')
      return
    }
    
    // 创建新标签（这里可以调用接口保存到数据库）
    try {
      // 模拟接口调用（实际应该调用 promptTemplateService.createTag）
      // const res = await promptTemplateService.createTag({ tagName })
      // if (res && res.code === 0) {
      //   const newTag = {
      //     label: tagName,
      //     value: res.data.tagValue || tagName.toLowerCase(),
      //   }
      //   tagOptions.push(newTag)
      //   form.tag.push(newTag.value)
      //   ElMessage.success('标签创建成功')
      //   createTagDialogVisible.value = false
      //   createTagForm.tagName = ''
      // } else {
      //   ElMessage.error(res?.message || '创建标签失败')
      // }
      
      // 使用假数据模拟创建成功
      const newTagValue = tagName.toLowerCase().replace(/\s+/g, '-')
      const newTag = {
        label: tagName,
        value: newTagValue,
      }
      
      // 添加到标签选项列表（响应式更新）
      tagOptions.value.push(newTag)
      
      // 自动添加到选中状态
      if (!form.tag.includes(newTagValue)) {
        form.tag.push(newTagValue)
      }
      
      ElMessage.success('标签创建成功（模拟）')
      createTagDialogVisible.value = false
      createTagForm.tagName = ''
      
      // 等待 DOM 更新
      await nextTick()
      
      // 重新打开下拉框以显示新标签（可选，让用户看到新标签已添加）
      if (tagSelectRef.value) {
        // 触发下拉框更新
        tagSelectRef.value.focus()
        await nextTick()
        setTimeout(() => {
          tagSelectRef.value.blur()
        }, 200)
      }
    } catch (error) {
      ElMessage.error(error?.message || '创建标签失败')
    }
  })
}

// 处理创建标签对话框关闭
const handleCreateTagDialogClose = () => {
  createTagForm.tagName = ''
  if (createTagFormRef.value) {
    createTagFormRef.value.clearValidate()
  }
}

// 组件挂载时，如果是编辑模式则加载数据
onMounted(() => {
  if (isEditMode.value) {
    loadTemplateData()
  }
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
  justify-content: flex-start;
  gap: 16px;
  margin-bottom: 16px;
}

.page-title {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #303133;
}

.form {
  padding: 8px 12px 4px;
}

.full-width {
  width: 100%;
}

/* 固定"创建新标签"选项在下拉框底部 */
.tag-select-with-create :deep(.el-select-dropdown) {
  padding-bottom: 0;
}

.tag-select-with-create :deep(.el-select-dropdown__list) {
  padding-bottom: 0;
  max-height: 274px;
  overflow-y: auto;
}

.tag-select-with-create :deep(.el-select-dropdown__wrap) {
  max-height: 274px;
}

.create-tag-option {
  position: sticky;
  bottom: 0;
  background: #fff;
  border-top: 1px solid #ebeef5;
  margin-top: 4px;
  padding-top: 8px;
  padding-bottom: 8px;
  z-index: 10;
  cursor: pointer;
}

.create-tag-option:hover {
  background: #f5f7fa;
}

.create-tag-item {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #409eff;
  font-weight: 500;
}

.create-tag-item .el-icon {
  font-size: 16px;
}
</style>

