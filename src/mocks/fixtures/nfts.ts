import type { EditionId, Network, Nft, NftCategory, NftEdition } from '@/api/contracts'
import { MAX_QUANTITY_PER_ORDER } from '@/api/contracts'

export interface NftRecord extends Nft {
  newRelease: boolean
  trendingScore: number
}

type ImageKey = 'monkey-varsity' | 'gorilla-bucket-hat' | 'gorilla-turtleneck' | 'orangutan-headphones'

const IMAGES: Record<ImageKey, { alt: string; collection: string; attributes: string[] }> = {
  'monkey-varsity': {
    alt: 'Macaco de óculos redondos e jaqueta college verde',
    collection: 'kurio-apes',
    attributes: ['Óculos', 'Jaqueta college'],
  },
  'gorilla-bucket-hat': {
    alt: 'Gorila de chapéu bucket verde e moletom roxo',
    collection: 'nomad-society',
    attributes: ['Chapéu bucket', 'Moletom'],
  },
  'gorilla-turtleneck': {
    alt: 'Gorila de gola alta verde e paletó creme',
    collection: 'kurio-apes',
    attributes: ['Gola alta', 'Paletó'],
  },
  'orangutan-headphones': {
    alt: 'Orangotango de fones de ouvido verdes e jaqueta creme',
    collection: 'golden-frequencies',
    attributes: ['Fones', 'Jaqueta creme'],
  },
}

const COLLECTIONS: Record<string, { name: string; creator: string; contract: string }> = {
  'kurio-apes': { name: 'Kurio Apes', creator: 'Nova Sato', contract: '0x7A42C3B1E5D9F0A8B6C4E2D1F3A5B7C9D0E119E8' },
  'nomad-society': { name: 'Nomad Society', creator: 'Iris Okafor', contract: '0x3E91A7C5B2D8F4E6A0C1B9D7F3E5A2C8B6D40F71' },
  'golden-frequencies': {
    name: 'Golden Frequencies',
    creator: 'Theo Marlowe',
    contract: '0xB58D2F6A9C3E1B7D4F0A8C2E6B9D1F5A3C7E0D24',
  },
}

const NETWORK_LABELS: Record<Network, string> = { ethereum: 'Ethereum', polygon: 'Polygon', solana: 'Solana' }

// [nome, imagem, categoria, rede, preço, preço anterior, raro, lançamento, em alta]
type Row = [string, ImageKey, NftCategory, Network, string, string | null, boolean, boolean, boolean]

// A ordem define "Listados recentemente"; os 9 primeiros reproduzem a primeira página do Figma.
const ROWS: Row[] = [
  ['Emerald Ape #042', 'monkey-varsity', 'arte-digital', 'ethereum', '1.19', null, true, true, true],
  ['Sage Nomad #009', 'gorilla-bucket-hat', 'colecionaveis', 'ethereum', '1.69', null, false, true, false],
  ['Neon Vessel #552', 'gorilla-turtleneck', 'arte-3d', 'polygon', '1.99', '2.29', false, true, true],
  ['Cosmic Bloom #118', 'gorilla-bucket-hat', 'generativa', 'solana', '1.29', null, false, false, true],
  ['Violet Nomad #314', 'gorilla-bucket-hat', 'arte-digital', 'polygon', '1.39', null, false, true, false],
  ['Ivory Baron #088', 'gorilla-turtleneck', 'colecionaveis', 'ethereum', '1.79', null, true, false, true],
  ['Golden Beat #207', 'orangutan-headphones', 'musica', 'ethereum', '0.99', null, false, true, true],
  ['Golden Pulse #233', 'orangutan-headphones', 'musica', 'polygon', '1.09', null, false, false, false],
  ['Golden Signal #160', 'orangutan-headphones', 'musica', 'solana', '0.39', null, false, true, false],
  ['Jade Monarch #071', 'monkey-varsity', 'fotografia', 'ethereum', '2.45', null, true, false, true],
  ['Lunar Nomad #126', 'gorilla-bucket-hat', 'fotografia', 'solana', '0.72', '0.85', false, false, false],
  ['Velvet Baron #305', 'gorilla-turtleneck', 'arte-digital', 'ethereum', '3.1', null, true, false, true],
  ['Golden Echo #412', 'orangutan-headphones', 'musica', 'ethereum', '0.58', null, false, false, false],
  ['Copper Ape #019', 'monkey-varsity', 'jogos', 'polygon', '0.84', null, false, true, false],
  ['Moss Wanderer #227', 'gorilla-bucket-hat', 'utilidade', 'polygon', '0.25', null, false, false, false],
  ['Onyx Regent #640', 'gorilla-turtleneck', 'arte-3d', 'ethereum', '4.2', '4.8', true, false, true],
  ['Golden Tempo #318', 'orangutan-headphones', 'assinaturas', 'solana', '0.15', null, false, false, false],
  ['Forest Ape #133', 'monkey-varsity', 'generativa', 'ethereum', '1.55', null, false, false, true],
  ['Dusk Nomad #482', 'gorilla-bucket-hat', 'arte-3d', 'ethereum', '2.05', null, false, false, false],
  ['Marble Baron #219', 'gorilla-turtleneck', 'fotografia', 'polygon', '1.12', null, false, false, false],
  ['Golden Static #091', 'orangutan-headphones', 'generativa', 'polygon', '0.47', null, false, false, false],
  ['Clover Ape #256', 'monkey-varsity', 'colecionaveis', 'solana', '0.66', null, false, false, false],
  ['Amber Nomad #347', 'gorilla-bucket-hat', 'jogos', 'ethereum', '0.92', '1.1', false, false, true],
  ['Slate Regent #508', 'gorilla-turtleneck', 'utilidade', 'solana', '0.33', null, false, false, false],
  ['Golden Chorus #175', 'orangutan-headphones', 'musica', 'ethereum', '1.48', null, false, false, false],
  ['Pine Ape #389', 'monkey-varsity', 'arte-digital', 'polygon', '0.77', null, false, false, false],
  ['Lilac Nomad #064', 'gorilla-bucket-hat', 'assinaturas', 'polygon', '0.12', null, false, false, false],
  ['Ash Baron #712', 'gorilla-turtleneck', 'jogos', 'ethereum', '2.6', null, false, false, false],
  ['Golden Verse #286', 'orangutan-headphones', 'arte-digital', 'solana', '0.54', null, false, false, false],
  ['Mint Ape #540', 'monkey-varsity', 'fotografia', 'ethereum', '1.95', null, false, false, false],
  ['Orchid Nomad #193', 'gorilla-bucket-hat', 'generativa', 'ethereum', '1.02', null, false, false, false],
  ['Stone Regent #827', 'gorilla-turtleneck', 'colecionaveis', 'polygon', '0.88', null, false, false, false],
  ['Golden Hymn #364', 'orangutan-headphones', 'assinaturas', 'ethereum', '0.21', null, false, false, false],
  ['Fern Ape #602', 'monkey-varsity', 'utilidade', 'solana', '0.09', null, false, false, false],
  ['Plum Nomad #455', 'gorilla-bucket-hat', 'arte-3d', 'solana', '1.36', null, false, false, false],
  ['Cedar Baron #931', 'gorilla-turtleneck', 'arte-digital', 'ethereum', '0.05', null, false, false, false],
]

const FIRST_LISTED_AT = Date.parse('2026-10-10T12:00:00.000Z')
const LISTING_INTERVAL_MS = 14 * 60 * 60 * 1000
const SOLD_OUT_INDEX = ROWS.length - 1

function buildEditions(index: number): NftEdition[] {
  const soldOut = index === SOLD_OUT_INDEX
  const editions: Array<[EditionId, string, number | null, number]> = [
    ['1-1', '1/1', 1, index % 5 === 0 ? 0 : 1],
    ['1-10', '1/10', 10, (index * 3) % 11],
    ['1-50', '1/50', 50, 50 - ((index * 7) % 50)],
    ['open', 'ABERTA', null, index % 9 === 4 ? 0 : 500],
  ]
  return editions.map(([id, label, supply, available]) => ({ id, label, supply, available: soldOut ? 0 : available }))
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/#/g, '')
    .trim()
    .replace(/\s+/g, '-')
}

export function buildNftFixtures(): NftRecord[] {
  return ROWS.map(([name, imageKey, category, network, price, previousPrice, rare, newRelease, trending], index) => {
    const image = IMAGES[imageKey]
    const collectionId = image.collection
    const collection = COLLECTIONS[collectionId]!
    const tokenNumber = name.split('#')[1]!
    const networkLabel = NETWORK_LABELS[network]
    const editions = buildEditions(index)
    const isEmeraldApe = index === 0

    return {
      id: slugify(name),
      name,
      tokenId: `#${tokenNumber.padStart(4, '0')}`,
      image: {
        alt: image.alt,
        small: `/images/nfts/${imageKey}-480.webp`,
        large: `/images/nfts/${imageKey}-960.webp`,
      },
      category,
      network,
      price,
      previousPrice,
      rare,
      available: editions.some((edition) => edition.available > 0),
      listedAt: new Date(FIRST_LISTED_AT - index * LISTING_INTERVAL_MS).toISOString(),
      version: 1,
      description: `Um colecionável digital finalizado à mão da coleção ${collection.name}, verificado na ${networkLabel}, com arte desbloqueável e acesso para colecionadores.`,
      story: [
        `${name} é uma obra digital finalizada à mão da coleção ${collection.name}. Cada atributo fica armazenado nos metadados do token e verificado na ${networkLabel}. A obra explora identidade, movimento e luz em um mundo digital sem fronteiras.`,
        `A propriedade inclui a arte em alta resolução, lançamentos exclusivos para colecionadores e um registro permanente de procedência na rede. ${collection.creator} recebe 5% de direitos autorais nas vendas secundárias, apoiando novos trabalhos e lançamentos da comunidade.`,
      ],
      collection: { id: collectionId, name: collection.name },
      creator: { name: collection.creator, royaltyPercent: 5 },
      contract: { address: collection.contract, standard: 'ERC-721' },
      attributes: isEmeraldApe ? ['Óculos', 'Esmeralda', 'Raro'] : rare ? [...image.attributes, 'Raro'] : image.attributes,
      rating: isEmeraldApe
        ? { average: '4.8', count: 19 }
        : { average: (3.9 + ((index * 7) % 11) / 10).toFixed(1), count: 5 + ((index * 13) % 40) },
      editions,
      maxPerOrder: MAX_QUANTITY_PER_ORDER,
      newRelease,
      trendingScore: trending ? 100 - index : 0,
    }
  })
}
