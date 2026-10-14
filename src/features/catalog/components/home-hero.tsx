import { Link } from '@tanstack/react-router'
import heroShape from '@/assets/decorations/mobile-hero-shape.svg'
import { Icon } from '@/components/icon'
import { Button } from '@/components/ui/button'
import { useMediaQuery } from '@/hooks/use-media-query'

const HERO_IMAGE = { small: '/images/nfts/monkey-varsity-480.webp', large: '/images/nfts/monkey-varsity-960.webp' }
const HERO_THUMB = '/images/nfts/gorilla-bucket-hat-480.webp'
const HERO_ALT = 'Emerald Ape #042, macaco de óculos redondos e jaqueta college verde'

/** Indicador do carrossel do Figma: decorativo, o banner tem um único slide. */
function Dots({ className }: { className?: string }) {
  return (
    <span aria-hidden className={className}>
      <span className="size-2 rounded-full bg-brand" />
      <span className="size-2 rounded-full bg-brand/40" />
      <span className="size-2 rounded-full bg-brand/40" />
    </span>
  )
}

function DesktopHero() {
  return (
    <section aria-labelledby="hero-title" className="flex items-center justify-between gap-8 lg:pl-10">
      <div className="flex max-w-[600px] flex-1 flex-col items-end gap-11">
        <div className="flex w-full flex-col items-start gap-8">
          <div className="flex flex-col gap-1">
            <div className="flex flex-col gap-2 text-cream">
              <p className="text-sm leading-4 font-medium tracking-[1.4px]">Bem-vindo à Kurio</p>
              <h1 id="hero-title" className="text-display-sm leading-[1.4] font-bold lg:text-display lg:leading-[70px]">
                SEJA DONO DO FUTURO
                <br />
                DA ARTE DIGITAL
              </h1>
            </div>
            <p className="max-w-[557px] text-sm leading-6 text-subtle-text">
              Descubra NFTs selecionados de criadores emergentes e consagrados. Colecione arte digital rara, apoie artistas
              e tenha uma parte da cultura da internet.
            </p>
          </div>
          <Button asChild className="h-10 w-[140px] rounded-lg text-base leading-5 font-bold">
            <Link to="/" hash="mercado">
              EXPLORAR
            </Link>
          </Button>
        </div>
        <Dots className="flex gap-2" />
      </div>
      <img
        src={HERO_IMAGE.large}
        srcSet={`${HERO_IMAGE.small} 480w, ${HERO_IMAGE.large} 960w`}
        sizes="(min-width: 1280px) 450px, 340px"
        alt={HERO_ALT}
        width={450}
        height={450}
        fetchPriority="high"
        className="aspect-square w-[300px] shrink-0 rounded-3xl object-cover lg:w-[380px] xl:w-[450px]"
      />
    </section>
  )
}

function MobileHero() {
  return (
    <section
      aria-labelledby="hero-title"
      className="relative flex min-h-[190px] flex-col items-center justify-center gap-4 overflow-hidden rounded-xl p-4"
    >
      <img src={heroShape} alt="" className="absolute inset-0 size-full object-cover" />
      <div className="relative flex w-full items-center gap-2">
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex flex-col gap-1.5">
            <p className="text-xs leading-4 font-medium text-cream">Bem-vindo à Kurio</p>
            <h1 id="hero-title" className="w-[190px] max-w-full text-lg leading-[29px] font-bold text-cream">
              SEJA DONO DA
              <br />
              CULTURA DIGITAL
            </h1>
            <p className="text-xs leading-[18px] text-subtle-text">Descubra NFTs selecionados de criadores do mundo todo.</p>
          </div>
          <Link
            to="/"
            hash="mercado"
            className="mt-1 flex w-fit items-center gap-2 rounded-sm text-xs leading-[14px] font-bold text-accent-text"
          >
            EXPLORAR
            <Icon name="arrow-right" className="size-4" />
          </Link>
        </div>
        <div className="relative size-[138px] shrink-0">
          <img
            src={HERO_IMAGE.small}
            alt={HERO_ALT}
            width={138}
            height={138}
            fetchPriority="high"
            className="size-full rounded-2xl object-cover"
          />
          <img
            src={HERO_THUMB}
            alt=""
            width={58}
            height={58}
            className="absolute top-[88px] left-[14px] size-[58px] rounded-2xl object-cover"
          />
        </div>
      </div>
      <Dots className="relative flex gap-1.5 [&>span]:size-[7px]" />
    </section>
  )
}

export function HomeHero() {
  const isDesktop = useMediaQuery('(min-width: 768px)')
  return isDesktop ? <DesktopHero /> : <MobileHero />
}
