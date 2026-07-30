<script setup lang="ts">
const { logs, clearLogs } = useAuthState()

const latest = computed(() => logs.value[0] ?? null)

const pretty = (value: unknown) => {
  if (value === undefined || value === null || value === '') {
    return '—'
  }
  if (typeof value === 'string') {
    try {
      return JSON.stringify(JSON.parse(value), null, 2)
    } catch {
      return value
    }
  }
  return JSON.stringify(value, null, 2)
}
</script>

<template>
  <div class="flex h-full min-h-0 flex-col border-t border-default bg-elevated/40 lg:border-t-0 lg:border-l">
    <div class="flex items-center justify-between gap-2 border-b border-default px-4 py-3">
      <div>
        <p class="text-sm font-semibold">
          Response inspector
        </p>
        <p class="text-xs text-muted">
          Last {{ logs.length }} API calls
        </p>
      </div>
      <UButton
        size="xs"
        color="neutral"
        variant="ghost"
        icon="i-lucide-trash-2"
        @click="clearLogs"
      >
        Clear
      </UButton>
    </div>

    <div
      v-if="!latest"
      class="flex flex-1 items-center justify-center p-6 text-sm text-muted"
    >
      Call an endpoint to see the response here.
    </div>

    <div
      v-else
      class="flex min-h-0 flex-1 flex-col gap-3 overflow-auto p-4"
    >
      <div class="flex flex-wrap items-center gap-2">
        <UBadge
          :color="latest.ok ? 'success' : 'error'"
          variant="subtle"
        >
          {{ latest.status ?? 'ERR' }}
        </UBadge>
        <UBadge
          color="neutral"
          variant="subtle"
        >
          {{ latest.method }}
        </UBadge>
        <span class="truncate text-xs text-muted">{{ latest.at }}</span>
      </div>

      <p class="break-all font-mono text-xs">
        {{ latest.url }}
      </p>

      <p
        v-if="latest.error"
        class="text-sm text-error"
      >
        {{ latest.error }}
      </p>

      <div>
        <p class="mb-1 text-xs font-medium text-muted">
          Request
        </p>
        <pre class="overflow-auto rounded-md bg-default p-3 text-xs">{{ pretty(latest.requestBody) }}</pre>
      </div>

      <div>
        <p class="mb-1 text-xs font-medium text-muted">
          Response
        </p>
        <pre class="overflow-auto rounded-md bg-default p-3 text-xs">{{ pretty(latest.responseBody) }}</pre>
      </div>

      <div v-if="logs.length > 1">
        <p class="mb-2 text-xs font-medium text-muted">
          History
        </p>
        <ul class="space-y-1">
          <li
            v-for="entry in logs.slice(1, 8)"
            :key="entry.id"
            class="truncate font-mono text-xs text-muted"
          >
            <span :class="entry.ok ? 'text-success' : 'text-error'">{{ entry.status ?? 'ERR' }}</span>
            {{ entry.method }} {{ entry.url }}
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>
