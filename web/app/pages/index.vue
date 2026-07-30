<script setup lang="ts">
useSeoMeta({
  title: 'AuthEndpoints Demo',
  description: 'Playground UI for AuthEndpoints cookie, JWT, passkeys, and external auth.'
})
</script>

<template>
  <PanelPage
    title="Overview"
    description="Exercise the Demo API auth surface from a real browser (cookies, CSRF, WebAuthn, OAuth)."
  >
    <div class="grid gap-4 md:grid-cols-2">
      <ActionPanel
        title="Configured routes"
        description="Prefixes match Demo/Program.cs (not library defaults)."
      >
        <ul class="space-y-2 font-mono text-sm">
          <li><span class="text-muted">Cookie + manage</span> /auth/cookie</li>
          <li><span class="text-muted">JWT</span> /auth/jwt</li>
          <li><span class="text-muted">Passkeys</span> /auth/passkey/passkeys</li>
          <li><span class="text-muted">External</span> /auth/external</li>
        </ul>
      </ActionPanel>

      <ActionPanel
        title="How to use"
        description="Emails are written to the API console."
      >
        <ol class="list-decimal space-y-2 pl-4 text-sm text-muted">
          <li>Start the Demo API on http://localhost:5041</li>
          <li>Register a user, then paste the confirmation link fields from the API console</li>
          <li>Toggle Cookie vs JWT in the header and try each panel</li>
          <li>Watch the response inspector for status and JSON</li>
        </ol>
      </ActionPanel>
    </div>

    <div class="mt-4 flex flex-wrap gap-2">
      <UButton
        to="/account"
        icon="i-lucide-user-plus"
      >
        Register
      </UButton>
      <UButton
        to="/cookie"
        color="neutral"
        variant="outline"
        icon="i-lucide-cookie"
      >
        Cookie login
      </UButton>
      <UButton
        to="/jwt"
        color="neutral"
        variant="outline"
        icon="i-lucide-key-round"
      >
        JWT login
      </UButton>
      <UButton
        to="/diagnostics"
        color="neutral"
        variant="outline"
        icon="i-lucide-stethoscope"
      >
        Diagnostics
      </UButton>
    </div>
  </PanelPage>
</template>
