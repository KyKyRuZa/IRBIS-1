import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { authService } from '@lib/services/auth.service.js'
import queryClient from '@/lib/queryClient.js'

const AuthContext = createContext(null)

function useAuthState() {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('user')
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  })
  const [ready, setReady] = useState(false)
  const prevUserIdRef = useRef(null)

  useEffect(() => {
    if (prevUserIdRef.current !== null && prevUserIdRef.current !== user?.id) {
      queryClient.clear()
    }
    prevUserIdRef.current = user?.id
  }, [user?.id])

  useEffect(() => {
    let active = true
    authService
      .me()
      .then((data) => active && setUser(data))
      .catch((err) => {
        if (err?.response?.status === 401) active && setUser(null)
      })
      .finally(() => active && setReady(true))
    return () => {
      active = false
    }
  }, [])

  const login = useCallback((userData) => {
    localStorage.setItem('user', JSON.stringify(userData))
    setUser(userData)
  }, [])

  const logout = useCallback(async () => {
    try {
      await authService.logout()
    } catch {
      /* ignore network errors on logout */
    }
    localStorage.removeItem('user')
    await queryClient.clear()
    setUser(null)
    prevUserIdRef.current = null
  }, [])

  const isAuthenticated = Boolean(user)
  const isAdmin = isAuthenticated && user?.role === 'admin'

  return { user, login, logout, isAuthenticated, isAdmin, ready }
}

export function AuthProvider({ children }) {
  const auth = useAuthState()
  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context) return context
  throw new Error('useAuth must be used within AuthProvider')
}
