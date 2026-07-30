<script setup lang="ts">
const { api } = useApi()
const { refreshSession } = useAuthSession()
const toast = useToast()

const registerForm = reactive({
  email: '',
  password: ''
})

const confirmForm = reactive({
  userId: '',
  code: '',
  changedEmail: ''
})

const busy = ref(false)

async function register() {
  busy.value = true
  try {
    await api('/auth/cookie/register', {
      method: 'POST',
      body: {
        email: registerForm.email,
        password: registerForm.password
      },
      skipCsrf: true
    })
    toast.add({ title: 'Registered', description: 'Check the API console for the confirmation link.', color: 'success' })
  } catch {
    toast.add({ title: 'Register failed', color: 'error' })
  } finally {
    busy.value = false
  }
}

async function confirmEmail() {
  busy.value = true
  try {
    await api('/auth/cookie/confirmEmail', {
      query: {
        userId: confirmForm.userId,
        code: confirmForm.code,
        changedEmail: confirmForm.changedEmail || undefined
      },
      skipCsrf: true
    })
    toast.add({ title: 'Email confirmed', color: 'success' })
    await refreshSession()
  } catch {
    toast.add({ title: 'Confirm failed', color: 'error' })
  } finally {
    busy.value = false
  }
}

function parseConfirmLink() {
  const raw = window.prompt('Paste the full confirmation URL from the API console')
  if (!raw) {
    return
  }
  try {
    const url = new URL(raw)
    confirmForm.userId = url.searchParams.get('userId') ?? ''
    confirmForm.code = url.searchParams.get('code') ?? ''
    confirmForm.changedEmail = url.searchParams.get('changedEmail') ?? ''
    toast.add({ title: 'Parsed confirmation link', color: 'success' })
  } catch {
    toast.add({ title: 'Invalid URL', color: 'error' })
  }
}

async function resendConfirmation() {
  busy.value = true
  try {
    await api('/auth/cookie/resendConfirmationEmail', {
      method: 'POST',
      body: {}
    })
    toast.add({ title: 'Resend requested', description: 'Check the API console.', color: 'success' })
  } catch {
    toast.add({ title: 'Resend failed', color: 'error' })
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <PanelPage
    title="Register / Confirm"
    description="Account creation and email confirmation. Confirmation links are logged by ConsoleEmailSender."
  >
    <div class="grid gap-4 lg:grid-cols-2">
      <ActionPanel
        title="Register"
        description="POST /auth/cookie/register"
      >
        <form
          class="space-y-3"
          @submit.prevent="register"
        >
          <UFormField label="Email">
            <UInput
              v-model="registerForm.email"
              type="email"
              class="w-full"
              required
            />
          </UFormField>
          <UFormField label="Password">
            <UInput
              v-model="registerForm.password"
              type="password"
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
        title="Confirm email"
        description="GET /auth/cookie/confirmEmail"
      >
        <div class="mb-3">
          <UButton
            size="sm"
            color="neutral"
            variant="outline"
            icon="i-lucide-clipboard-paste"
            @click="parseConfirmLink"
          >
            Paste link
          </UButton>
        </div>
        <form
          class="space-y-3"
          @submit.prevent="confirmEmail"
        >
          <UFormField label="userId">
            <UInput
              v-model="confirmForm.userId"
              class="w-full"
              required
            />
          </UFormField>
          <UFormField label="code">
            <UInput
              v-model="confirmForm.code"
              class="w-full"
              required
            />
          </UFormField>
          <UFormField label="changedEmail (optional)">
            <UInput
              v-model="confirmForm.changedEmail"
              class="w-full"
            />
          </UFormField>
          <div class="flex flex-wrap gap-2">
            <UButton
              type="submit"
              :loading="busy"
            >
              Confirm
            </UButton>
            <UButton
              color="neutral"
              variant="outline"
              :loading="busy"
              @click="resendConfirmation"
            >
              Resend (signed-in)
            </UButton>
          </div>
        </form>
      </ActionPanel>
    </div>
  </PanelPage>
</template>
