<template>
  <el-dialog
    v-model="dialogVisible"
    :title="template?.title"
    width="1200px"
    class="template-detail-dialog"
    @update:model-value="handleDialogClose"
  >
    <div class="dialog-content">
      <!-- 左侧区域 -->
      <div class="dialog-left">
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
      <div class="dialog-right">
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
  </el-dialog>
</template>

<script setup>
import { ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { CopyDocument } from '@element-plus/icons-vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  template: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['update:modelValue'])

const dialogVisible = ref(false)
const leftActiveTab = ref('content')
const rightActiveTab = ref('')

// 监听 modelValue 变化，同步到 dialogVisible
watch(
  () => props.modelValue,
  (newVal) => {
    dialogVisible.value = newVal
    if (newVal && props.template) {
      // 重置tab状态
      leftActiveTab.value = 'content'
      // 设置右侧默认选中第一个模型
      if (props.template.inferenceResults && props.template.inferenceResults.length > 0) {
        rightActiveTab.value = props.template.inferenceResults[0].modelName
      }
    }
  },
  { immediate: true },
)

// 监听 dialogVisible 变化，同步到 modelValue
watch(dialogVisible, (newVal) => {
  emit('update:modelValue', newVal)
})

// 处理弹窗关闭
const handleDialogClose = (value) => {
  dialogVisible.value = value
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
</script>

<style scoped>
/* 弹窗样式 */
.template-detail-dialog :deep(.el-dialog__body) {
  padding: 20px;
}

.dialog-content {
  display: flex;
  gap: 24px;
  min-height: 500px;
}

.dialog-left {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.dialog-right {
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
