import { createFileRoute } from '@tanstack/react-router'
import { AuthScreen } from '@/features/auth/components/auth-screen'
import { validateAuthSearch } from '@/features/auth/redirect'

export const Route = createFileRoute('/entrar')({
  validateSearch: validateAuthSearch,
  component: LoginRoute,
})

function LoginRoute() {
  return <AuthScreen mode="login" search={Route.useSearch()} />
}
