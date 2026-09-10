import { FetchError } from 'ofetch'

export function problemMessage(error: unknown, fallback = 'Request failed') {
  if (error instanceof FetchError) {
    const data = error.data as {
      detail?: string
      title?: string
      errors?: Record<string, string[] | string>
    } | string | null

    if (typeof data === 'string' && data.trim()) {
      return data
    }

    if (data && typeof data === 'object') {
      if (data.errors) {
        const parts = Object.values(data.errors).flat().filter(Boolean)
        if (parts.length) {
          return parts.join(' ')
        }
      }
      return data.detail ?? data.title ?? fallback
    }

    return error.message || fallback
  }

  if (error instanceof Error && error.message) {
    return error.message
  }

  return fallback
}

export function isPasskeyCancel(error: unknown) {
  if (error instanceof DOMException) {
    return error.name === 'NotAllowedError' || error.name === 'AbortError'
  }

  return error instanceof Error && /cancelled or failed/i.test(error.message)
}

export function safeAppRedirect(value: unknown) {
  const path = Array.isArray(value) ? value[0] : value
  if (typeof path === 'string' && path.startsWith('/app') && !path.startsWith('//') && !path.includes('\\')) {
    return path
  }
  return '/app'
}

export function confirmRedirectStatus(url: string): 'confirmed' | 'failed' | null {
  if (url.includes('status=confirmed')) {
    return 'confirmed'
  }
  if (url.includes('status=failed')) {
    return 'failed'
  }
  return null
}

export function useAppAuth() {
  const { api, baseURL } = useApi()
  const { setMode, pushLog } = useAuthState()
  const { refreshSession, signOut, info, loading } = useAuthSession()

  const ensureCookieMode = () => {
    setMode('cookie')
  }

  const refreshCookieSession = async () => {
    ensureCookieMode()
    return refreshSession()
  }

  const { clear: clearPendingRegistration } = usePendingRegistration()

  const signOutCookie = async () => {
    ensureCookieMode()
    await signOut()
    clearPendingRegistration()
  }

  const loginWithPassword = async (email: string, password: string, rememberMe = true) => {
    ensureCookieMode()
    await api('/auth/cookie/login', {
      method: 'POST',
      query: rememberMe ? { useSessionCookies: false } : { useSessionCookies: true },
      body: {
        email,
        password
      },
      skipCsrf: true,
      auth: false
    })
    return refreshCookieSession()
  }

  const loginFailureMessage = (error: unknown) => {
    if (error instanceof FetchError && error.statusCode === 401) {
      return 'Invalid credentials.'
    }
    return problemMessage(error, 'Invalid credentials.')
  }

  const confirmEmail = async (query: {
    userId: string
    code: string
    changedEmail?: string
  }) => {
    const flow = query.changedEmail ? 'change-email' : 'confirm'
    const path = '/auth/cookie/confirmEmail'
    const url = `${baseURL.value}${path}`

    try {
      // Browser fetch cannot follow the API 302 onto this Nuxt origin (CORS).
      const result = await $fetch<{
        status: 'confirmed' | 'failed'
        flow: 'confirm' | 'change-email'
        location?: string
      }>('/api/app/confirm-email', {
        query: {
          userId: query.userId,
          code: query.code,
          changedEmail: query.changedEmail || undefined
        }
      })

      pushLog({
        method: 'GET',
        url: result.location || url,
        status: result.status === 'confirmed' ? 302 : null,
        ok: result.status === 'confirmed',
        requestBody: query,
        responseBody: result
      })

      return { status: result.status, flow: result.flow }
    } catch (error) {
      const failedUrl = error && typeof error === 'object' && 'response' in error
        ? String((error as { response?: { url?: string } }).response?.url ?? '')
        : ''
      const status = confirmRedirectStatus(failedUrl) ?? 'failed'
      pushLog({
        method: 'GET',
        url: failedUrl || url,
        status: null,
        ok: false,
        requestBody: query,
        error: problemMessage(error)
      })
      return { status, flow }
    }
  }

  return {
    api,
    info,
    loading,
    ensureCookieMode,
    refreshCookieSession,
    signOutCookie,
    loginWithPassword,
    loginFailureMessage,
    confirmEmail,
    problemMessage,
    isPasskeyCancel,
    safeAppRedirect
  }
}
