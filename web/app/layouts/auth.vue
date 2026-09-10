<template>
  <div class="flex min-h-screen flex-col bg-muted/30">
    <header class="border-b border-default bg-default/90 backdrop-blur">
      <div class="mx-auto flex max-w-lg items-center justify-between gap-3 px-4 py-3">
        <p class="text-sm font-semibold tracking-tight">
          AuthEndpoints Demo
        </p>
        <div class="flex items-center gap-2">
          <UButton
            to="/"
            size="xs"
            color="neutral"
            variant="ghost"
          >
            API playground
          </UButton>
          <UColorModeButton />
        </div>
      </div>
    </header>

    <main class="flex flex-1 items-start justify-center px-4 py-10">
      <UCard class="w-full max-w-md">
        <slot />
      </UCard>
    </main>
  </div>
</template>
