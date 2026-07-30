<script setup lang="ts">
const { api } = useApi()
const { mode, setReauthToken, reauthToken } = useAuthState()
const toast = useToast()

const confirmForm = reactive({
  password: '',
  twoFactorCode: '',
  twoFactorRecoveryCode: ''
})

const twoFactorForm = reactive({
  enable: true,
  resetSharedKey: false,
  resetRecoveryCodes: false,
  twoFactorCode: ''
})

const authMethods = ref<unknown>(null)
const twoFactorStatus = ref<unknown>(null)
const busy = ref(false)

async function loadAuthMethods() {
  busy.value = true
  try {
    authMethods.value = await api('/auth/cookie/manage/authMethods', {
      auth: mode.value === 'jwt'
    })
  } catch {
    toast.add({ title: 'Failed to load auth methods', color: 'error' })
  } finally {
    busy.value = false
  }
}

async function confirmIdentity() {
  busy.value = true
  try {
    const response = await api<{ reauthToken?: string, ReauthToken?: string }>('/auth/cookie/confirmIdentity', {
      method: 'POST',
      body: {
        password: confirmForm.password || null,
        twoFactorCode: confirmForm.twoFactorCode || null,
        twoFactorRecoveryCode: confirmForm.twoFactorRecoveryCode || null
      },
      auth: mode.value === 'jwt'
    })
    setReauthToken(response.reauthToken ?? response.ReauthToken ?? null)
    toast.add({ title: 'Identity confirmed', description: 'ReAuth token stored for sensitive calls.', color: 'success' })
  } catch {
    toast.add({ title: 'Confirm identity failed', color: 'error' })
  } finally {
    busy.value = false
  }
}

async function loadTwoFactor() {
  busy.value = true
  try {
    twoFactorStatus.value = await api('/auth/cookie/manage/2fa', {
      auth: mode.value === 'jwt'
    })
  } catch {
    toast.add({ title: 'Failed to load 2FA status', color: 'error' })
  } finally {
    busy.value = false
  }
}

async function manageTwoFactor() {
  busy.value = true
  try {
    twoFactorStatus.value = await api('/auth/cookie/manage/2fa', {
      method: 'POST',
      body: {
        enable: twoFactorForm.enable,
        resetSharedKey: twoFactorForm.resetSharedKey,
        resetRecoveryCodes: twoFactorForm.resetRecoveryCodes,
        twoFactorCode: twoFactorForm.twoFactorCode || null
      },
      auth: mode.value === 'jwt',
      reauth: true
    })
    toast.add({ title: '2FA updated', color: 'success' })
  } catch {
    toast.add({ title: '2FA update failed (ReAuth may be required)', color: 'error' })
  } finally {
    busy.value = false
  }
}

async function testReauth() {
  busy.value = true
  try {
    await api('/test/reauth', {
      auth: mode.value === 'jwt',
      reauth: true
    })
    toast.add({ title: '/test/reauth OK', color: 'success' })
  } catch {
    toast.add({ title: '/test/reauth failed', color: 'error' })
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <PanelPage
    title="Security"
    description="ReAuth step-up, 2FA management, and the Demo /test/reauth endpoint."
  >
    <div class="mb-4">
      <UBadge
        :color="reauthToken ? 'success' : 'neutral'"
        variant="subtle"
      >
        {{ reauthToken ? 'ReAuth token present' : 'No ReAuth token' }}
      </UBadge>
    </div>

    <div class="grid gap-4 lg:grid-cols-2">
      <ActionPanel
        title="Auth methods"
        description="GET /auth/cookie/manage/authMethods"
      >
        <UButton
          size="sm"
          class="mb-3"
          :loading="busy"
          @click="loadAuthMethods"
        >
          Load
        </UButton>
        <pre class="overflow-auto rounded-md bg-muted/50 p-3 text-xs">{{ authMethods ? JSON.stringify(authMethods, null, 2) : '—' }}</pre>
      </ActionPanel>

      <ActionPanel
        title="Confirm identity"
        description="POST /auth/cookie/confirmIdentity"
      >
        <form
          class="space-y-3"
          @submit.prevent="confirmIdentity"
        >
          <UFormField label="Password">
            <UInput
              v-model="confirmForm.password"
              type="password"
              class="w-full"
            />
          </UFormField>
          <UFormField label="2FA code">
            <UInput
              v-model="confirmForm.twoFactorCode"
              class="w-full"
            />
          </UFormField>
          <UFormField label="Recovery code">
            <UInput
              v-model="confirmForm.twoFactorRecoveryCode"
              class="w-full"
            />
          </UFormField>
          <UButton
            type="submit"
            :loading="busy"
          >
            Confirm
          </UButton>
        </form>
      </ActionPanel>

      <ActionPanel
        title="Two-factor"
        description="GET/POST /auth/cookie/manage/2fa"
      >
        <div class="mb-3 flex flex-wrap gap-2">
          <UButton
            size="sm"
            color="neutral"
            variant="outline"
            :loading="busy"
            @click="loadTwoFactor"
          >
            Status
          </UButton>
          <UButton
            size="sm"
            color="neutral"
            variant="outline"
            :loading="busy"
            @click="testReauth"
          >
            Test /test/reauth
          </UButton>
        </div>
        <form
          class="space-y-3"
          @submit.prevent="manageTwoFactor"
        >
          <UCheckbox
            v-model="twoFactorForm.enable"
            label="Enable 2FA"
          />
          <UCheckbox
            v-model="twoFactorForm.resetSharedKey"
            label="Reset shared key"
          />
          <UCheckbox
            v-model="twoFactorForm.resetRecoveryCodes"
            label="Reset recovery codes"
          />
          <UFormField label="2FA code (to enable)">
            <UInput
              v-model="twoFactorForm.twoFactorCode"
              class="w-full"
            />
          </UFormField>
          <UButton
            type="submit"
            :loading="busy"
          >
            Update 2FA
          </UButton>
        </form>
        <pre class="mt-3 overflow-auto rounded-md bg-muted/50 p-3 text-xs">{{ twoFactorStatus ? JSON.stringify(twoFactorStatus, null, 2) : '—' }}</pre>
      </ActionPanel>
    </div>
  </PanelPage>
</template>
