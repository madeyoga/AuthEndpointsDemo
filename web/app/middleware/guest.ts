export default defineNuxtRouteMiddleware(async () => {
  if (import.meta.server) {
    return
  }

  const { refreshCookieSession, info } = useAppAuth()
  await refreshCookieSession()

  if (info.value) {
    return navigateTo('/app')
  }
})
