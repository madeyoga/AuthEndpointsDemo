import StepUpModal from '~/components/StepUpModal.vue'
import type { StepUpContext } from '~/types/auth'

/** In-memory only — never persist the ReAuth token or pending actions. */
let lastReauthToken: string | undefined

export function useStepUp() {
  const overlay = useOverlay()

  async function prompt(): Promise<string | undefined> {
    const modal = overlay.create(StepUpModal, {
      destroyOnClose: true
    })
    const instance = modal.open()
    const result = await instance.result
    if (!result || typeof result !== 'object' || !('reauthToken' in result)) {
      return undefined
    }
    lastReauthToken = result.reauthToken || undefined
    return lastReauthToken ?? ''
  }

  async function invoke<T>(action: (ctx: StepUpContext) => Promise<T>): Promise<T> {
    const ctx: StepUpContext = {
      reauthToken: lastReauthToken ?? ''
    }
    return await action(ctx)
  }

  async function run<T>(action: (ctx: StepUpContext) => Promise<T>): Promise<T | undefined> {
    // Try first so a still-valid HttpOnly ReAuth cookie can succeed without a prompt.
    return await tryThenStepUp(
      () => invoke(action),
      async () => {
        lastReauthToken = undefined
        const token = await prompt()
        return token !== undefined
      },
      isReauthChallenge
    )
  }

  return {
    run
  }
}
