import { FetchError } from 'ofetch'

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

interface ApiRequestOptions {
  method?: HttpMethod
  body?: unknown
  query?: Record<string, string | number | boolean | undefined | null>
  /** Skip CSRF for this call */
  skipCsrf?: boolean
  /** Force cookie CSRF path even in JWT mode */
  csrfPath?: '/auth/cookie/csrfToken' | '/auth/jwt/csrfToken'
  /** Attach Authorization Bearer (JWT mode) */
  auth?: boolean
  /** Attach X-AuthEndpoints-Reauth */
  reauth?: boolean
  /** Do not log this call (e.g. csrf prefetch) */
  silent?: boolean
}

function isMutating(method: HttpMethod) {
  return method !== 'GET'
}

export function useApi() {
  const config = useRuntimeConfig()
  const {
    mode,
    accessToken,
    reauthToken,
    pushLog,
    setAccessToken
  } = useAuthState()

  const baseURL = computed(() => String(config.public.apiBase).replace(/\/$/, ''))

  const csrfCache = useState<{ cookie?: string, jwt?: string }>('auth-csrf-cache', () => ({}))

  const fetchCsrf = async (path: '/auth/cookie/csrfToken' | '/auth/jwt/csrfToken') => {
    const key = path.includes('/jwt/') ? 'jwt' : 'cookie'
    const response = await $fetch<{ csrfToken?: string, CsrfToken?: string }>(path, {
      baseURL: baseURL.value,
      credentials: 'include',
      method: 'GET'
    })
    const token = response.csrfToken ?? response.CsrfToken ?? ''
    csrfCache.value = { ...csrfCache.value, [key]: token }
    return token
  }

  const ensureCsrf = async (preferred?: '/auth/cookie/csrfToken' | '/auth/jwt/csrfToken') => {
    const path = preferred
      ?? (mode.value === 'jwt' ? '/auth/jwt/csrfToken' : '/auth/cookie/csrfToken')
    const key = path.includes('/jwt/') ? 'jwt' : 'cookie'
    if (csrfCache.value[key]) {
      return csrfCache.value[key]!
    }
    return fetchCsrf(path)
  }

  const api = async <T = unknown>(path: string, options: ApiRequestOptions = {}): Promise<T> => {
    const method = (options.method ?? 'GET').toUpperCase() as HttpMethod
    const url = `${baseURL.value}${path.startsWith('/') ? path : `/${path}`}`
    const headers: Record<string, string> = {
      Accept: 'application/json'
    }

    if (options.body !== undefined) {
      headers['Content-Type'] = 'application/json'
    }

    const useAuth = options.auth ?? mode.value === 'jwt'
    if (useAuth && accessToken.value) {
      headers.Authorization = `Bearer ${accessToken.value}`
    }

    if (options.reauth && reauthToken.value) {
      headers['X-AuthEndpoints-Reauth'] = reauthToken.value
    }

    if (isMutating(method) && !options.skipCsrf) {
      // Bearer-authenticated requests skip CSRF server-side; cookie sessions need it.
      const needsCsrf = !(useAuth && accessToken.value)
      if (needsCsrf) {
        const csrf = await ensureCsrf(options.csrfPath)
        headers.RequestVerificationToken = csrf
      }
    }

    try {
      const data = await $fetch<T>(url, {
        method,
        credentials: 'include',
        headers,
        body: options.body as BodyInit | Record<string, unknown> | null | undefined,
        query: options.query
      })

      if (!options.silent) {
        pushLog({
          method,
          url,
          status: 200,
          ok: true,
          requestBody: options.body,
          responseBody: data
        })
      }

      return data
    } catch (error) {
      let status: number | null = null
      let responseBody: unknown = null
      let message = 'Request failed'

      if (error instanceof FetchError) {
        status = error.response?.status ?? error.statusCode ?? null
        responseBody = error.data ?? error.response?._data ?? null
        message = typeof error.data === 'string'
          ? error.data
          : (error.data as { detail?: string, title?: string })?.detail
            ?? (error.data as { title?: string })?.title
            ?? error.message
        if (status === 401 && useAuth) {
          // Access token may be expired; leave it for the panel to refresh.
        }
      } else if (error instanceof Error) {
        message = error.message
      }

      if (!options.silent) {
        pushLog({
          method,
          url,
          status,
          ok: false,
          requestBody: options.body,
          responseBody,
          error: message
        })
      }

      throw error
    }
  }

  const clearCsrf = () => {
    csrfCache.value = {}
  }

  const logoutLocal = () => {
    setAccessToken(null)
    clearCsrf()
  }

  return {
    baseURL,
    api,
    fetchCsrf,
    ensureCsrf,
    clearCsrf,
    logoutLocal
  }
}
