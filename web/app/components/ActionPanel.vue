<script setup lang="ts">
defineProps<{
  title: string
  description?: string
}>()
</script>

<template>
  <div class="rounded-lg border border-default bg-default/40 p-4 space-y-4">
    <div class="space-y-1">
      <h2 class="text-sm font-semibold">
        {{ title }}
      </h2>
      <p
        v-if="description"
        class="text-xs text-muted"
      >
        {{ description }}
      </p>
    </div>
    <slot />
  </div>
</template>
