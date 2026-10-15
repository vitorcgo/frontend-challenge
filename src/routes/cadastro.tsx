import { createFileRoute } from '@tanstack/react-router'
import { AuthScreen } from '@/features/auth/components/auth-screen'
import { validateAuthSearch } from '@/features/auth/redirect'

export const Route = createFileRoute('/cadastro')({
  validateSearch: validateAuthSearch,
  component: RegisterRoute,
})

function RegisterRoute() {
  return <AuthScreen mode="register" search={Route.useSearch()} />
}
