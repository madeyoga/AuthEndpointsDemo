export default defineNuxtPlugin(async () => {
  const { hydrate } = useAuthState()
  const { refreshSession } = useAuthSession()

  hydrate()
  await refreshSession()
})
