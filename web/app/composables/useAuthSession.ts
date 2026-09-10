import type { ManageInfo } from '~/types/auth'
import { FetchError } from 'ofetch'

export function useAuthSession() {
  const { mode, email, accessToken, setAccessToken, setReauthToken } = useAuthState()
  const { api, clearCsrf, logoutLocal } = useApi()
  const { clear: clearPendingRegistration } = usePendingRegistration()
  const loading = useState('auth-session-loading', () => false)
  const info = useState<ManageInfo | null>('auth-manage-info', () => null)

  const refreshSession = async () => {
    loading.value = true
    try {
      if (mode.value === 'jwt') {
        if (!accessToken.value) {
          info.value = null
          email.value = null
          return null
        }
        await api('/auth/jwt/verify', { auth: true })
      }

      const manage = await api<ManageInfo>('/auth/cookie/manage/info', {
        auth: mode.value === 'jwt'
      })
      info.value = manage
      email.value = manage.email ?? null
      return manage
    } catch (error) {
      info.value = null
      email.value = null
      if (mode.value === 'jwt' && error instanceof FetchError && error.statusCode === 401) {
        setAccessToken(null)
      }
      return null
    } finally {
      loading.value = false
    }
  }

  const signOut = async () => {
    try {
      if (mode.value === 'jwt') {
        await api('/auth/jwt/logout', {
          method: 'POST',
          auth: true,
          csrfPath: '/auth/jwt/csrfToken'
        })
      } else {
        await api('/auth/cookie/logout', {
          method: 'POST',
          auth: false,
          csrfPath: '/auth/cookie/csrfToken'
        })
      }
    } catch {
      // Local cleanup still runs.
    } finally {
      logoutLocal()
      setReauthToken(null)
      info.value = null
      email.value = null
      clearCsrf()
      clearPendingRegistration()
    }
  }

  return {
    loading,
    info,
    refreshSession,
    signOut
  }
}
