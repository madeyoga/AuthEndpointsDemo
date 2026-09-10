<script setup lang="ts">
definePageMeta({
  layout: 'playground'
})

const { api, baseURL } = useApi()
const { mode } = useAuthState()
const toast = useToast()

const logins = ref<unknown>(null)
const busy = ref(false)

const providers = [
  { label: 'GitHub', path: '/auth/external/login/github', icon: 'i-simple-icons-github' },
  { label: 'Google', path: '/auth/external/login/google', icon: 'i-simple-icons-google' }
]

function startLogin(path: string) {
  const returnUrl = window.location.origin + '/external'
  window.location.href = `${baseURL.value}${path}?returnUrl=${encodeURIComponent(returnUrl)}`
}

function startLink(scheme: string) {
  const returnUrl = window.location.origin + '/external'
  window.location.href = `${baseURL.value}/auth/external/link/${scheme}?returnUrl=${encodeURIComponent(returnUrl)}`
}

async function listLogins() {
  busy.value = true
  try {
    logins.value = await api('/auth/external/logins', {
      auth: mode.value === 'jwt'
    })
  } catch {
    toast.add({
      title: 'List logins failed',
      description: 'Providers must be configured and you must be signed in.',
      color: 'error'
    })
  } finally {
    busy.value = false
  }
}

async function unlink(loginProvider: string, providerKey: string) {
  busy.value = true
  try {
    await api(`/auth/external/logins/${encodeURIComponent(loginProvider)}/${encodeURIComponent(providerKey)}`, {
      method: 'DELETE',
      auth: mode.value === 'jwt'
    })
    toast.add({ title: 'Unlinked', color: 'success' })
    await listLogins()
  } catch {
    toast.add({ title: 'Unlink failed', color: 'error' })
  } finally {
    busy.value = false
  }
}

onMounted(() => {
  // Best-effort load if already signed in and providers exist.
  listLogins().catch(() => {})
})
</script>

<template>
  <PanelPage
    title="External OAuth"
    description="GitHub / Google login and account linking. Requires client IDs in Demo/.env."
  >
    <UAlert
      class="mb-4"
      color="warning"
      variant="subtle"
      title="Optional providers"
      description="If GITHUB_* / GOOGLE_* env vars are missing, these routes are not mapped on the API."
    />

    <div class="grid gap-4 lg:grid-cols-2">
      <ActionPanel
        title="Sign in"
        description="Browser redirect to /auth/external/login/{provider}"
      >
        <div class="flex flex-wrap gap-2">
          <UButton
            v-for="provider in providers"
            :key="provider.path"
            :icon="provider.icon"
            color="neutral"
            variant="outline"
            @click="startLogin(provider.path)"
          >
            Continue with {{ provider.label }}
          </UButton>
        </div>
      </ActionPanel>

      <ActionPanel
        title="Link / unlink"
        description="Requires an authenticated session"
      >
        <div class="mb-3 flex flex-wrap gap-2">
          <UButton
            size="sm"
            :loading="busy"
            @click="listLogins"
          >
            List linked logins
          </UButton>
          <UButton
            size="sm"
            color="neutral"
            variant="outline"
            @click="startLink('GitHub')"
          >
            Link GitHub
          </UButton>
          <UButton
            size="sm"
            color="neutral"
            variant="outline"
            @click="startLink('Google')"
          >
            Link Google
          </UButton>
        </div>
        <pre class="overflow-auto rounded-md bg-muted/50 p-3 text-xs">{{ logins ? JSON.stringify(logins, null, 2) : '—' }}</pre>
        <div
          v-if="Array.isArray(logins)"
          class="mt-3 space-y-2"
        >
          <div
            v-for="(item, index) in logins as { loginProvider?: string, providerKey?: string, LoginProvider?: string, ProviderKey?: string }[]"
            :key="index"
            class="flex items-center justify-between gap-2 rounded-md border border-default px-3 py-2 text-sm"
          >
            <span>{{ item.loginProvider || item.LoginProvider }} · {{ item.providerKey || item.ProviderKey }}</span>
            <UButton
              size="xs"
              color="error"
              variant="ghost"
              @click="unlink(String(item.loginProvider || item.LoginProvider), String(item.providerKey || item.ProviderKey))"
            >
              Unlink
            </UButton>
          </div>
        </div>
      </ActionPanel>
    </div>
  </PanelPage>
</template>
