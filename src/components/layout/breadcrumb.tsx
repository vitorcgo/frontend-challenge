import { Link } from '@tanstack/react-router'
import { EXACT_LOCATION, EXACT_PATH } from '@/lib/link-options'

export function Breadcrumb({ current }: { current?: string }) {
  return (
    <nav aria-label="Trilha de navegação">
      <ol className="flex flex-wrap items-center gap-1 text-body leading-4 font-bold text-cream">
        <li>
          <Link to="/" activeOptions={EXACT_PATH} className="rounded-sm hover:text-accent-text">
            Início
          </Link>
        </li>
        <li aria-hidden>/</li>
        <li>
          <Link to="/" hash="mercado" activeOptions={EXACT_LOCATION} className="rounded-sm hover:text-accent-text">
            Mercado
          </Link>
        </li>
        {current && (
          <>
            <li aria-hidden>/</li>
            <li aria-current="page">{current}</li>
          </>
        )}
      </ol>
    </nav>
  )
}
