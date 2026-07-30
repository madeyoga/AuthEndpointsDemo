<script setup lang="ts">
const { api } = useApi()
const toast = useToast()

const forgotEmail = ref('')
const resetForm = reactive({
  email: '',
  resetCode: '',
  newPassword: ''
})
const busy = ref(false)

async function forgotPassword() {
  busy.value = true
  try {
    await api('/auth/cookie/forgotPassword', {
      method: 'POST',
      body: { email: forgotEmail.value },
      skipCsrf: true
    })
    toast.add({ title: 'Reset email sent', description: 'Check the API console for the code.', color: 'success' })
  } catch {
    toast.add({ title: 'Forgot password failed', color: 'error' })
  } finally {
    busy.value = false
  }
}

async function resetPassword() {
  busy.value = true
  try {
    await api('/auth/cookie/resetPassword', {
      method: 'POST',
      body: {
        email: resetForm.email,
        resetCode: resetForm.resetCode,
        newPassword: resetForm.newPassword
      },
      skipCsrf: true
    })
    toast.add({ title: 'Password reset', color: 'success' })
  } catch {
    toast.add({ title: 'Reset failed', color: 'error' })
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <PanelPage
    title="Password"
    description="Forgot / reset password. Reset codes are printed by ConsoleEmailSender."
  >
    <div class="grid gap-4 lg:grid-cols-2">
      <ActionPanel
        title="Forgot password"
        description="POST /auth/cookie/forgotPassword"
      >
        <form
          class="space-y-3"
          @submit.prevent="forgotPassword"
        >
          <UFormField label="Email">
            <UInput
              v-model="forgotEmail"
              type="email"
              class="w-full"
              required
            />
          </UFormField>
          <UButton
            type="submit"
            :loading="busy"
          >
            Send reset code
          </UButton>
        </form>
      </ActionPanel>

      <ActionPanel
        title="Reset password"
        description="POST /auth/cookie/resetPassword"
      >
        <form
          class="space-y-3"
          @submit.prevent="resetPassword"
        >
          <UFormField label="Email">
            <UInput
              v-model="resetForm.email"
              type="email"
              class="w-full"
              required
            />
          </UFormField>
          <UFormField label="Reset code">
            <UInput
              v-model="resetForm.resetCode"
              class="w-full"
              required
            />
          </UFormField>
          <UFormField label="New password">
            <UInput
              v-model="resetForm.newPassword"
              type="password"
              class="w-full"
              required
            />
          </UFormField>
          <UButton
            type="submit"
            :loading="busy"
          >
            Reset password
          </UButton>
        </form>
      </ActionPanel>
    </div>
  </PanelPage>
</template>
