import { createSignal } from 'solid-js'
import { apiClient } from '../api/client'
import type { AuthStatus, AuthUser, AuthChannelMessage, LoginCredentials } from './types'

const [user, setUser] = createSignal<AuthUser | null>(null)
const [status, setStatus] = createSignal<AuthStatus>('unknown')

let channel: BroadcastChannel | null = null

if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    channel = new BroadcastChannel('blog_auth_channel')
    channel.onmessage = (event: MessageEvent<AuthChannelMessage>) => {
      if (event.data?.type === 'logout') {
        setUser(null)
        setStatus('unauthenticated')
      } else if (event.data?.type === 'login') {
        checkAuth()
      }
    }
  } catch {
    channel = null
  }
}

function broadcast(msg: AuthChannelMessage) {
  try {
    channel?.postMessage(msg)
  } catch {
  }
}

export async function checkAuth(): Promise<boolean> {
  try {
    const me = await apiClient.getCurrentUser()
    const authUser: AuthUser = {
      id: me.id,
      email: me.email,
      display_name: me.display_name,
      bio: me.bio,
      role: me.role,
      status: me.status,
    }

    if (authUser.status !== 'active') {
      setUser(authUser)
      setStatus('unauthorized')
      return false
    }

    setUser(authUser)
    setStatus('authenticated')
    return true
  } catch {
    try {
      await apiClient.refreshToken()
      const me = await apiClient.getCurrentUser()
      const authUser: AuthUser = {
        id: me.id,
        email: me.email,
        display_name: me.display_name,
        bio: me.bio,
        role: me.role,
        status: me.status,
      }

      if (authUser.status !== 'active') {
        setUser(authUser)
        setStatus('unauthorized')
        return false
      }

      setUser(authUser)
      setStatus('authenticated')
      return true
    } catch {
      setUser(null)
      setStatus('unauthenticated')
      return false
    }
  }
}

export async function login(credentials: LoginCredentials): Promise<void> {
  await apiClient.login(credentials.email, credentials.password)
  const ok = await checkAuth()
  if (ok) {
    broadcast({ type: 'login' })
  }
}

export async function logout(): Promise<void> {
  try {
    await apiClient.logout()
  } finally {
    setUser(null)
    setStatus('unauthenticated')
    broadcast({ type: 'logout' })
  }
}

export const authStore = {
  user,
  status,
  setUser,
  setStatus,
  checkAuth,
  login,
  logout,
}
