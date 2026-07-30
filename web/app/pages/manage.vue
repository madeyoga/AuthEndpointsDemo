<script setup lang="ts">
import type { ManageInfo } from '~/types/auth'

const { api } = useApi()
const { mode } = useAuthState()
const { info, refreshSession } = useAuthSession()
const toast = useToast()

const form = reactive({
  newEmail: '',
  newPassword: '',
  oldPassword: ''
})
const busy = ref(false)

onMounted(() => refreshSession())

async function loadInfo() {
  busy.value = true
  try {
    await refreshSession()
    toast.add({ title: 'Info loaded', color: 'success' })
  } catch {
    toast.add({ title: 'Load failed', color: 'error' })
  } finally {
    busy.value = false
  }
}

async function updateInfo() {
  busy.value = true
  try {
    const body: Record<string, string> = {}
    if (form.newEmail) {
      body.newEmail = form.newEmail
    }
    if (form.newPassword) {
      body.newPassword = form.newPassword
      body.oldPassword = form.oldPassword
    }
    await api<ManageInfo>('/auth/cookie/manage/info', {
      method: 'POST',
      body,
      auth: mode.value === 'jwt',
      reauth: true
    })
    toast.add({ title: 'Info updated', color: 'success' })
    await refreshSession()
  } catch {
    toast.add({ title: 'Update failed (ReAuth may be required)', color: 'error' })
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <PanelPage
    title="Account Info"
    description="GET/POST /auth/cookie/manage/info. Updates require ReAuth (see Security panel)."
  >
    <div class="grid gap-4 lg:grid-cols-2">
      <ActionPanel title="Current info">
        <UButton
          size="sm"
          color="neutral"
          variant="outline"
          :loading="busy"
          class="mb-3"
          @click="loadInfo"
        >
          Refresh
        </UButton>
        <pre class="overflow-auto rounded-md bg-muted/50 p-3 text-xs">{{ info ? JSON.stringify(info, null, 2) : 'Not signed in' }}</pre>
      </ActionPanel>

      <ActionPanel
        title="Update info"
        description="POST /auth/cookie/manage/info"
      >
        <form
          class="space-y-3"
          @submit.prevent="updateInfo"
        >
          <UFormField label="New email">
            <UInput
              v-model="form.newEmail"
              type="email"
              class="w-full"
            />
          </UFormField>
          <UFormField label="Old password (for password change)">
            <UInput
              v-model="form.oldPassword"
              type="password"
              class="w-full"
            />
          </UFormField>
          <UFormField label="New password">
            <UInput
              v-model="form.newPassword"
              type="password"
              class="w-full"
            />
          </UFormField>
          <UButton
            type="submit"
            :loading="busy"
          >
            Update
          </UButton>
        </form>
      </ActionPanel>
    </div>
  </PanelPage>
</template>
