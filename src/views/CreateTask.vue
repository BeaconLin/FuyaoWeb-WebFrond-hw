<template>
  <div class="page">
    <div class="page-header">
      <el-button @click="goBack">返回看板</el-button>
    </div>

    <el-card shadow="hover">
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="110px"
        class="form"
      >
        <el-form-item label="任务名称" prop="taskName">
          <el-input
            v-model="form.taskName"
            placeholder="请输入任务名称"
            maxlength="100"
            show-word-limit
          />
        </el-form-item>

        <el-form-item label="评估模型" prop="modelId">
          <el-select
            v-model="form.modelId"
            filterable
            placeholder="请选择模型"
            @change="handleModelChange"
            class="full-width"
          >
            <el-option
              v-for="item in modelOptions"
              :key="item.modelId"
              :label="item.modelName"
              :value="item.modelId"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="待评估 Prompt">
          <div class="prompt-actions">
            <span class="helper">支持 1-3 个 Prompt，便于对比</span>
            <div class="prompt-buttons">
              <el-button
                size="small"
                type="primary"
                :disabled="form.prompts.length >= 3"
                @click="addPrompt"
              >
                新增 Prompt
              </el-button>
              <el-button
                v-if="form.prompts.length > 1"
                size="small"
                plain
                @click="removePrompt"
              >
                移除最后一个
              </el-button>
            </div>
          </div>

          <el-row :gutter="12" class="prompt-grid">
            <el-col
              v-for="(prompt, index) in form.prompts"
              :key="index"
              :span="24 / form.prompts.length"
            >
              <el-card class="prompt-card" shadow="never">
                <div class="prompt-title">Prompt {{ index + 1 }}</div>
                <el-input
                  v-model="form.prompts[index]"
                  type="textarea"
                  :autosize="{ minRows: 4, maxRows: 8 }"
                  placeholder="请输入 Prompt 模板内容"
                />
              </el-card>
            </el-col>
          </el-row>
        </el-form-item>

        <el-form-item label="数据集上传" prop="dataSets">
          <el-upload
            class="upload"
            action="#"
            drag
            multiple
            :auto-upload="false"
            :file-list="fileList"
            :http-request="dummyRequest"
            :on-change="handleFileChange"
            :on-remove="handleFileRemove"
          >
            <el-icon class="el-icon--upload"><upload-filled /></el-icon>
            <div class="el-upload__text">
              拖拽文件到此处，或 <em>点击上传</em>
            </div>
            <template #tip>
              <div class="el-upload__tip">
                文件不会真实上传，记录文件名作为数据集标识
              </div>
            </template>
          </el-upload>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" :loading="submitting" @click="submit">
            启动任务
          </el-button>
          <el-button @click="reset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { UploadFilled } from '@element-plus/icons-vue'
import {
  createEvaluationTask,
  fetchEvalModels,
} from '@/api/promptEvaluation'
import { userProfileStore } from '@/stores/userProfile'

const router = useRouter()
const profile = userProfileStore()
const { userInfo } = profile

const formRef = ref()
const submitting = ref(false)
const modelOptions = ref([])
const fileList = ref([])

const form = reactive({
  taskName: '',
  modelId: '',
  modelName: '',
  prompts: [''],
  dataSets: {
    S3Datasets: [],
  },
})

const rules = {
  taskName: [{ required: true, message: '请输入任务名称', trigger: 'blur' }],
  modelId: [{ required: true, message: '请选择模型', trigger: 'change' }],
  dataSets: [
    {
      validator: (_, value, callback) => {
        if (value?.S3Datasets?.length) {
          callback()
        } else {
          callback(new Error('请至少上传一个数据集'))
        }
      },
      trigger: 'change',
    },
  ],
}

const goBack = () => {
  router.push({ name: 'task-board' })
}

const handleModelChange = (value) => {
  const current = modelOptions.value.find((item) => item.modelId === value)
  form.modelName = current?.modelName || ''
}

const addPrompt = () => {
  if (form.prompts.length < 3) {
    form.prompts.push('')
  }
}

const removePrompt = () => {
  if (form.prompts.length > 1) {
    form.prompts.pop()
  }
}

const dummyRequest = () => Promise.resolve()

const syncDatasets = () => {
  form.dataSets.S3Datasets = fileList.value.map((file) => file.name)
}

const handleFileChange = (file, list) => {
  fileList.value = list
  syncDatasets()
}

const handleFileRemove = (file, list) => {
  fileList.value = list
  syncDatasets()
}

const reset = () => {
  form.taskName = ''
  form.modelId = ''
  form.modelName = ''
  form.prompts = ['']
  fileList.value = []
  syncDatasets()
}

const submit = () => {
  formRef.value?.validate(async (valid) => {
    if (!valid) return
    submitting.value = true
    try {
      const payload = {
        modelId: form.modelId,
        modelName: form.modelName,
        scene: 'prompt评估',
        isOnline: true,
        threadCounts: 4,
        userId: userInfo.userId,
        userName: userInfo.userName,
        taskName: form.taskName,
        prompts: {
          prompts: form.prompts.filter((item) => item?.trim()),
        },
        dataSets: {
          S3Datasets: form.dataSets.S3Datasets,
        },
      }
      await createEvaluationTask(payload)
      ElMessage.success('任务创建成功')
      router.push({ name: 'task-board' })
    } catch (error) {
      ElMessage.error(error?.message || '创建任务失败')
    } finally {
      submitting.value = false
    }
  })
}

const loadModels = async () => {
  try {
    const res = await fetchEvalModels()
    const list = res?.data || res?.list || res || []
    modelOptions.value = Array.isArray(list) ? list : []
  } catch (error) {
    ElMessage.error(error?.message || '模型列表获取失败')
  }
}

onMounted(() => {
  loadModels()
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
  margin-bottom: 16px;
}
.form {
  padding: 8px 12px 4px;
}
.full-width {
  width: 100%;
}
.prompt-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  color: #6b7280;
}
.prompt-buttons {
  display: flex;
  gap: 8px;
}
.prompt-grid {
  width: 100%;
}
.prompt-card {
  min-height: 160px;
}
.prompt-title {
  font-weight: 600;
  color: #374151;
  margin-bottom: 8px;
}
.upload {
  width: 100%;
}
</style>

