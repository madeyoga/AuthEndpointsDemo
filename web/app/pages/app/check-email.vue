<script setup lang="ts">
definePageMeta({
  layout: 'auth'
})

useSeoMeta({
  title: 'Check your email'
})

const route = useRoute()
const { confirmEmail } = useAppAuth()
const toast = useToast()

const email = computed(() => {
  const value = route.query.email
  return typeof value === 'string' ? value : ''
})

const confirmForm = reactive({
  userId: '',
  code: '',
  changedEmail: ''
})
const pastedUrl = ref('')
const busy = ref(false)

function parseConfirmLink() {
  const raw = pastedUrl.value.trim() || window.prompt('Paste the full confirmation URL from the API console') || ''
  if (!raw) {
    return
  }

  try {
    const url = new URL(raw)
    confirmForm.userId = url.searchParams.get('userId') ?? ''
    confirmForm.code = url.searchParams.get('code') ?? ''
    confirmForm.changedEmail = url.searchParams.get('changedEmail') ?? ''
    pastedUrl.value = raw
    toast.add({ title: 'Parsed confirmation link', color: 'success' })
  } catch {
    toast.add({ title: 'Invalid URL', color: 'error' })
  }
}

async function submitConfirm() {
  if (!confirmForm.userId || !confirmForm.code) {
    parseConfirmLink()
    if (!confirmForm.userId || !confirmForm.code) {
      return
    }
  }

  busy.value = true
  try {
    const result = await confirmEmail({
      userId: confirmForm.userId,
      code: confirmForm.code,
      changedEmail: confirmForm.changedEmail || undefined
    })
    await navigateTo({
      path: '/app/confirm-email',
      query: {
        status: result.status,
        flow: result.flow
      }
    })
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <div class="space-y-4">
    <div class="space-y-1">
      <h1 class="text-xl font-semibold tracking-tight">
        Check your email
      </h1>
      <p class="text-sm text-muted">
        If an account can be created for
        <span class="font-medium">{{ email || 'that address' }}</span>,
        we sent a confirmation link. In this local Demo, the message is written to the API console.
      </p>
    </div>

    <div class="flex flex-col gap-2">
      <UButton
        to="/app/login"
        block
      >
        I’ve confirmed — sign in
      </UButton>
      <UButton
        to="/app/register"
        color="neutral"
        variant="outline"
        block
      >
        Use a different email
      </UButton>
    </div>

    <UCollapsible class="flex flex-col gap-2">
      <UButton
        label="Local dev: paste confirmation link"
        color="neutral"
        variant="subtle"
        trailing-icon="i-lucide-chevron-down"
        block
      />
      <template #content>
        <div class="space-y-3 pt-1">
          <p class="text-xs text-muted">
            Copy the confirmation URL from the Demo API console, then confirm here. The playground Register / Confirm panel can do the same.
          </p>
          <UFormField label="Confirmation URL">
            <UInput
              v-model="pastedUrl"
              class="w-full"
              placeholder="http://localhost:5041/auth/cookie/confirmEmail?..."
            />
          </UFormField>
          <div class="flex flex-wrap gap-2">
            <UButton
              size="sm"
              color="neutral"
              variant="outline"
              icon="i-lucide-clipboard-paste"
              @click="parseConfirmLink"
            >
              Parse link
            </UButton>
            <UButton
              size="sm"
              :loading="busy"
              :disabled="!confirmForm.userId || !confirmForm.code"
              @click="submitConfirm"
            >
              Confirm email
            </UButton>
          </div>
        </div>
      </template>
    </UCollapsible>
  </div>
</template>
