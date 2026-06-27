export const getApiUrl = () => {
  const rawUrl = import.meta.env.VITE_API_URL || `${window.location.origin}/api`
  const trimmedUrl = rawUrl.replace(/\/+$/, '')
  return trimmedUrl.endsWith('/api') ? trimmedUrl : `${trimmedUrl}/api`
}

const getAuthHeaders = () => {
  const token = localStorage.getItem('authToken')
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  }
}

export const loginAdmin = async (username, password) => {
  const res = await fetch(`${getApiUrl()}/auth/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  })

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    throw new Error(errorData.error || 'Invalid credentials')
  }

  const data = await res.json()
  localStorage.setItem('authToken', data.token)
  localStorage.setItem('userRole', data.role || 'admin')
  localStorage.setItem('username', username)
  localStorage.setItem('userId', data.userId || 'admin')
  return { token: data.token, role: data.role || 'admin', username, userId: data.userId || 'admin' }
}

export const loginDirector = async (username, password) => {
  const res = await fetch(`${getApiUrl()}/auth/director/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  })

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    throw new Error(errorData.error || 'Invalid credentials')
  }

  const data = await res.json()
  localStorage.setItem('authToken', data.token)
  localStorage.setItem('userRole', data.role || 'director')
  localStorage.setItem('username', username)
  localStorage.setItem('userId', data.userId || 'director')
  return { token: data.token, role: data.role || 'director', username, userId: data.userId || 'director' }
}

export const logout = () => {
  localStorage.removeItem('authToken')
  localStorage.removeItem('userRole')
  localStorage.removeItem('username')
  localStorage.removeItem('userId')
}

export const getAuthToken = () => localStorage.getItem('authToken')
export const getUserRole = () => localStorage.getItem('userRole')
export const getUserId = () => localStorage.getItem('userId')
export const getCurrentUser = () => ({
  username: localStorage.getItem('username'),
  role: localStorage.getItem('userRole'),
  userId: localStorage.getItem('userId'),
  token: localStorage.getItem('authToken')
})
export const getApiUrlHelper = getApiUrl
export const getAuthHeadersHelper = getAuthHeaders
