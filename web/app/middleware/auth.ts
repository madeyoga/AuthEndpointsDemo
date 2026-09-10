export default defineNuxtRouteMiddleware(async (to) => {
  if (import.meta.server) {
    return
  }

  const { refreshCookieSession, info } = useAppAuth()
  await refreshCookieSession()

  if (!info.value) {
    return navigateTo({
      path: '/app/login',
      query: { redirect: to.fullPath }
    })
  }
})
