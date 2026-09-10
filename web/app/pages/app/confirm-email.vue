<script setup lang="ts">
definePageMeta({
  layout: 'auth'
})

useSeoMeta({
  title: 'Email confirmation'
})

const route = useRoute()

const status = computed(() => {
  const value = route.query.status
  return typeof value === 'string' ? value : ''
})

const flow = computed(() => {
  const value = route.query.flow
  return typeof value === 'string' ? value : ''
})

const isConfirmed = computed(() => status.value === 'confirmed')
const isFailed = computed(() => status.value === 'failed')
const isChangeEmail = computed(() => flow.value === 'change-email')

const title = computed(() => {
  if (isConfirmed.value) {
    return isChangeEmail.value ? 'Email updated' : 'Email confirmed'
  }
  if (isFailed.value) {
    return isChangeEmail.value ? 'Email change failed' : 'Confirmation failed'
  }
  return 'Email confirmation'
})

const description = computed(() => {
  if (isConfirmed.value) {
    return isChangeEmail.value
      ? 'Your email address was updated. Sign in with the new address.'
      : 'Your email is confirmed. Sign in to continue.'
  }
  if (isFailed.value) {
    return 'This confirmation link is invalid or expired. Register again or try signing in if you already confirmed.'
  }
  return 'Open this page from the confirmation redirect, or sign in if you already confirmed your email.'
})
</script>

<template>
  <div class="space-y-4">
    <UAlert
      :color="isConfirmed ? 'success' : isFailed ? 'error' : 'neutral'"
      variant="subtle"
      :title="title"
      :description="description"
      :icon="isConfirmed ? 'i-lucide-circle-check' : isFailed ? 'i-lucide-circle-alert' : 'i-lucide-mail'"
    />

    <div class="flex flex-col gap-2">
      <UButton
        v-if="isConfirmed || (!isConfirmed && !isFailed)"
        to="/app/login"
        block
      >
        Sign in
      </UButton>
      <template v-if="isFailed">
        <UButton
          to="/app/register"
          block
        >
          Register
        </UButton>
        <UButton
          to="/app/login"
          color="neutral"
          variant="outline"
          block
        >
          Sign in
        </UButton>
      </template>
    </div>
  </div>
</template>
