// 当前文件使用前端 Mock 数据，模拟后端接口返回结构，方便在无服务端时联调页面
// 如果后续接入真实接口，可恢复为 fetch 调用

const mockDelay = (ms = 400) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms)
  })

// 模拟任务列表数据
const allMockTasks = Array.from({ length: 45 }).map((_, index) => {
  const statusPool = ['running', 'success', 'failed', 'pending']
  const status = statusPool[index % statusPool.length]
  return {
    taskName: `移动app酒店推荐prompt评估-${index + 1}`,
    status,
    modelName: index % 2 === 0 ? 'gpt-4.1-mini' : 'qwen-max',
    userName: index % 3 === 0 ? 'alibaba' : 'tester',
    createTime: `2025-01-${String((index % 28) + 1).padStart(2, '0')} 10:0${
      index % 10
    }`,
  }
})

// POST /prompt_evaluation/tasks
export const fetchTasks = async (payload) => {
  const { pageNum = 1, pageSize = 20, taskName, status } = payload || {}

  // 过滤逻辑，与后端预期行为一致
  let filtered = [...allMockTasks]
  if (taskName) {
    filtered = filtered.filter((item) =>
      item.taskName.toLowerCase().includes(taskName.toLowerCase())
    )
  }
  if (status) {
    filtered = filtered.filter((item) => item.status === status)
  }

  const start = (pageNum - 1) * pageSize
  const end = start + pageSize
  const pageRecords = filtered.slice(start, end)

  await mockDelay()

  return {
    data: {
      records: pageRecords,
      total: filtered.length,
      pageNum,
      pageSize,
    },
    code: 0,
    message: 'mock success',
  }
}

// GET /prompt_eval_model
export const fetchEvalModels = async () => {
  await mockDelay()
  const list = [
    {
      modelName: 'gpt-4.1-mini',
      modelId: 'model-gpt-4.1-mini',
    },
    {
      modelName: 'qwen-plus',
      modelId: 'model-qwen-plus',
    },
    {
      modelName: 'qwen-max',
      modelId: 'model-qwen-max',
    },
  ]

  return {
    data: list,
    code: 0,
    message: 'mock success',
  }
}

// POST /prompt_evaluation/task
export const createEvaluationTask = async (payload) => {
  // 这里直接回显请求体，并假装后端生成了一个任务ID
  await mockDelay()

  return {
    data: {
      taskId: `mock-task-${Date.now()}`,
      ...payload,
    },
    code: 0,
    message: '任务创建成功（mock）',
  }
}

