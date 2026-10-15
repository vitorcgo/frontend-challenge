import type { Nft } from '@/api/contracts'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { NETWORK_LABELS } from '@/features/catalog/labels'
import { pluralize } from '@/lib/format'
import { RatingStars } from './rating-stars'

const shortAddress = (address: string) => `${address.slice(0, 6)}...${address.slice(-4)}`

function Field({ label, children }: { label: string; children: string }) {
  return (
    <div>
      <dt className="text-sm leading-6 font-bold text-cream">{label}</dt>
      <dd className="text-sm leading-6 text-subtle-text">{children}</dd>
    </div>
  )
}

const triggerClass =
  'h-auto flex-none rounded-none border-0 p-0 pb-3 max-w-full text-left whitespace-normal! text-md leading-4 font-normal text-cream after:bottom-0 after:h-[3px] after:bg-brand hover:text-accent-text data-[state=active]:font-bold data-[state=active]:text-accent-text'

/** Figma "Description": abas Detalhes e Avaliações sobre uma linha fina. */
export function NftDetailTabs({ nft }: { nft: Nft }) {
  const network = NETWORK_LABELS[nft.network]
  return (
    <Tabs defaultValue="details" className="gap-3">
      <TabsList variant="line" aria-label="Informações do NFT" className="w-full flex-wrap group-data-[orientation=horizontal]/tabs:h-auto justify-start gap-x-8 gap-y-3 border-b border-brand/30 p-0">
        <TabsTrigger value="details" className={triggerClass}>
          Detalhes do NFT
        </TabsTrigger>
        <TabsTrigger value="reviews" className={triggerClass}>
          {nft.rating.count === 1 ? 'Avaliação de colecionador' : 'Avaliações de colecionadores'} ({nft.rating.count})
        </TabsTrigger>
      </TabsList>

      <TabsContent value="details" className="flex flex-col gap-3">
        <div className="flex flex-col gap-6 text-sm leading-6 text-subtle-text">
          {nft.story.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
        <dl className="flex flex-col gap-3">
          <Field label="Rede:">{`Cunhado na ${network} com procedência imutável e metadados armazenados no IPFS.`}</Field>
          <Field label="Contrato:">{`${shortAddress(nft.contract.address)} • Contrato inteligente ${nft.contract.standard} verificado.`}</Field>
          <Field label="Direitos autorais:">
            {`Direitos autorais do criador: ${nft.creator.royaltyPercent}% nas vendas secundárias, pagos automaticamente pelos mercados compatíveis.`}
          </Field>
        </dl>
      </TabsContent>

      <TabsContent value="reviews" className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <RatingStars average={nft.rating.average} />
          <p className="text-body text-cream">
            {nft.rating.average} de 5, com base em{' '}
            {pluralize(nft.rating.count, 'avaliação de colecionador', 'avaliações de colecionadores')}.
          </p>
        </div>
        <p className="text-sm leading-6 text-subtle-text">
          Os comentários individuais das avaliações ainda não estão disponíveis nesta versão.
        </p>
      </TabsContent>
    </Tabs>
  )
}
