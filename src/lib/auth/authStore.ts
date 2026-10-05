import { createSignal } from 'solid-js'
import { apiClient, setCsrfToken } from '../api/client'
import { ApiError } from '../api/errors'
import type { AuthStatus, AuthUser, AuthChannelMessage, LoginCredentials, LoginStoreResult } from './types'

const [user, setUser] = createSignal<AuthUser | null>(null)
const [status, setStatus] = createSignal<AuthStatus>('unknown')

let channel: BroadcastChannel | null = null

if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    channel = new BroadcastChannel('blog_auth_channel')
    channel.onmessage = (event: MessageEvent<AuthChannelMessage>) => {
      if (event.data?.type === 'logout') {
        setCsrfToken(null)
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
    if (me.role !== 'owner' || me.status !== 'active') {
      setUser(null)
      setStatus('unauthorized')
      return false
    }
    await apiClient.getCsrfToken()
    setUser(me)
    setStatus('authenticated')
    return true
  } catch (error) {
    setUser(null)
    if (error instanceof ApiError && error.status === 401) {
      setCsrfToken(null)
      setStatus('unauthenticated')
    } else {
      setStatus('error')
    }
    return false
  }
}

export async function login(credentials: LoginCredentials): Promise<LoginStoreResult> {
  const result = credentials.remember_me
    ? await apiClient.login(credentials.email, credentials.password, credentials.remember_me)
    : await apiClient.login(credentials.email, credentials.password)
  if (result.requires_2fa) {
    return {
      requires_2fa: true,
      challenge_token: result.challenge_token,
      email_masked: result.email_masked,
    }
  }
  if (result.user.role !== 'owner' || result.user.status !== 'active') {
    setUser(null)
    setStatus('unauthorized')
    return { requires_2fa: false }
  }
  setUser(result.user)
  setStatus('authenticated')
  broadcast({ type: 'login' })
  return { requires_2fa: false }
}

export async function verify2Fa(challenge_token: string, code: string, remember_me?: boolean): Promise<void> {
  const result = remember_me
    ? await apiClient.verifyTwoFactor(challenge_token, code, remember_me)
    : await apiClient.verifyTwoFactor(challenge_token, code)
  if (result.user.role !== 'owner' || result.user.status !== 'active') {
    setUser(null)
    setStatus('unauthorized')
    return
  }
  setUser(result.user)
  setStatus('authenticated')
  broadcast({ type: 'login' })
}

export async function resend2Fa(challenge_token: string): Promise<{ challenge_token: string; email_masked: string }> {
  return await apiClient.resendTwoFactor(challenge_token)
}

export async function logout(): Promise<void> {
  await apiClient.logout()
  setUser(null)
  setStatus('unauthenticated')
  broadcast({ type: 'logout' })
}

export const authStore = {
  user,
  status,
  setUser,
  setStatus,
  checkAuth,
  login,
  verify2Fa,
  resend2Fa,
  logout,
}
