import axios from 'axios'

// The backend address comes from the .env file
export const API_URL = import.meta.env.VITE_API_URL

// One Axios instance used by the whole app
const api = axios.create({ baseURL: API_URL })

// Before every request, add the login token if we have one
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('dhanguard_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// After every answer: if the token is expired or invalid (401),
// clear the saved login and go back to the login page.
// The login request itself is skipped, so "Incorrect email or password."
// still shows on the form.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status
    const url = error.config?.url
    if (status === 401 && url !== '/login') {
      localStorage.removeItem('dhanguard_token')
      localStorage.removeItem('dhanguard_user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  },
)

// Turn an image_url like "/uploads/abc.jpg" into a full address
export function imageSrc(imageUrl) {
  return `${API_URL}${imageUrl}`
}

export default api