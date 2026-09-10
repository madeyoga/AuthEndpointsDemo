<script setup lang="ts">
import type { TabsItem } from '@nuxt/ui'
import { getPasskeyCredential } from '~/utils/webauthn'

definePageMeta({
  layout: 'auth',
  middleware: 'guest'
})

useSeoMeta({
  title: 'Sign in'
})

const route = useRoute()
const { api, ensureCookieMode, loginWithPassword, loginFailureMessage, isPasskeyCancel, safeAppRedirect } = useAppAuth()
const { pending, clear } = usePendingRegistration()
const toast = useToast()

const tabs: TabsItem[] = [
  { label: 'Password', icon: 'i-lucide-lock', slot: 'password', value: 'password' },
  { label: 'Passkey', icon: 'i-lucide-fingerprint', slot: 'passkey', value: 'passkey' }
]

const selectedTab = computed(() => route.query.method === 'passkey' ? 'passkey' : 'password')

const passwordForm = reactive({
  email: '',
  password: '',
  rememberMe: true
})
const passkeyUsername = ref('')
const busy = ref(false)
const errorMessage = ref('')

const queryEmail = computed(() => {
  const value = route.query.email
  return typeof value === 'string' ? value : ''
})

if (queryEmail.value) {
  passwordForm.email = queryEmail.value
  passkeyUsername.value = queryEmail.value
} else if (pending.value?.email) {
  passwordForm.email = pending.value.email
  passkeyUsername.value = pending.value.email
}

async function afterLogin() {
  clear()
  await navigateTo(safeAppRedirect(route.query.redirect))
}

async function loginPassword() {
  errorMessage.value = ''
  busy.value = true
  try {
    await loginWithPassword(passwordForm.email, passwordForm.password, passwordForm.rememberMe)
    await afterLogin()
  } catch (error) {
    errorMessage.value = loginFailureMessage(error)
  } finally {
    busy.value = false
  }
}

async function loginPasskey() {
  errorMessage.value = ''
  busy.value = true
  ensureCookieMode()
  try {
    const optionsJson = await api<string | object>('/auth/passkey/passkeys/requestOptions', {
      method: 'POST',
      query: passkeyUsername.value ? { username: passkeyUsername.value } : undefined,
      body: {},
      csrfPath: '/auth/cookie/csrfToken',
      auth: false
    })
    const credentialJson = await getPasskeyCredential(optionsJson)
    await api('/auth/passkey/passkeys/login', {
      method: 'POST',
      query: { useCookies: true },
      body: { credentialJson },
      csrfPath: '/auth/cookie/csrfToken',
      auth: false
    })
    await afterLogin()
  } catch (error) {
    if (isPasskeyCancel(error)) {
      toast.add({
        title: 'Passkey cancelled',
        color: 'neutral'
      })
      return
    }
    errorMessage.value = loginFailureMessage(error)
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <div class="space-y-4">
    <div class="space-y-1">
      <h1 class="text-xl font-semibold tracking-tight">
        Sign in
      </h1>
      <p class="text-sm text-muted">
        Use your password or a passkey. Accounts must be confirmed first.
      </p>
    </div>

    <UAlert
      v-if="errorMessage"
      color="error"
      variant="subtle"
      :description="errorMessage"
    />

    <UTabs
      :items="tabs"
      :default-value="selectedTab"
      class="w-full"
    >
      <template #password>
        <form
          class="mt-4 space-y-3"
          @submit.prevent="loginPassword"
        >
          <UFormField
            label="Email"
            required
          >
            <UInput
              v-model="passwordForm.email"
              type="email"
              autocomplete="username"
              class="w-full"
              required
            />
          </UFormField>
          <UFormField
            label="Password"
            required
          >
            <UInput
              v-model="passwordForm.password"
              type="password"
              autocomplete="current-password"
              class="w-full"
              required
            />
          </UFormField>
          <UCheckbox
            v-model="passwordForm.rememberMe"
            label="Remember me"
          />
          <UButton
            type="submit"
            block
            :loading="busy"
          >
            Sign in
          </UButton>
        </form>
      </template>

      <template #passkey>
        <form
          class="mt-4 space-y-3"
          @submit.prevent="loginPasskey"
        >
          <UFormField
            label="Username"
            hint="Optional"
          >
            <UInput
              v-model="passkeyUsername"
              autocomplete="username"
              class="w-full"
            />
          </UFormField>
          <UButton
            type="submit"
            block
            :loading="busy"
          >
            Continue with passkey
          </UButton>
        </form>
      </template>
    </UTabs>

    <p class="text-center text-sm text-muted">
      Need an account?
      <NuxtLink
        to="/app/register"
        class="text-primary font-medium"
      >
        Register
      </NuxtLink>
    </p>
  </div>
</template>
