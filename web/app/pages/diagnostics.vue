<script setup lang="ts">
definePageMeta({
  layout: 'playground'
})

const { api } = useApi()
const toast = useToast()
const busy = ref(false)

async function createDefaultUser() {
  busy.value = true
  try {
    await api('/createDefaultUser', { skipCsrf: true })
    toast.add({
      title: 'Default user created',
      description: 'admin@authendpoints.id / T3$ttest (confirm email if required)',
      color: 'success'
    })
  } catch {
    toast.add({ title: 'createDefaultUser failed', color: 'error' })
  } finally {
    busy.value = false
  }
}

async function testCsrf() {
  busy.value = true
  try {
    await api('/test/csrf', {
      method: 'POST',
      body: {},
      csrfPath: '/auth/cookie/csrfToken',
      auth: false
    })
    toast.add({ title: '/test/csrf OK', color: 'success' })
  } catch {
    toast.add({ title: '/test/csrf failed', color: 'error' })
  } finally {
    busy.value = false
  }
}

async function openScalar() {
  const config = useRuntimeConfig()
  window.open(`${String(config.public.apiBase).replace(/\/$/, '')}/scalar`, '_blank')
}
</script>

<template>
  <PanelPage
    title="Diagnostics"
    description="Demo helper endpoints and API explorers."
  >
    <ActionPanel title="Helpers">
      <div class="flex flex-wrap gap-2">
        <UButton
          :loading="busy"
          icon="i-lucide-user"
          @click="createDefaultUser"
        >
          Create default user
        </UButton>
        <UButton
          color="neutral"
          variant="outline"
          :loading="busy"
          icon="i-lucide-shield-check"
          @click="testCsrf"
        >
          POST /test/csrf
        </UButton>
        <UButton
          color="neutral"
          variant="outline"
          icon="i-lucide-book-open"
          @click="openScalar"
        >
          Open Scalar
        </UButton>
      </div>
    </ActionPanel>
  </PanelPage>
</template>
