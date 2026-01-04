export const taskTableColumns = [
  { prop: 'taskName', label: '任务名称' },
  { prop: 'status', label: '状态' },
  { prop: 'modelName', label: '模型名称' },
  { prop: 'userName', label: '创建人' },
  { prop: 'createTime', label: '开始时间' },
]

export const statusOptions = [
  { label: '全部', value: '' },
  { label: '运行中', value: 'running' },
  { label: '成功', value: 'success' },
  { label: '失败', value: 'failed' },
  { label: '待启动', value: 'pending' },
]

export const defaultPageSize = 20

