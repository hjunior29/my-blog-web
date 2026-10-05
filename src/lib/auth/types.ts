export type AuthStatus = 'unknown' | 'unauthenticated' | 'authenticated' | 'unauthorized' | 'error'

export interface AuthUser {
  readonly id: string | number
  readonly email: string
  readonly display_name: string
  readonly bio?: string | null
  readonly role: 'owner' | 'author'
  readonly status: 'active' | 'inactive'
}

export type AuthChannelMessage =
  | { readonly type: 'login' }
  | { readonly type: 'logout' }

export interface LoginCredentials {
  readonly email: string
  readonly password: string
  readonly remember_me?: boolean
}

export type LoginStoreResult =
  | { readonly requires_2fa: false }
  | { readonly requires_2fa: true; readonly challenge_token: string; readonly email_masked: string }

