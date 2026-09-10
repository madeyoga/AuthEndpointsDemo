<script setup lang="ts">
import type { TabsItem } from '@nuxt/ui'
import { FetchError } from 'ofetch'
import { getPasskeyCredential } from '~/utils/webauthn'

definePageMeta({
  layout: 'auth',
  middleware: 'guest'
})

useSeoMeta({
  title: 'Sign in'
})

const route = useRoute()
const { api, ensureCookieMode, refreshCookieSession, isPasskeyCancel, problemMessage, safeAppRedirect } = useAppAuth()
const toast = useToast()

const tabs: TabsItem[] = [
  { label: 'Password', icon: 'i-lucide-lock', slot: 'password' },
  { label: 'Passkey', icon: 'i-lucide-fingerprint', slot: 'passkey' }
]

const passwordForm = reactive({
  email: '',
  password: '',
  rememberMe: true
})
const passkeyUsername = ref('')
const busy = ref(false)
const errorMessage = ref('')

async function afterLogin() {
  await refreshCookieSession()
  await navigateTo(safeAppRedirect(route.query.redirect))
}

async function loginPassword() {
  errorMessage.value = ''
  busy.value = true
  ensureCookieMode()
  try {
    await api('/auth/cookie/login', {
      method: 'POST',
      query: passwordForm.rememberMe ? { useSessionCookies: false } : { useSessionCookies: true },
      body: {
        email: passwordForm.email,
        password: passwordForm.password
      },
      skipCsrf: true,
      auth: false
    })
    await afterLogin()
  } catch (error) {
    if (error instanceof FetchError && error.statusCode === 401) {
      errorMessage.value = 'Invalid credentials.'
    } else {
      errorMessage.value = problemMessage(error, 'Invalid credentials.')
    }
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
    if (error instanceof FetchError && error.statusCode === 401) {
      errorMessage.value = 'Invalid credentials.'
    } else {
      errorMessage.value = problemMessage(error, 'Invalid credentials.')
    }
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
