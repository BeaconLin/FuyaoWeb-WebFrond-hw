import { createRouter, createWebHistory } from 'vue-router'

const TaskBoard = () =>
    import ('../views/promptCenter/pages/promptEval/TaskBoard.vue')
const CreateTask = () =>
    import ('../views/promptCenter/pages/promptEval/CreateTask.vue')
const HomeView = () =>
    import ('../views/promptCenter/pages/promptEval/HomeView.vue')
const PromptSquare = () =>
    import ('../views/promptCenter/pages/promptSquare/home.vue')
const CreateTemplate = () =>
    import ('../views/promptCenter/pages/promptSquare/CreateTemplate.vue')

const router = createRouter({
    history: createWebHistory(
        import.meta.env.BASE_URL),
    routes: [{
            path: '/',
            redirect: '/promptSquare',
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
        {
            path: '/promptSquare',
            name: 'prompt-square',
            component: PromptSquare,
        },
        {
            path: '/createTemplate',
            name: 'create-template',
            component: CreateTemplate,
        },
    ],
})

export default router