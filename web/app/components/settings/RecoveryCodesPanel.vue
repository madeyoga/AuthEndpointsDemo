<script setup lang="ts">
const props = defineProps<{
  codes: string[]
}>()

const { copy, download } = useRecoveryCodes()
</script>

<template>
  <UPageCard
    title="Keep these codes in a safe place"
    description="Each code can be used once. They will not be shown again."
    variant="soft"
  >
    <ul class="space-y-1 font-mono text-sm">
      <li
        v-for="value in props.codes"
        :key="value"
      >
        {{ value }}
      </li>
    </ul>
    <template #footer>
      <div class="flex gap-2">
        <UButton
          label="Copy"
          @click="copy(props.codes)"
        />
        <UButton
          label="Download as txt"
          color="neutral"
          variant="outline"
          @click="download(props.codes)"
        />
      </div>
    </template>
  </UPageCard>
</template>
