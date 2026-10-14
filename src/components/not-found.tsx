import { Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'

/** Estado não desenhado no Figma: segue o padrão visual das telas (fundo escuro, título em creme, botão laranja). */
export function NotFound() {
  return (
    <section className="mx-auto flex max-w-[480px] flex-col items-center gap-6 px-6 py-24 text-center">
      <p className="text-display-sm font-bold tracking-logo text-brand">404</p>
      <h1 className="text-xl leading-6 font-bold text-cream">Página não encontrada</h1>
      <p className="text-sm leading-6 text-subtle-text">
        O endereço que você acessou não existe ou foi removido. Volte ao início para continuar explorando.
      </p>
      <Button asChild size="lg" className="rounded-sm font-bold">
        <Link to="/">Voltar ao início</Link>
      </Button>
    </section>
  )
}
