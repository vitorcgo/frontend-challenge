import { Skeleton } from '@/components/ui/skeleton'

export function NftDetailSkeleton({ isDesktop }: { isDesktop: boolean }) {
  if (!isDesktop) {
    return (
      <div aria-hidden>
        <div className="bg-surface-card px-7 pt-[23px] pb-[84px]">
          <div className="flex justify-between">
            <Skeleton className="size-[35px] rounded-full" />
            <Skeleton className="size-[35px] rounded-full" />
          </div>
          <Skeleton className="mt-2 h-[356px] w-full rounded-3xl" />
        </div>
        <div className="relative -mt-[114px] flex flex-col gap-3 rounded-t-[31px] bg-surface-card px-6 pt-8 pb-6">
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-7 w-full" />
          <Skeleton className="h-20 w-3/4" />
        </div>
      </div>
    )
  }

  // Alturas das abas e de "Mais desta coleção" já reservadas: sem elas o rodapé subia e era empurrado ao carregar.
  return (
    <div aria-hidden className="flex flex-col gap-24">
      <div className="flex min-h-[1195px] flex-col gap-3 lg:min-h-[679px] xl:min-h-[555px]">
        <Skeleton className="h-5 w-56" />
        <div className="flex flex-col gap-8 lg:flex-row">
          <div className="flex gap-4 lg:gap-7">
            <div className="flex w-[72px] shrink-0 flex-col gap-4 lg:w-[100px]">
              {Array.from({ length: 4 }, (_, index) => (
                <Skeleton key={index} className="aspect-square w-full rounded-lg" />
              ))}
            </div>
            <Skeleton className="aspect-square flex-1 rounded-md lg:w-[444px] lg:flex-none" />
          </div>
          <div className="flex flex-1 flex-col gap-6">
            <Skeleton className="h-8 w-2/3" />
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-7 w-52" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-20 w-2/3" />
          </div>
        </div>
      </div>
      <Skeleton className="h-[437px] w-full lg:h-[389px] xl:h-[341px]" />
      <Skeleton className="h-[339px] w-full lg:h-[355px] xl:h-[382px]" />
    </div>
  )
}
