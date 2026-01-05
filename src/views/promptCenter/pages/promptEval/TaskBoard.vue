<template>
  <div class="page">
    <div class="page-header">
      <el-button type="primary" @click="goCreate">新建评估任务</el-button>
      <el-input
        v-model="searchName"
        placeholder="输入任务名称搜索"
        clearable
        class="search-input"
        @keyup.enter="refresh"
        @clear="refresh"
      >
        <template #append>
          <el-button @click="refresh">搜索</el-button>
        </template>
      </el-input>
    </div>

    <el-card shadow="hover" class="card">

      <el-table
        v-loading="loading"
        :data="tasks"
        stripe
        border
        class="task-table"
        height="520"
      >
        <el-table-column
          v-for="column in taskTableColumns"
          :key="column.prop"
          :prop="column.prop"
          :label="column.label"
          align="center"
          :filters="column.prop === 'status' ? statusFilters : undefined"
          :filter-method="column.prop === 'status' ? filterStatus : undefined"
        />
      </el-table>

      <div class="pagination">
        <el-pagination
          layout="prev, pager, next, jumper"
          :page-size="pagination.pageSize"
          :current-page="pagination.pageNum"
          :total="pagination.total"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { fetchTasks } from '@/api/promptEvaluation'
import { defaultPageSize, statusOptions, taskTableColumns } from '@/constants/promptEvaluation'

const loading = ref(false)
const tasks = ref([])
const searchName = ref('')
const router = useRouter()

const pagination = reactive({
  pageNum: 1,
  pageSize: defaultPageSize,
  total: 0,
})

const statusFilters = statusOptions
  .filter((item) => item.value)
  .map((item) => ({ text: item.label, value: item.value }))

const fetchTaskData = async () => {
  loading.value = true
  try {
    const payload = {
      pageSize: pagination.pageSize,
      pageNum: pagination.pageNum,
      taskName: searchName.value || undefined,
    }
    const res = await fetchTasks(payload)
    const list =
      res?.data?.records ||
      res?.data?.list ||
      res?.data ||
      res?.records ||
      res?.list ||
      res ||
      []
    tasks.value = Array.isArray(list) ? list : []
    pagination.total =
      res?.data?.total ||
      res?.total ||
      res?.data?.totalCount ||
      tasks.value.length
  } catch (error) {
    ElMessage.error(error?.message || '任务数据获取失败')
  } finally {
    loading.value = false
  }
}

const refresh = () => {
  pagination.pageNum = 1
  fetchTaskData()
}

const handlePageChange = (page) => {
  pagination.pageNum = page
  fetchTaskData()
}

const filterStatus = (value, row) => {
  if (!value) return true
  return row.status === value
}

const goCreate = () => {
  router.push({ name: 'task-create' })
}

onMounted(() => {
  fetchTaskData()
})
</script>

<style scoped>
.page {
  padding: 20px 24px;
  background: #f5f7fb;
  min-height: 100vh;
}
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}
.card {
  background: #fff;
}
.task-table {
  width: 100%;
}
.pagination {
  display: flex;
  justify-content: flex-end;
  padding: 16px 0 4px;
}
.search-input {
  width: 320px;
}
</style>

