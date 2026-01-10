// Axios 服务封装
// 这里提供一个基础的 axiosService 实现
// 如果项目中已有 axios 配置，可以替换为实际的实现

// 注意：如果项目中没有安装 axios，需要先安装：npm install axios
// import axios from 'axios'

// 临时实现：如果还没有配置 axios，这里提供一个简单的 mock 实现
// 实际使用时，应该替换为真实的 axios 实例

const axiosService = {
  get: (url: string, params?: any): Promise<any> => {
    // TODO: 替换为真实的 axios.get 调用
    // return axios.get(url, { params })
    console.warn('axiosService.get 需要实现真实的 axios 调用', url, params)
    return Promise.reject(new Error('axiosService 未实现，请先配置 axios'))
  },

  post: (url: string, data?: any): Promise<any> => {
    // TODO: 替换为真实的 axios.post 调用
    // return axios.post(url, data)
    console.warn('axiosService.post 需要实现真实的 axios 调用', url, data)
    return Promise.reject(new Error('axiosService 未实现，请先配置 axios'))
  },

  put: (url: string, data?: any): Promise<any> => {
    // TODO: 替换为真实的 axios.put 调用
    // return axios.put(url, data)
    console.warn('axiosService.put 需要实现真实的 axios 调用', url, data)
    return Promise.reject(new Error('axiosService 未实现，请先配置 axios'))
  },

  delete: (url: string, params?: any): Promise<any> => {
    // TODO: 替换为真实的 axios.delete 调用
    // return axios.delete(url, { params })
    console.warn('axiosService.delete 需要实现真实的 axios 调用', url, params)
    return Promise.reject(new Error('axiosService 未实现，请先配置 axios'))
  },
}

export default axiosService

