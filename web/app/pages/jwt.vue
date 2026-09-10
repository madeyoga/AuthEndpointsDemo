<script setup lang="ts">
import type { JwtTokenResponse } from '~/types/auth'

definePageMeta({
  layout: 'playground'
})

const { api, fetchCsrf } = useApi()
const { accessToken, setMode, setAccessToken } = useAuthState()
const { refreshSession, signOut } = useAuthSession()
const toast = useToast()

const form = reactive({
  email: 'admin@authendpoints.id',
  password: 'T3$ttest',
  twoFactorCode: '',
  twoFactorRecoveryCode: ''
})
const busy = ref(false)

function normalizeToken(response: JwtTokenResponse & { AccessToken?: string }) {
  return response.accessToken ?? response.AccessToken ?? null
}

async function create() {
  busy.value = true
  setMode('jwt')
  try {
    const response = await api<JwtTokenResponse & { AccessToken?: string }>('/auth/jwt/create', {
      method: 'POST',
      body: {
        email: form.email,
        password: form.password,
        twoFactorCode: form.twoFactorCode || null,
        twoFactorRecoveryCode: form.twoFactorRecoveryCode || null
      },
      skipCsrf: true,
      auth: false
    })
    const token = normalizeToken(response)
    setAccessToken(token)
    toast.add({ title: 'JWT created', color: 'success' })
    await refreshSession()
  } catch {
    toast.add({ title: 'JWT create failed', color: 'error' })
  } finally {
    busy.value = false
  }
}

async function refresh() {
  busy.value = true
  setMode('jwt')
  try {
    const response = await api<JwtTokenResponse & { AccessToken?: string }>('/auth/jwt/refresh', {
      method: 'POST',
      auth: false,
      csrfPath: '/auth/jwt/csrfToken'
    })
    setAccessToken(normalizeToken(response))
    toast.add({ title: 'JWT refreshed', color: 'success' })
    await refreshSession()
  } catch {
    toast.add({ title: 'JWT refresh failed', color: 'error' })
  } finally {
    busy.value = false
  }
}

async function verify() {
  busy.value = true
  setMode('jwt')
  try {
    await api('/auth/jwt/verify', { auth: true })
    toast.add({ title: 'Token valid', color: 'success' })
  } catch {
    toast.add({ title: 'Verify failed', color: 'error' })
  } finally {
    busy.value = false
  }
}

async function loadCsrf() {
  busy.value = true
  try {
    await fetchCsrf('/auth/jwt/csrfToken')
    toast.add({ title: 'JWT CSRF loaded', color: 'success' })
  } catch {
    toast.add({ title: 'CSRF fetch failed', color: 'error' })
  } finally {
    busy.value = false
  }
}

async function logout() {
  busy.value = true
  setMode('jwt')
  try {
    await signOut()
    toast.add({ title: 'JWT logged out', color: 'success' })
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <PanelPage
    title="JWT Auth"
    description="Simple JWT create / refresh / verify / logout. Refresh uses an HttpOnly cookie + CSRF."
  >
    <ActionPanel
      title="Create / refresh"
      description="POST /auth/jwt/create · /refresh · /verify · /logout"
    >
      <form
        class="grid gap-3 md:grid-cols-2"
        @submit.prevent="create"
      >
        <UFormField label="Email">
          <UInput
            v-model="form.email"
            type="email"
            class="w-full"
            required
          />
        </UFormField>
        <UFormField label="Password">
          <UInput
            v-model="form.password"
            type="password"
            class="w-full"
            required
          />
        </UFormField>
        <UFormField label="2FA code">
          <UInput
            v-model="form.twoFactorCode"
            class="w-full"
          />
        </UFormField>
        <UFormField label="Recovery code">
          <UInput
            v-model="form.twoFactorRecoveryCode"
            class="w-full"
          />
        </UFormField>
        <div class="flex flex-wrap gap-2 md:col-span-2">
          <UButton
            type="submit"
            :loading="busy"
          >
            Create
          </UButton>
          <UButton
            color="neutral"
            variant="outline"
            :loading="busy"
            @click="refresh"
          >
            Refresh
          </UButton>
          <UButton
            color="neutral"
            variant="outline"
            :loading="busy"
            @click="verify"
          >
            Verify
          </UButton>
          <UButton
            color="neutral"
            variant="outline"
            :loading="busy"
            @click="loadCsrf"
          >
            Load CSRF
          </UButton>
          <UButton
            color="neutral"
            variant="outline"
            :loading="busy"
            @click="logout"
          >
            Logout
          </UButton>
        </div>
      </form>

      <div class="mt-4 space-y-1">
        <p class="text-xs font-medium text-muted">
          Access token
        </p>
        <pre class="overflow-auto rounded-md bg-muted/50 p-3 text-xs break-all whitespace-pre-wrap">{{ accessToken || '—' }}</pre>
      </div>
    </ActionPanel>
  </PanelPage>
</template>
