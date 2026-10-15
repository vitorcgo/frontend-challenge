import { Suspense, useRef, useState, type UIEvent } from 'react'
import type { NftImage } from '@/api/contracts'
import { Icon } from '@/components/icon'
import { lazyWithPreload } from '@/lib/lazy'
import { cn } from '@/lib/utils'

const ZoomDialog = lazyWithPreload(() => import('./zoom-dialog'))

interface GalleryProps {
  name: string
  images: NftImage[]
}

/** Desktop (Figma "Product Images"): miniaturas à esquerda, imagem grande e lupa para ampliar. */
export function DesktopGallery({ name, images }: GalleryProps) {
  const [index, setIndex] = useState(0)
  const [zoomOpen, setZoomOpen] = useState(false)
  const [zoomMounted, setZoomMounted] = useState(false)
  const zoomRef = useRef<HTMLButtonElement>(null)
  const current = images[index] ?? images[0]!

  return (
    <div className="flex gap-4 lg:gap-7">
      <ul aria-label="Imagens da obra" className="flex w-[72px] shrink-0 flex-col gap-4 lg:w-[100px]">
        {images.map((image, imageIndex) => (
          <li key={imageIndex}>
            <button
              type="button"
              aria-pressed={imageIndex === index}
              aria-label={`Ver imagem ${imageIndex + 1} de ${images.length}`}
              onClick={() => setIndex(imageIndex)}
              className={cn(
                'block aspect-square w-full overflow-hidden rounded-lg border transition-colors',
                imageIndex === index ? 'border-brand' : 'border-transparent hover:border-line-soft',
              )}
            >
              <img src={image.small} alt="" width={100} height={100} className="size-full object-cover" />
            </button>
          </li>
        ))}
      </ul>

      <div className="relative grid aspect-square flex-1 place-items-center rounded-md bg-surface-card p-3 lg:w-[444px] lg:flex-none lg:p-4">
        <img
          src={current.large}
          srcSet={`${current.small} 480w, ${current.large} 960w`}
          sizes="(min-width: 1024px) 404px, 60vw"
          alt={current.alt}
          width={404}
          height={404}
          fetchPriority={index === 0 ? 'high' : undefined}
          className="aspect-square w-full rounded-3xl object-cover"
        />
        <button
          ref={zoomRef}
          type="button"
          aria-label="Ampliar imagem"
          aria-haspopup="dialog"
          aria-expanded={zoomOpen}
          onPointerEnter={ZoomDialog.preload}
          onFocus={ZoomDialog.preload}
          onClick={() => {
            setZoomMounted(true)
            setZoomOpen(true)
          }}
          className="absolute top-[15px] right-3 grid size-[30px] place-items-center rounded-full border border-line bg-surface-raised text-cream transition-colors hover:text-accent-text"
        >
          <Icon name="zoom" className="size-[18px]" />
        </button>
      </div>

      {zoomMounted && (
        <Suspense fallback={null}>
          <ZoomDialog open={zoomOpen} onOpenChange={setZoomOpen} name={name} image={current} returnFocusTo={zoomRef} />
        </Suspense>
      )}
    </div>
  )
}

/** Mobile (Figma "Hero"): imagens lado a lado com deslize e indicador de posição (pílula na atual). */
export function MobileGallery({ images }: GalleryProps) {
  const [index, setIndex] = useState(0)
  const trackRef = useRef<HTMLUListElement>(null)

  const onScroll = (event: UIEvent<HTMLUListElement>) => {
    const track = event.currentTarget
    setIndex(Math.round(track.scrollLeft / track.clientWidth))
  }

  const goTo = (target: number) => {
    const track = trackRef.current
    if (track) track.scrollTo({ left: target * track.clientWidth, behavior: 'smooth' })
  }

  return (
    <div className="relative">
      <ul
        ref={trackRef}
        tabIndex={0}
        aria-label="Imagens da obra, deslize para ver as outras"
        onScroll={onScroll}
        className="flex snap-x snap-mandatory overflow-x-auto rounded-3xl [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {images.map((image, imageIndex) => (
          <li key={imageIndex} className="w-full shrink-0 snap-center">
            <img
              src={image.large}
              srcSet={`${image.small} 480w, ${image.large} 960w`}
              sizes="100vw"
              alt={image.alt}
              width={361}
              height={356}
              loading={imageIndex === 0 ? 'eager' : 'lazy'}
              fetchPriority={imageIndex === 0 ? 'high' : undefined}
              className="h-[356px] w-full object-cover"
            />
          </li>
        ))}
      </ul>
      <div className="absolute inset-x-0 bottom-[50px] flex justify-center gap-0">
        {images.map((_, imageIndex) => (
          <button
            key={imageIndex}
            type="button"
            aria-label={`Imagem ${imageIndex + 1} de ${images.length}`}
            aria-current={imageIndex === index ? 'true' : undefined}
            onClick={() => goTo(imageIndex)}
            // Área de toque maior que o ponto de 7 px desenhado.
            className="grid h-6 place-items-center px-[3.5px]"
          >
            <span
              className={cn('block h-[7px] rounded-full bg-brand transition-all', imageIndex === index ? 'w-7' : 'w-[7px]')}
            />
          </button>
        ))}
      </div>
    </div>
  )
}
