import { createFileRoute } from '@tanstack/react-router'
import { requireAuth } from '@/features/auth/require-auth'
import { OrderPage } from '@/features/checkout/components/order-page'

export const Route = createFileRoute('/pedido/$id')({
  beforeLoad: requireAuth,
  component: RouteComponent,
})

function RouteComponent() {
  const { id } = Route.useParams()
  return <OrderPage key={id} id={id} />
}
