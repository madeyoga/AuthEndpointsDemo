<script setup lang="ts">
definePageMeta({
  layout: 'app',
  middleware: 'auth'
})

useSeoMeta({
  title: 'Home'
})

const { info, refreshCookieSession } = useAppAuth()

const claims = computed(() => (info.value?.claims ?? []).slice(0, 8))

onMounted(async () => {
  const session = await refreshCookieSession()
  if (!session) {
    await navigateTo({
      path: '/app/login',
      query: { redirect: '/app' }
    })
  }
})
</script>

<template>
  <section class="space-y-4">
    <div class="space-y-1">
      <h1 class="text-2xl font-semibold tracking-tight">
        Home
      </h1>
      <p class="text-sm text-muted">
        Signed in with a cookie session. This is a dummy home for the app flow.
      </p>
    </div>

    <UCard>
      <dl class="space-y-3 text-sm">
        <div class="flex items-center justify-between gap-3">
          <dt class="text-muted">
            Email
          </dt>
          <dd class="font-medium">
            {{ info?.email || '—' }}
          </dd>
        </div>
        <div class="flex items-center justify-between gap-3">
          <dt class="text-muted">
            Email confirmed
          </dt>
          <dd>
            <UBadge
              :color="info?.isEmailConfirmed ? 'success' : 'warning'"
              variant="subtle"
            >
              {{ info?.isEmailConfirmed ? 'Yes' : 'No' }}
            </UBadge>
          </dd>
        </div>
      </dl>
    </UCard>

    <UCard v-if="claims.length">
      <template #header>
        <p class="text-sm font-semibold">
          Claims
        </p>
      </template>
      <ul class="space-y-2 font-mono text-xs">
        <li
          v-for="claim in claims"
          :key="`${claim.type}:${claim.value}`"
          class="flex justify-between gap-3"
        >
          <span class="truncate text-muted">{{ claim.type }}</span>
          <span class="truncate">{{ claim.value }}</span>
        </li>
      </ul>
    </UCard>
  </section>
</template>
