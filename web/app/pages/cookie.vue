<script setup lang="ts">
const { api, fetchCsrf } = useApi()
const { setMode } = useAuthState()
const { refreshSession, signOut } = useAuthSession()
const toast = useToast()

const form = reactive({
  email: 'admin@authendpoints.id',
  password: 'T3$ttest',
  twoFactorCode: '',
  twoFactorRecoveryCode: '',
  persistent: true
})
const busy = ref(false)

async function login() {
  busy.value = true
  setMode('cookie')
  try {
    await api('/auth/cookie/login', {
      method: 'POST',
      query: form.persistent ? { useSessionCookies: false } : { useSessionCookies: true },
      body: {
        email: form.email,
        password: form.password,
        twoFactorCode: form.twoFactorCode || null,
        twoFactorRecoveryCode: form.twoFactorRecoveryCode || null
      },
      skipCsrf: true,
      auth: false
    })
    toast.add({ title: 'Cookie login succeeded', color: 'success' })
    await refreshSession()
  } catch {
    toast.add({ title: 'Cookie login failed', color: 'error' })
  } finally {
    busy.value = false
  }
}

async function loadCsrf() {
  busy.value = true
  try {
    await fetchCsrf('/auth/cookie/csrfToken')
    toast.add({ title: 'CSRF token loaded', color: 'success' })
  } catch {
    toast.add({ title: 'CSRF fetch failed', color: 'error' })
  } finally {
    busy.value = false
  }
}

async function logout() {
  busy.value = true
  setMode('cookie')
  try {
    await signOut()
    toast.add({ title: 'Logged out', color: 'success' })
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <PanelPage
    title="Cookie Auth"
    description="Identity application cookie via /auth/cookie/login and CSRF-protected logout."
  >
    <ActionPanel
      title="Login"
      description="POST /auth/cookie/login"
    >
      <form
        class="grid gap-3 md:grid-cols-2"
        @submit.prevent="login"
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
        <div class="md:col-span-2">
          <UCheckbox
            v-model="form.persistent"
            label="Persistent cookie (useSessionCookies=false)"
          />
        </div>
        <div class="flex flex-wrap gap-2 md:col-span-2">
          <UButton
            type="submit"
            :loading="busy"
          >
            Login
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
    </ActionPanel>
  </PanelPage>
</template>
