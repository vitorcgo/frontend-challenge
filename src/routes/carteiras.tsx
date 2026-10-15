import { createFileRoute } from '@tanstack/react-router'
import { AccountLayout } from '@/features/account/components/account-layout'
import { WalletsPage } from '@/features/account/components/wallets-page'
import { requireAuth } from '@/features/auth/require-auth'

export const Route = createFileRoute('/carteiras')({
  beforeLoad: requireAuth,
  component: () => (
    <AccountLayout>
      <WalletsPage />
    </AccountLayout>
  ),
})
