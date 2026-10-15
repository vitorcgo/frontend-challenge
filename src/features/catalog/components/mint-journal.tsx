interface Article {
  date: string
  readingTime: string
  title: string
  summary: string
  image: string
}

const ARTICLES: Article[] = [
  {
    date: '12 de setembro',
    readingTime: 'Leitura de 6 min',
    title: 'Como funciona a propriedade de NFTs',
    summary: 'Aprenda a colecionar, negociar e verificar ativos digitais.',
    image: '/images/nfts/gorilla-turtleneck-480.webp',
  },
  {
    date: '13 de setembro',
    readingTime: 'Leitura de 2 min',
    title: '10 artistas digitais para acompanhar',
    summary: 'Conheça criadores que moldam a cultura digital.',
    image: '/images/nfts/monkey-varsity-480.webp',
  },
  {
    date: '15 de setembro',
    readingTime: 'Leitura de 3 min',
    title: 'Raridade, atributos e procedência',
    summary: 'Entenda raridade, procedência, direitos autorais e utilidade.',
    image: '/images/nfts/gorilla-bucket-hat-480.webp',
  },
  {
    date: '15 de setembro',
    readingTime: 'Leitura de 2 min',
    title: 'Como proteger sua carteira',
    summary: 'Proteja sua carteira, seus ativos e sua identidade.',
    image: '/images/nfts/orangutan-headphones-480.webp',
  },
]

export function MintJournal() {
  return (
    <section aria-labelledby="mint-journal-title" className="flex flex-col items-center gap-10">
      <header className="flex flex-col gap-3 text-center">
        <h2 id="mint-journal-title" className="text-[28px] leading-normal font-bold text-cream-strong">
          Diário da Cunhagem
        </h2>
        <p className="text-sm text-subtle-text">
          Histórias, guias e insights para colecionadores sobre o universo da propriedade digital.
        </p>
      </header>
      <ul className="grid w-full gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {ARTICLES.map((article) => (
          <li key={article.title}>
            <article className="flex h-full flex-col overflow-hidden rounded-lg bg-surface-card">
              <img
                src={article.image}
                alt=""
                width={268}
                height={195}
                loading="lazy"
                decoding="async"
                className="h-[195px] w-full object-cover"
              />
              <div className="flex flex-1 flex-col gap-2 px-4 pt-3 pb-4">
                <p className="text-xs leading-4 font-medium whitespace-pre-wrap text-subtle-text">
                  {article.date}
                  {'  |  '}
                  {article.readingTime}
                </p>
                <h3 className="text-base font-bold text-cream-strong">{article.title}</h3>
                <p className="text-xs leading-4 font-medium text-subtle-text">{article.summary}</p>
                <span
                  role="link"
                  aria-disabled="true"
                  title="Disponível em breve"
                  className="mt-auto flex gap-1 text-xs text-accent-text"
                >
                  <span className="leading-[14px] font-bold">Ler mais</span>
                  <span aria-hidden>→</span>
                  <span className="sr-only"> (disponível em breve)</span>
                </span>
              </div>
            </article>
          </li>
        ))}
      </ul>
    </section>
  )
}
