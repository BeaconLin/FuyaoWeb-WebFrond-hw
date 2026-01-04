import { createRouter, createWebHistory } from 'vue-router'

const TaskBoard = () =>
    import ('../views/TaskBoard.vue')
const CreateTask = () =>
    import ('../views/CreateTask.vue')
const HomeView = () =>
    import ('../views/HomeView.vue')

const router = createRouter({
    history: createWebHistory(
        import.meta.env.BASE_URL),
    routes: [{
            path: '/',
            redirect: '/tasks',
        },
        {
            path: '/tasks',
            name: 'task-board',
            component: TaskBoard,
        },
        {
            path: '/tasks/create',
            name: 'task-create',
            component: CreateTask,
        },
        // 保留原首页以防其他路由依赖
        {
            path: '/home',
            name: 'home',
            component: HomeView,
        },
    ],
})

export default router