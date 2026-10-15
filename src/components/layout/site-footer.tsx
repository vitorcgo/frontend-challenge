import { Link } from '@tanstack/react-router'
import { useId, useState, type FormEvent } from 'react'
import type { NftCategory } from '@/api/contracts'
import socialFacebook from '@/assets/brands/social-facebook.svg'
import socialInstagram from '@/assets/brands/social-instagram.svg'
import socialLinkedin from '@/assets/brands/social-linkedin.svg'
import socialTwitter from '@/assets/brands/social-twitter.svg'
import socialYoutube from '@/assets/brands/social-youtube.svg'
import { Button } from '@/components/ui/button'
import { CATEGORY_LABELS } from '@/features/catalog/labels'
import { EXACT_LOCATION } from '@/lib/link-options'

const FEATURES = [
  { mark: 'W', title: 'Segurança da carteira', text: 'Proteja sua carteira e colecione arte digital verificada com confiança.' },
  { mark: 'C', title: 'Criadores em destaque', text: 'Conheça artistas, estúdios e comunidades que moldam a cultura digital na rede.' },
  { mark: 'D', title: 'Alertas de lançamentos', text: 'Receba calendários de cunhagem, novidades de listas de acesso e análises do mercado.' },
]

const TEXT_COLUMNS = [
  { title: 'Meu perfil', items: ['Meu perfil', 'Minha coleção', 'Atividade', 'Estúdio do criador', 'Lista de interesse'] },
  {
    title: 'Central de ajuda',
    items: ['Central de ajuda', 'Como comprar NFTs', 'Carteira e segurança', 'Política do mercado', 'Denunciar item'],
  },
]

const FOOTER_CATEGORIES: NftCategory[] = ['arte-digital', 'fotografia', 'musica', 'arte-3d', 'utilidade']

const SOCIALS = [
  { name: 'Facebook', src: socialFacebook },
  { name: 'Instagram', src: socialInstagram },
  { name: 'Twitter', src: socialTwitter },
  { name: 'LinkedIn', src: socialLinkedin },
  { name: 'YouTube', src: socialYoutube },
]

function NewsletterForm() {
  const inputId = useId()
  const statusId = useId()
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    setSubmitted(true)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <label htmlFor={inputId} className="text-lg leading-4 font-bold text-cream">
        Antecipe-se ao próximo lançamento
      </label>
      <div className="flex h-10 items-center justify-between rounded-lg bg-surface-dark pl-3 shadow-soft">
        <input
          id={inputId}
          type="email"
          placeholder="digite seu e-mail..."
          aria-describedby={statusId}
          className="min-w-0 flex-1 bg-transparent text-sm leading-4 text-cream outline-none placeholder:text-muted-text"
        />
        <Button type="submit" className="h-10 w-[85px] rounded-l-none rounded-r-lg pr-1 pl-4 text-lg leading-4 font-bold">
          Enviar
        </Button>
      </div>
      <p id={statusId} role="status" className="text-caption text-subtle-text">
        {submitted
          ? 'A inscrição na newsletter ainda não está disponível nesta versão.'
          : 'Receba lançamentos selecionados, histórias de criadores e novidades do mercado.'}
      </p>
    </form>
  )
}

export function SiteFooter() {
  return (
    <footer className="mx-auto mt-24 hidden w-full max-w-[1200px] px-6 md:block xl:px-0">
      <section aria-label="Destaques da Kurio" className="bg-surface-card p-8">
        <div className="grid gap-8 md:grid-cols-3 lg:grid-cols-[1fr_auto_1fr_auto_1fr_auto_357px] lg:items-stretch lg:gap-0">
          {FEATURES.map((feature) => (
            <div key={feature.mark} className="contents">
              <div className="flex flex-col gap-3 px-4">
                <span
                  aria-hidden
                  className="grid size-[74px] place-items-center rounded-full bg-brand text-2xl font-bold text-ink"
                >
                  {feature.mark}
                </span>
                <h2 className="text-md font-bold text-cream">{feature.title}</h2>
                <p className="max-w-[204px] text-sm leading-[22px] text-subtle-text">{feature.text}</p>
              </div>
              <span aria-hidden className="hidden w-px bg-brand lg:block" />
            </div>
          ))}
          <div className="px-4 md:col-span-full lg:col-span-1">
            <NewsletterForm />
          </div>
        </div>
      </section>

      <div className="grid gap-4 bg-surface-dark px-8 py-6 text-sm leading-[22px] text-cream md:grid-cols-2 lg:flex lg:h-[88px] lg:items-center lg:gap-[92px] lg:py-0">
        <span className="flex-1 py-2 font-bold tracking-logo">KURIO</span>
        <p className="flex-1 whitespace-nowrap">
          Feito para colecionadores,
          <br />
          criadores e cultura
        </p>
        <a href="mailto:contato@email.com" className="flex-1 rounded-sm hover:text-accent-text">
          contato@email.com
        </a>
        <a href="tel:+551140028922" className="rounded-sm hover:text-accent-text lg:w-[228px]">
          +55 11 4002 8922
        </a>
      </div>

      <div className="bg-surface-card p-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_228px] lg:gap-10 xl:gap-[124px]">
          {TEXT_COLUMNS.map((column) => (
            <div key={column.title} className="flex flex-col gap-2 text-cream">
              <h2 className="text-lg leading-4 font-bold">{column.title}</h2>
              <ul className="text-sm leading-[30px]">
                {column.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
          <div className="flex flex-col gap-2 text-cream">
            <h2 className="text-lg leading-4 font-bold">Coleções</h2>
            <ul className="text-sm leading-[30px]">
              {FOOTER_CATEGORIES.map((category) => (
                <li key={category}>
                  <Link
                    to="/"
                    search={{ category: [category] }}
                    hash="mercado"
                    activeOptions={EXACT_LOCATION}
                    className="rounded-sm hover:text-accent-text"
                  >
                    {CATEGORY_LABELS[category]}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-5">
              <h2 className="text-lg leading-4 font-bold text-cream">Redes sociais</h2>
              <ul className="flex gap-2.5">
                {SOCIALS.map((social) => (
                  <li key={social.name}>
                    <img src={social.src} alt={social.name} width={32} height={32} className="-m-px" />
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex flex-col gap-3">
              <h2 className="text-lg leading-4 font-bold text-cream">Carteiras compatíveis</h2>
              <p className="flex h-[26px] items-center justify-center rounded-lg border border-line-soft bg-surface-dark pl-2 text-2xs font-bold tracking-[0.1px] whitespace-pre text-accent-text">
                {'METAMASK  •  WALLETCONNECT  •  COINBASE'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <p className="text-center text-sm leading-[30px] text-cream">© 2026 Kurio. Propriedade digital para todos.</p>
    </footer>
  )
}
