import type { WalletInput, WalletSlot } from '@/api/contracts'

const DRAFT_KEY = 'kurio.checkout.draft'

export interface CheckoutDraft {
  userId: string
  slot: WalletSlot
  values: WalletInput
  note: string
}

export function readDraft(): CheckoutDraft | undefined {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY)
    return raw ? (JSON.parse(raw) as CheckoutDraft) : undefined
  } catch {
    return undefined
  }
}

export function saveDraft(draft: CheckoutDraft) {
  try {
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft))
  } catch {
    // Sem armazenamento, o rascunho vale só nesta tela.
  }
}

export function clearDraft() {
  try {
    sessionStorage.removeItem(DRAFT_KEY)
  } catch {
    // Nada salvo para apagar.
  }
}
