<template>
  <div class="page">
    <div class="page-header">
      <el-radio-group v-model="templateType" @change="handleTypeChange">
        <el-radio-button label="preset">预置模板</el-radio-button>
        <el-radio-button label="custom">自定义模板</el-radio-button>
        <el-radio-button label="favorite">我的收藏</el-radio-button>
      </el-radio-group>
    </div>

    <div class="search-section">
      <el-input
        v-model="searchKeyword"
        placeholder="请输入搜索内容"
        clearable
        class="search-input"
        @keyup.enter="handleSearch"
        @clear="handleSearch"
      >
        <template #suffix>
          <el-icon class="search-icon" @click="handleSearch">
            <Search />
          </el-icon>
        </template>
      </el-input>
    </div>

    <div class="tags-section">
      <div class="tags-container">
        <el-tag
          v-for="tag in tags"
          :key="tag.value"
          :type="isTagSelected(tag.value) ? 'primary' : 'info'"
          :effect="isTagSelected(tag.value) ? 'dark' : 'plain'"
          :class="['tag-item', { 'tag-divider': tag.value === 'all' }]"
          @click="handleTagClick(tag.value)"
        >
          {{ tag.label }}
        </el-tag>
      </div>
      <el-button type="primary" @click="goCreateTemplate">
        <el-icon><Plus /></el-icon>
        创建模板
      </el-button>
    </div>

    <div class="templates-section">
      <div class="templates-grid">
        <el-card
          v-for="template in currentPageTemplates"
          :key="template.id"
          shadow="hover"
          class="template-card"
          @click="openTemplateDetail(template)"
        >
          <div class="card-header">
            <h3 class="template-title">{{ template.title }}</h3>
          </div>
          <div class="card-content">
            <p class="template-content">{{ template.contentPreview }}</p>
          </div>
          <div class="card-tags">
            <el-tag
              v-if="template.tag"
              size="small"
              class="content-tag"
            >
              {{ getTagLabel(template.tag) }}
            </el-tag>
          </div>
          <div class="card-footer">
            <div class="card-stats">
              <span class="stat-item">
                <el-icon><Star /></el-icon>
                <span>{{ template.favoriteCount }}</span>
              </span>
              <span class="stat-item">
                <el-icon><View /></el-icon>
                <span>{{ template.viewCount }}</span>
              </span>
            </div>
            <el-icon
              class="copy-icon"
              @click.stop="handleCopy(template.content)"
            >
              <CopyDocument />
            </el-icon>
          </div>
        </el-card>
      </div>

      <div class="pagination">
        <el-pagination
          layout="prev, pager, next, jumper"
          :page-size="pagination.pageSize"
          :current-page="pagination.pageNum"
          :total="pagination.total"
          @current-change="handlePageChange"
        />
      </div>
    </div>

    <!-- 模板详情弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="currentTemplate?.title"
      width="1200px"
      class="template-detail-dialog"
    >
      <div class="dialog-content">
        <!-- 左侧区域 -->
        <div class="dialog-left">
          <!-- 上方：内容/示例输入切换 -->
          <div class="left-top">
            <el-tabs v-model="leftActiveTab" class="content-tabs">
              <el-tab-pane label="模板内容" name="content">
                <div class="content-wrapper">
                  <pre class="template-content-text">{{ currentTemplate?.content }}</pre>
                  <el-button
                    class="copy-content-btn"
                    size="small"
                    type="primary"
                    plain
                    @click.stop="handleCopy(currentTemplate?.content)"
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
                    <pre class="example-text">{{ getFullPrompt(currentTemplate) }}</pre>
                  </div>
                </div>
              </el-tab-pane>
            </el-tabs>
          </div>

          <!-- 下方：模板相关信息 -->
          <div class="left-bottom">
            <div class="info-item">
              <span class="info-label">模板ID：</span>
              <span class="info-value">{{ currentTemplate?.id }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">模板来源：</span>
              <span class="info-value">{{ getTemplateSource(currentTemplate) }}</span>
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
              <span class="info-value">{{ currentTemplate?.createTime }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">浏览量：</span>
              <span class="info-value">{{ currentTemplate?.viewCount }}</span>
            </div>
          </div>
        </div>

        <!-- 右侧区域：推理结果 -->
        <div class="dialog-right">
          <el-tabs v-model="rightActiveTab" class="model-tabs">
            <el-tab-pane
              v-for="result in currentTemplate?.inferenceResults"
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
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Plus, Star, View, CopyDocument, Search } from '@element-plus/icons-vue'
import promptTemplateService from '../../service/promptTemplatesService'

const router = useRouter()

// 模板类型：preset-预置模板, custom-自定义模板, favorite-我的收藏
const templateType = ref('preset')
const searchKeyword = ref('')
const selectedTags = ref(['all']) // 支持多选，默认选中"全选"

// 弹窗相关
const dialogVisible = ref(false)
const currentTemplate = ref(null)
const leftActiveTab = ref('content') // 左侧tab：content或example
const rightActiveTab = ref('') // 右侧tab：模型名称

// 分页配置：每页20个（5列 x 4行）
const pagination = reactive({
  pageNum: 1,
  pageSize: 20,
  total: 0,
})

// 列表数据（当前页）
const templates = ref([])

// 加载状态
const loading = ref(false)

// 标签列表（根据当前模板类型从接口获取）
const tags = ref([])

// 当前页的模板列表
const currentPageTemplates = computed(() => templates.value)

// 调用接口获取模板列表
const loadTemplates = async () => {
  loading.value = true
  try {
    const res = await promptTemplateService.getPromptTemplates(
      String(pagination.pageNum),
      String(pagination.pageSize),
      {
        templateType: templateType.value,
        selectedTags: selectedTags.value,
        searchKeyword: searchKeyword.value,
      }
    )

    // 这里假设 axiosService 已经在拦截器中返回了 data，
    // 且结构为 { code, data: { records, total, pageNum, pageSize } }
    if (res && res.code === 0 && res.data) {
      templates.value = res.data.records || []
      pagination.total = res.data.total || 0
    } else {
      ElMessage.error(res?.message || '获取模板列表失败')
    }
  } catch (error) {
    ElMessage.error('获取模板列表异常，请稍后重试')
  } finally {
    loading.value = false
  }
}

// 调用接口获取当前模板类型的标签分类
const loadTags = async () => {
  try {
    const res = await promptTemplateService.getTemplateTags(
      templateType.value
    )
    // 假设返回结构为 { code, data: [{ label, value }, ...] }
    if (res && res.code === 0) {
      tags.value = Array.isArray(res.data) ? res.data : []
    } else {
      ElMessage.error(res?.message || '获取标签分类失败')
      tags.value = []
    }
  } catch (error) {
    ElMessage.error('获取标签分类异常，请稍后重试')
    tags.value = []
  }
}

// 处理模板类型切换
const handleTypeChange = (value) => {
  // 重置标签选择为"全选"
  selectedTags.value = ['all']

  // 重置搜索关键词
  searchKeyword.value = ''

  // 重置分页到第一页
  pagination.pageNum = 1

  // 根据新的模板类型刷新标签和模板列表
  loadTags()
  loadTemplates()
}

// 处理搜索
const handleSearch = () => {
  // 搜索逻辑已在 filteredTemplates 计算属性中实现
  // 重置到第一页
  pagination.pageNum = 1
  // 重新请求数据
  loadTemplates()
}

// 判断标签是否被选中
const isTagSelected = (tagValue) => {
  return selectedTags.value.includes(tagValue)
}

// 处理标签点击
const handleTagClick = (tagValue) => {
  if (tagValue === 'all') {
    // 点击"全选"
    if (selectedTags.value.includes('all')) {
      // 如果已经选中"全选"，则取消选中
      selectedTags.value = []
    } else {
      // 否则选中"全选"，清空其他选中项
      selectedTags.value = ['all']
    }
  } else {
    // 点击其他标签
    const index = selectedTags.value.indexOf(tagValue)
    if (index > -1) {
      // 如果已选中，则取消选中
      selectedTags.value.splice(index, 1)
      // 如果取消后没有选中任何标签，自动选中"全选"
      if (selectedTags.value.length === 0) {
        selectedTags.value = ['all']
      }
    } else {
      // 如果未选中，则添加选中
      // 如果当前选中了"全选"，先移除"全选"
      const allIndex = selectedTags.value.indexOf('all')
      if (allIndex > -1) {
        selectedTags.value.splice(allIndex, 1)
      }
      selectedTags.value.push(tagValue)
    }
  }
  // 重置到第一页
  pagination.pageNum = 1
  // 重新请求数据
  loadTemplates()
}

// 获取标签的中文标签（接口直接返回 label，这里兜底）
const getTagLabel = (tagValue) => {
  const tag = tags.value.find((item) => item.value === tagValue)
  return tag?.label || tagValue
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

// 处理分页切换
const handlePageChange = (page) => {
  pagination.pageNum = page
  loadTemplates()
}

// 跳转到创建模板页面
const goCreateTemplate = () => {
  router.push({ name: 'create-template' })
}

// 打开模板详情弹窗
const openTemplateDetail = (template) => {
  currentTemplate.value = template
  dialogVisible.value = true
  // 重置tab状态
  leftActiveTab.value = 'content'
  // 设置右侧默认选中第一个模型
  if (template.inferenceResults && template.inferenceResults.length > 0) {
    rightActiveTab.value = template.inferenceResults[0].modelName
  }
}

// 获取模板来源显示文本
const getTemplateSource = (template) => {
  if (!template) return ''
  if (template.source === 'preset') {
    return '预置模板'
  } else if (template.source === 'custom') {
    return template.createBy || '自定义模板'
  }
  return '未知'
}

// 解析示例输入，提取变量值映射
const parseExampleInput = (exampleInput) => {
  if (!exampleInput) return {}
  
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

onMounted(() => {
  // 初始化加载标签和数据
  loadTags()
  loadTemplates()
})
</script>

<style scoped>
.page {
  padding: 20px 24px;
  background: #f5f7fb;
  min-height: 100vh;
}

.page-header {
  margin-bottom: 20px;
}

.search-section {
  margin-bottom: 20px;
}

.search-input {
  width: 400px;
}

.search-icon {
  font-size: 18px;
  color: #909399;
  cursor: pointer;
  transition: all 0.3s;
  padding: 4px;
}

.search-icon:hover {
  color: #409eff;
}

.tags-section {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
}

.tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
  flex: 1;
}

.tag-item {
  cursor: pointer;
  user-select: none;
  transition: all 0.3s;
}

.tag-item:hover {
  opacity: 0.8;
}

.tag-divider {
  position: relative;
  margin-right: 12px;
}

.tag-divider::after {
  content: '';
  position: absolute;
  right: -18px;
  top: 50%;
  transform: translateY(-50%);
  width: 1px;
  height: 16px;
  background-color: #dcdfe6;
}

.templates-section {
  margin-top: 24px;
}

.templates-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.template-card {
  height: 100%;
  display: flex;
  flex-direction: column;
  cursor: pointer;
  transition: all 0.3s;
}

.template-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.card-header {
  margin-bottom: 12px;
}

.template-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-content {
  flex: 1;
  margin-bottom: 12px;
}

.template-content {
  font-size: 14px;
  color: #606266;
  line-height: 1.6;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}

.content-tag {
  font-size: 12px;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 12px;
  border-top: 1px solid #ebeef5;
}

.card-stats {
  display: flex;
  gap: 16px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: #909399;
}

.stat-item .el-icon {
  font-size: 14px;
}

.copy-icon {
  font-size: 18px;
  color: #409eff;
  cursor: pointer;
  transition: all 0.3s;
}

.copy-icon:hover {
  color: #66b1ff;
  transform: scale(1.1);
}

.pagination {
  display: flex;
  justify-content: flex-end;
  padding-top: 16px;
}

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

