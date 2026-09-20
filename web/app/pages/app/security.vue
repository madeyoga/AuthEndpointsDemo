<script setup lang="ts">
import type { TwoFactorStatus } from '~/types/auth'

definePageMeta({
  layout: 'app',
  middleware: 'auth'
})

useSeoMeta({
  title: 'Security'
})

const toast = useToast()
const { api, info, refreshCookieSession, problemMessage } = useAppAuth()
const stepUp = useStepUp()

const twoFactor = ref<TwoFactorStatus | null>(null)
const loadingTwoFactor = ref(true)
const confirmRegenerateOpen = ref(false)
const recoveryCodesOpen = ref(false)
const pendingRecoveryCodes = ref<string[]>([])

const displayedEmail = computed(() => info.value?.email || '')
const emailConfirmed = computed(() => info.value?.isEmailConfirmed ?? false)

async function refreshTwoFactor() {
  loadingTwoFactor.value = true
  try {
    twoFactor.value = normalizeTwoFactorResponse(await api('/auth/cookie/manage/2fa', {
      auth: false
    }))
  } catch {
    twoFactor.value = null
  } finally {
    loadingTwoFactor.value = false
  }
}

function showRecoveryCodes(codes: string[]) {
  pendingRecoveryCodes.value = codes
  recoveryCodesOpen.value = true
}

function onRecoveryCodesClosed() {
  pendingRecoveryCodes.value = []
  recoveryCodesOpen.value = false
}

async function onSuccessEnable() {
  await refreshTwoFactor()
}

function onEnablePendingCodes(codes: string[]) {
  if (codes.length) {
    showRecoveryCodes(codes)
  }
}

async function disableTwoFactor() {
  try {
    const done = await stepUp.run(async ({ reauthToken }) => {
      await api('/auth/cookie/manage/2fa', {
        method: 'POST',
        body: { enable: false },
        ...reauthRequest(reauthToken)
      })
      return true
    })

    if (!done) {
      return
    }

    await refreshTwoFactor()
    toast.add({
      title: 'Two-factor authentication disabled',
      color: 'success'
    })
  } catch (error) {
    toast.add({
      title: 'Unable to disable two-factor',
      description: problemMessage(error, 'An error occurred while processing your request.'),
      color: 'error'
    })
  }
}

function openRegenerateConfirm() {
  confirmRegenerateOpen.value = true
}

function closeRegenerateConfirm() {
  confirmRegenerateOpen.value = false
}

async function confirmRegenerateRecoveryCodes() {
  closeRegenerateConfirm()

  try {
    const result = await stepUp.run(async ({ reauthToken }) => {
      return await api<TwoFactorStatus>('/auth/cookie/manage/2fa', {
        method: 'POST',
        body: { resetRecoveryCodes: true },
        ...reauthRequest(reauthToken)
      })
    })

    if (!result) {
      return
    }

    const codes = normalizeTwoFactorResponse(result).recoveryCodes
    if (!codes?.length) {
      toast.add({
        title: 'Recovery codes were not returned',
        description: 'Two-factor is still enabled, but no new codes were included in the response.',
        color: 'error'
      })
      await refreshTwoFactor()
      return
    }

    showRecoveryCodes(codes)
    await refreshTwoFactor()
  } catch (error) {
    toast.add({
      title: 'Unable to regenerate recovery codes',
      description: problemMessage(error, 'An error occurred while processing your request.'),
      color: 'error'
    })
  }
}

async function resendEmailConfirmation() {
  try {
    await api('/auth/cookie/resendConfirmationEmail', {
      method: 'POST',
      body: displayedEmail.value ? { email: displayedEmail.value } : {},
      auth: false,
      csrfPath: '/auth/cookie/csrfToken'
    })
    toast.add({
      title: 'Confirmation email sent',
      description: 'In this local Demo, the link is written to the API console.',
      color: 'success'
    })
  } catch (error) {
    toast.add({
      title: 'Unable to resend confirmation',
      description: problemMessage(error, 'An error occurred while processing your request.'),
      color: 'error'
    })
  }
}

onMounted(async () => {
  await refreshCookieSession()
  await refreshTwoFactor()
})
</script>

<template>
  <section class="space-y-4">
    <div class="space-y-1">
      <h1 class="text-2xl font-semibold tracking-tight">
        Security
      </h1>
      <p class="text-sm text-muted">
        Email, password, and two-factor settings. Sensitive changes ask you to confirm your identity first.
      </p>
    </div>

    <UCard
      :class="emailConfirmed ? 'bg-gradient-to-tl from-primary/10 from-5% to-default' : 'bg-gradient-to-tl from-error/10 from-5% to-default'"
    >
      <template #header>
        <div>
          <p class="font-semibold">
            Email
          </p>
          <p class="text-sm text-muted">
            Your sign-in email and confirmation status.
          </p>
        </div>
      </template>
      <div class="flex justify-between gap-3 py-3">
        <div class="flex min-w-0 gap-3">
          <div class="bg-elevated flex size-10 shrink-0 items-center justify-center rounded-full">
            <UIcon
              name="i-lucide-mail"
              class="size-5"
            />
          </div>
          <div class="min-w-0">
            <p class="text-highlighted font-medium">
              {{ displayedEmail || '—' }}
              <UBadge
                v-if="emailConfirmed"
                size="md"
                color="primary"
                variant="subtle"
              >
                Confirmed
              </UBadge>
              <UBadge
                v-else
                size="md"
                color="error"
                variant="subtle"
              >
                Confirmation needed
              </UBadge>
            </p>
            <p class="mt-1 block pr-0 text-xs text-muted sm:pr-4">
              Check your inbox and click the confirmation link to complete verification. In this Demo, that link is written to the API console.
            </p>
          </div>
        </div>
        <div class="flex items-center gap-3">
          <UButton
            v-if="!emailConfirmed"
            color="success"
            variant="subtle"
            label="Resend"
            @click="resendEmailConfirmation"
          />
        </div>
      </div>

      <USeparator />

      <div class="pt-4">
        <p class="text-highlighted mb-1 font-medium">
          Change email
        </p>
        <p class="mb-4 text-xs text-muted">
          We will send a confirmation link to the new address. This email stays the same until you click it.
        </p>
        <SettingsChangeEmailForm
          :current-email="displayedEmail"
          @success="refreshCookieSession"
        />
      </div>
    </UCard>

    <UCard>
      <template #header>
        <div>
          <p class="font-semibold">
            Password
          </p>
          <p class="text-sm text-muted">
            Change your account password. You will confirm your identity before the change is saved.
          </p>
        </div>
      </template>
      <SettingsChangePasswordForm @success="refreshCookieSession" />
    </UCard>

    <UCard
      v-if="twoFactor || loadingTwoFactor"
      :class="twoFactor?.isTwoFactorEnabled ? 'bg-gradient-to-tl from-primary/10 from-5% to-default' : 'bg-gradient-to-tl from-error/10 from-5% to-default'"
    >
      <template #header>
        <div>
          <p class="font-semibold">
            Two-factor authentication
          </p>
          <p class="text-sm text-muted">
            Two-factor authentication adds an additional layer of security to your account by requiring more than just a password to sign in.
          </p>
        </div>
      </template>
      <div class="flex justify-between gap-3 py-3">
        <div class="flex min-w-0 gap-3">
          <div class="bg-elevated flex size-10 shrink-0 items-center justify-center rounded-full">
            <UIcon
              name="i-lucide-smartphone"
              class="size-5"
            />
          </div>
          <div class="min-w-0">
            <p class="text-highlighted truncate font-medium">
              Authenticator app
              <UBadge
                v-if="twoFactor?.isTwoFactorEnabled"
                size="md"
                color="primary"
                variant="subtle"
              >
                Configured
              </UBadge>
              <UBadge
                v-else
                size="md"
                color="error"
                variant="subtle"
              >
                Not configured
              </UBadge>
            </p>
            <p class="mt-1 block pr-0 text-xs text-muted sm:pr-4">
              Use an authentication app or browser extension to get two-factor authentication codes when prompted.
            </p>
          </div>
        </div>
        <div class="flex items-center gap-3">
          <UButton
            v-if="twoFactor?.isTwoFactorEnabled"
            color="error"
            variant="subtle"
            label="Disable"
            @click="disableTwoFactor"
          />
          <SettingsEnableTwoFactorModal
            :show-trigger="!twoFactor?.isTwoFactorEnabled"
            :email="displayedEmail"
            @success="onSuccessEnable"
            @pending-codes="onEnablePendingCodes"
          />
        </div>
      </div>
    </UCard>

    <UCard v-if="twoFactor">
      <template #header>
        <div>
          <p class="font-semibold">
            Recovery options
          </p>
        </div>
      </template>
      <div class="flex justify-between gap-3 py-3">
        <div class="flex min-w-0 gap-3">
          <div class="bg-elevated flex size-10 shrink-0 items-center justify-center rounded-full">
            <UIcon
              name="i-lucide-key-round"
              class="size-5"
            />
          </div>
          <div class="min-w-0">
            <p class="text-highlighted truncate font-medium">
              Recovery codes
              <UBadge
                v-if="twoFactor.isTwoFactorEnabled"
                size="md"
                color="primary"
                variant="subtle"
              >
                {{ typeof twoFactor.recoveryCodesLeft === 'number' ? `${twoFactor.recoveryCodesLeft} left` : 'Configured' }}
              </UBadge>
            </p>
            <p class="mt-1 block pr-0 text-xs text-muted sm:pr-4">
              Recovery codes can be used to access your account if you lose your authenticator device.
            </p>
          </div>
        </div>
        <div class="flex items-center gap-3">
          <UButton
            v-if="twoFactor.isTwoFactorEnabled"
            color="error"
            variant="subtle"
            label="Regenerate"
            @click="openRegenerateConfirm"
          />
        </div>
      </div>
    </UCard>

    <UModal
      v-model:open="confirmRegenerateOpen"
      title="Regenerate recovery codes?"
      description="This replaces your current recovery codes. Old codes stop working immediately."
    >
      <template #body>
        <p class="text-sm text-muted">
          Store the new codes in a safe place. They will only be shown once.
        </p>
      </template>
      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton
            label="Cancel"
            color="neutral"
            variant="subtle"
            @click="closeRegenerateConfirm"
          />
          <UButton
            label="Regenerate"
            color="error"
            @click="confirmRegenerateRecoveryCodes"
          />
        </div>
      </template>
    </UModal>

    <SettingsRecoveryCodesModal
      v-model:open="recoveryCodesOpen"
      :codes="pendingRecoveryCodes"
      @close="onRecoveryCodesClosed"
    />
  </section>
</template>
