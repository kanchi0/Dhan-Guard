import { createContext, useContext, useState } from 'react'

// This file remembers who is logged in, for every page
const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  // Read the saved user from the browser when the app starts
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('dhanguard_user')
    return saved ? JSON.parse(saved) : null
  })

  // Save token and user after a successful login
  function saveLogin(token, userData) {
    localStorage.setItem('dhanguard_token', token)
    localStorage.setItem('dhanguard_user', JSON.stringify(userData))
    setUser(userData)
  }

  // Remove everything on logout
  function logout() {
    localStorage.removeItem('dhanguard_token')
    localStorage.removeItem('dhanguard_user')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, saveLogin, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

// Short helper so pages can write: const { user } = useAuth()
export function useAuth() {
  return useContext(AuthContext)
}