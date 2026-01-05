<template>
  <div class="page">
    <div class="page-header">
      <el-button @click="goBack">返回</el-button>
    </div>

    <el-card shadow="hover">
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

        <el-form-item label="相关标签" prop="tags">
          <el-select
            v-model="form.tags"
            multiple
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
          <el-button type="primary" :loading="submitting" @click="submit">
            创建模板
          </el-button>
          <el-button @click="reset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'

const router = useRouter()
const formRef = ref()
const submitting = ref(false)

const form = reactive({
  templateName: '',
  tags: [],
  content: '',
  example: '',
})

const tagOptions = [
  { label: '对话', value: 'dialogue' },
  { label: '写作', value: 'writing' },
  { label: '翻译', value: 'translation' },
  { label: '代码', value: 'code' },
  { label: '分析', value: 'analysis' },
  { label: '总结', value: 'summary' },
  { label: '创意', value: 'creative' },
]

const rules = {
  templateName: [
    { required: true, message: '请输入模板名称', trigger: 'blur' },
  ],
  tags: [{ required: true, message: '请至少选择一个标签', trigger: 'change' }],
  content: [{ required: true, message: '请输入模板内容', trigger: 'blur' }],
  example: [{ required: true, message: '请输入使用案例', trigger: 'blur' }],
}

const goBack = () => {
  router.push({ name: 'prompt-square' })
}

const reset = () => {
  form.templateName = ''
  form.tags = []
  form.content = ''
  form.example = ''
}

const submit = () => {
  formRef.value?.validate(async (valid) => {
    if (!valid) return
    submitting.value = true
    try {
      // TODO: 调用创建模板的API
      console.log('提交表单:', form)
      ElMessage.success('模板创建成功')
      router.push({ name: 'prompt-square' })
    } catch (error) {
      ElMessage.error(error?.message || '创建模板失败')
    } finally {
      submitting.value = false
    }
  })
}
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
</style>

