import type { ManageInfo, TwoFactorStatus } from '~/types/auth'

export function normalizeInfoResponse(raw: unknown): ManageInfo {
  const value = (raw ?? {}) as Record<string, unknown>
  const claims = value.claims ?? value.Claims
  return {
    email: String(value.email ?? value.Email ?? ''),
    isEmailConfirmed: Boolean(value.isEmailConfirmed ?? value.IsEmailConfirmed),
    claims: Array.isArray(claims)
      ? claims.map((claim) => {
          const item = claim as Record<string, unknown>
          return {
            type: String(item.type ?? item.Type ?? ''),
            value: String(item.value ?? item.Value ?? '')
          }
        })
      : undefined
  }
}

export function normalizeTwoFactorResponse(raw: unknown): TwoFactorStatus {
  const value = (raw ?? {}) as Record<string, unknown>
  const codes = value.recoveryCodes ?? value.RecoveryCodes
  const left = value.recoveryCodesLeft ?? value.RecoveryCodesLeft

  return {
    sharedKey: String(value.sharedKey ?? value.SharedKey ?? ''),
    recoveryCodesLeft: typeof left === 'number' ? left : undefined,
    recoveryCodes: Array.isArray(codes) ? codes.map(String) : null,
    isTwoFactorEnabled: Boolean(value.isTwoFactorEnabled ?? value.IsTwoFactorEnabled),
    isMachineRemembered: Boolean(value.isMachineRemembered ?? value.IsMachineRemembered)
  }
}

export function totpUri(email: string, sharedKey: string) {
  const issuer = encodeURIComponent('AuthEndpoints Demo')
  const account = encodeURIComponent(email || 'account')
  return `otpauth://totp/${issuer}:${account}?secret=${encodeURIComponent(sharedKey)}&issuer=${issuer}&digits=6`
}
