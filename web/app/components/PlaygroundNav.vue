<script setup lang="ts">
const links = [
  { label: 'Overview', to: '/', icon: 'i-lucide-layout-dashboard' },
  { label: 'Register / Confirm', to: '/account', icon: 'i-lucide-user-plus' },
  { label: 'Cookie Auth', to: '/cookie', icon: 'i-lucide-cookie' },
  { label: 'JWT Auth', to: '/jwt', icon: 'i-lucide-key-round' },
  { label: 'Password', to: '/password', icon: 'i-lucide-lock-keyhole' },
  { label: 'Account Info', to: '/manage', icon: 'i-lucide-id-card' },
  { label: 'Security', to: '/security', icon: 'i-lucide-shield' },
  { label: 'Passkeys', to: '/passkeys', icon: 'i-lucide-fingerprint' },
  { label: 'External', to: '/external', icon: 'i-lucide-log-in' },
  { label: 'Diagnostics', to: '/diagnostics', icon: 'i-lucide-stethoscope' }
]
</script>

<template>
  <nav class="flex flex-col gap-1 p-3">
    <UButton
      v-for="link in links"
      :key="link.to"
      :to="link.to"
      :icon="link.icon"
      color="neutral"
      variant="ghost"
      class="justify-start"
      active-color="primary"
      active-variant="soft"
    >
      {{ link.label }}
    </UButton>
  </nav>
</template>
