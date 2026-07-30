import type { AuthMode, ApiLogEntry } from '~/types/auth'

const JWT_STORAGE_KEY = 'authendpoints.demo.accessToken'
const MODE_STORAGE_KEY = 'authendpoints.demo.mode'
const REAUTH_STORAGE_KEY = 'authendpoints.demo.reauthToken'

export function useAuthState() {
  const mode = useState<AuthMode>('auth-mode', () => 'cookie')
  const accessToken = useState<string | null>('auth-access-token', () => null)
  const reauthToken = useState<string | null>('auth-reauth-token', () => null)
  const email = useState<string | null>('auth-email', () => null)
  const logs = useState<ApiLogEntry[]>('auth-api-logs', () => [])
  let logSeq = 0

  const hydrate = () => {
    if (!import.meta.client) {
      return
    }
    const storedMode = sessionStorage.getItem(MODE_STORAGE_KEY)
    if (storedMode === 'cookie' || storedMode === 'jwt') {
      mode.value = storedMode
    }
    accessToken.value = sessionStorage.getItem(JWT_STORAGE_KEY)
    reauthToken.value = sessionStorage.getItem(REAUTH_STORAGE_KEY)
  }

  const setMode = (next: AuthMode) => {
    mode.value = next
    if (import.meta.client) {
      sessionStorage.setItem(MODE_STORAGE_KEY, next)
    }
  }

  const setAccessToken = (token: string | null) => {
    accessToken.value = token
    if (!import.meta.client) {
      return
    }
    if (token) {
      sessionStorage.setItem(JWT_STORAGE_KEY, token)
    } else {
      sessionStorage.removeItem(JWT_STORAGE_KEY)
    }
  }

  const setReauthToken = (token: string | null) => {
    reauthToken.value = token
    if (!import.meta.client) {
      return
    }
    if (token) {
      sessionStorage.setItem(REAUTH_STORAGE_KEY, token)
    } else {
      sessionStorage.removeItem(REAUTH_STORAGE_KEY)
    }
  }

  const pushLog = (entry: Omit<ApiLogEntry, 'id' | 'at'>) => {
    logSeq += 1
    logs.value = [
      {
        id: logSeq,
        at: new Date().toISOString(),
        ...entry
      },
      ...logs.value
    ].slice(0, 40)
  }

  const clearLogs = () => {
    logs.value = []
  }

  return {
    mode,
    accessToken,
    reauthToken,
    email,
    logs,
    hydrate,
    setMode,
    setAccessToken,
    setReauthToken,
    pushLog,
    clearLogs
  }
}
