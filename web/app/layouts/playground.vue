<script setup lang="ts">
import type { AuthMode } from '~/types/auth'

const { mode, email, accessToken, setMode } = useAuthState()
const { baseURL } = useApi()
const { refreshSession, signOut, loading } = useAuthSession()

const modes: { label: string, value: AuthMode }[] = [
  { label: 'Cookie', value: 'cookie' },
  { label: 'JWT', value: 'jwt' }
]

async function onModeChange(value: AuthMode) {
  setMode(value)
  await refreshSession()
}
</script>

<template>
  <div class="flex min-h-screen flex-col bg-muted/30">
    <header class="sticky top-0 z-20 border-b border-default bg-default/90 backdrop-blur">
      <div class="mx-auto flex max-w-[1600px] items-center justify-between gap-4 px-4 py-3">
        <div class="min-w-0">
          <p class="truncate text-lg font-semibold tracking-tight">
            AuthEndpoints Demo
          </p>
          <p class="truncate font-mono text-xs text-muted">
            {{ baseURL }}
          </p>
        </div>

        <div class="flex flex-wrap items-center justify-end gap-2">
          <div class="flex gap-1">
            <UButton
              v-for="item in modes"
              :key="item.value"
              size="sm"
              :color="mode === item.value ? 'primary' : 'neutral'"
              :variant="mode === item.value ? 'solid' : 'outline'"
              @click="onModeChange(item.value)"
            >
              {{ item.label }}
            </UButton>
          </div>

          <UBadge
            v-if="email"
            color="success"
            variant="subtle"
          >
            {{ email }}
          </UBadge>
          <UBadge
            v-else
            color="neutral"
            variant="subtle"
          >
            Signed out
          </UBadge>

          <UBadge
            v-if="mode === 'jwt' && accessToken"
            color="info"
            variant="subtle"
          >
            Bearer set
          </UBadge>

          <UButton
            size="sm"
            color="neutral"
            variant="ghost"
            icon="i-lucide-refresh-cw"
            :loading="loading"
            @click="refreshSession()"
          />
          <UButton
            size="sm"
            color="neutral"
            variant="ghost"
            icon="i-lucide-log-out"
            @click="signOut()"
          />
          <UColorModeButton />
        </div>
      </div>
    </header>

    <div class="mx-auto grid w-full max-w-[1600px] flex-1 grid-cols-1 lg:grid-cols-[220px_minmax(0,1fr)_minmax(280px,360px)]">
      <aside class="border-b border-default lg:border-b-0 lg:border-r">
        <PlaygroundNav />
      </aside>

      <main class="min-w-0 p-4 md:p-6">
        <slot />
      </main>

      <aside class="min-h-[280px] lg:min-h-0">
        <ResponseInspector class="h-full min-h-[280px] lg:sticky lg:top-[57px] lg:h-[calc(100vh-57px)]" />
      </aside>
    </div>
  </div>
</template>
