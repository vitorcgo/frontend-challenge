import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: HomePage,
})

function HomePage() {
  return <h1 className="sr-only">Kurio, marketplace de NFTs</h1>
}
