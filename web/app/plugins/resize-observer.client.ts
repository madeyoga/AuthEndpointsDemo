export default defineNuxtPlugin(() => {
  if (!import.meta.client) {
    return
  }

  const isResizeObserverNoise = (message: string) => {
    return message.includes('ResizeObserver')
  }

  window.addEventListener('error', (event) => {
    if (isResizeObserverNoise(event.message)) {
      event.preventDefault()
    }
  })
})
