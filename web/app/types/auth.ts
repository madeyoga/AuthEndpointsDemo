export type AuthMode = 'cookie' | 'jwt'

export interface ApiLogEntry {
  id: number
  at: string
  method: string
  url: string
  status: number | null
  ok: boolean
  requestBody?: unknown
  responseBody?: unknown
  error?: string
}

export interface ManageInfo {
  email?: string | null
  isEmailConfirmed?: boolean
  claims?: { type: string, value: string }[]
}

export interface JwtTokenResponse {
  accessToken: string
  tokenType?: string
}

export interface PasskeyCredential {
  credentialId: string
  displayName?: string | null
}
