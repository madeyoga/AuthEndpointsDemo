<script setup lang="ts">
import type { PasskeyCredential } from '~/types/auth'
import { createPasskeyCredential, getPasskeyCredential } from '~/utils/webauthn'

definePageMeta({
  layout: 'playground'
})

const { api } = useApi()
const { mode, setMode } = useAuthState()
const { refreshSession } = useAuthSession()
const toast = useToast()

const registerEmail = ref('')
const loginUsername = ref('')
const passkeys = ref<PasskeyCredential[]>([])
const busy = ref(false)

async function registerWithPasskey() {
  busy.value = true
  setMode('cookie')
  try {
    const optionsJson = await api<string | object>('/auth/passkey/passkeys/register/options', {
      method: 'POST',
      body: { email: registerEmail.value },
      csrfPath: '/auth/cookie/csrfToken',
      auth: false
    })
    const credentialJson = await createPasskeyCredential(optionsJson)
    await api('/auth/passkey/passkeys/register', {
      method: 'POST',
      query: { useCookies: true },
      body: {
        email: registerEmail.value,
        credentialJson
      },
      csrfPath: '/auth/cookie/csrfToken',
      auth: false
    })
    toast.add({ title: 'Passkey account registered', color: 'success' })
    await refreshSession()
  } catch {
    toast.add({ title: 'Passkey register failed', color: 'error' })
  } finally {
    busy.value = false
  }
}

async function loginWithPasskey() {
  busy.value = true
  setMode('cookie')
  try {
    const optionsJson = await api<string | object>('/auth/passkey/passkeys/requestOptions', {
      method: 'POST',
      query: loginUsername.value ? { username: loginUsername.value } : undefined,
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
    toast.add({ title: 'Passkey login succeeded', color: 'success' })
    await refreshSession()
  } catch {
    toast.add({ title: 'Passkey login failed', color: 'error' })
  } finally {
    busy.value = false
  }
}

async function listPasskeys() {
  busy.value = true
  try {
    const response = await api<{ passkeys?: PasskeyCredential[], Passkeys?: PasskeyCredential[] }>('/auth/passkey/passkeys/', {
      auth: mode.value === 'jwt'
    })
    passkeys.value = response.passkeys ?? response.Passkeys ?? []
  } catch {
    toast.add({ title: 'List passkeys failed', color: 'error' })
  } finally {
    busy.value = false
  }
}

async function addPasskey() {
  busy.value = true
  try {
    const optionsJson = await api<string | object>('/auth/passkey/passkeys/creationOptions', {
      method: 'POST',
      body: {},
      auth: mode.value === 'jwt',
      reauth: true,
      csrfPath: '/auth/cookie/csrfToken'
    })
    const credentialJson = await createPasskeyCredential(optionsJson)
    await api('/auth/passkey/passkeys/', {
      method: 'POST',
      body: { credentialJson },
      auth: mode.value === 'jwt',
      reauth: true,
      csrfPath: '/auth/cookie/csrfToken'
    })
    toast.add({ title: 'Passkey added', color: 'success' })
    await listPasskeys()
  } catch {
    toast.add({ title: 'Add passkey failed (ReAuth may be required)', color: 'error' })
  } finally {
    busy.value = false
  }
}

async function removePasskey(credentialId: string) {
  busy.value = true
  try {
    await api(`/auth/passkey/passkeys/${encodeURIComponent(credentialId)}`, {
      method: 'DELETE',
      auth: mode.value === 'jwt',
      reauth: true,
      csrfPath: '/auth/cookie/csrfToken'
    })
    toast.add({ title: 'Passkey removed', color: 'success' })
    await listPasskeys()
  } catch {
    toast.add({ title: 'Delete failed', color: 'error' })
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <PanelPage
    title="Passkeys"
    description="WebAuthn passwordless register/login and manage credentials under /auth/passkey/passkeys."
  >
    <UAlert
      class="mb-4"
      color="info"
      variant="subtle"
      title="Browser + localhost"
      description="Passkeys.ServerDomain is localhost. Use Chrome/Edge on https or http://localhost."
    />

    <div class="grid gap-4 lg:grid-cols-2">
      <ActionPanel
        title="Register with passkey"
        description="POST .../register/options then .../register"
      >
        <form
          class="space-y-3"
          @submit.prevent="registerWithPasskey"
        >
          <UFormField label="Email">
            <UInput
              v-model="registerEmail"
              type="email"
              class="w-full"
              required
            />
          </UFormField>
          <UButton
            type="submit"
            :loading="busy"
          >
            Register
          </UButton>
        </form>
      </ActionPanel>

      <ActionPanel
        title="Login with passkey"
        description="POST .../requestOptions then .../login"
      >
        <form
          class="space-y-3"
          @submit.prevent="loginWithPasskey"
        >
          <UFormField label="Username (optional)">
            <UInput
              v-model="loginUsername"
              class="w-full"
            />
          </UFormField>
          <UButton
            type="submit"
            :loading="busy"
          >
            Login
          </UButton>
        </form>
      </ActionPanel>

      <ActionPanel
        title="Manage passkeys"
        description="List / add / delete for the signed-in user (ReAuth for mutations)."
      >
        <div class="mb-3 flex flex-wrap gap-2">
          <UButton
            size="sm"
            :loading="busy"
            @click="listPasskeys"
          >
            List
          </UButton>
          <UButton
            size="sm"
            color="neutral"
            variant="outline"
            :loading="busy"
            @click="addPasskey"
          >
            Add passkey
          </UButton>
        </div>
        <ul
          v-if="passkeys.length"
          class="space-y-2"
        >
          <li
            v-for="item in passkeys"
            :key="item.credentialId"
            class="flex items-center justify-between gap-2 rounded-md border border-default px-3 py-2"
          >
            <div class="min-w-0">
              <p class="truncate text-sm font-medium">
                {{ item.displayName || 'Passkey' }}
              </p>
              <p class="truncate font-mono text-xs text-muted">
                {{ item.credentialId }}
              </p>
            </div>
            <UButton
              size="xs"
              color="error"
              variant="ghost"
              icon="i-lucide-trash-2"
              @click="removePasskey(item.credentialId)"
            />
          </li>
        </ul>
        <p
          v-else
          class="text-sm text-muted"
        >
          No passkeys loaded.
        </p>
      </ActionPanel>
    </div>
  </PanelPage>
</template>
