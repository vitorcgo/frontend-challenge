import { http, HttpResponse } from 'msw'
import { z } from 'zod'
import { EDITION_IDS, type Nft } from '@/api/contracts'
import { resetDatabase, write } from '../db'
import { API, controlRoute, notFound, param, readJson } from '../http'
import { toNft } from '../mappers'
import { resetNetworkState } from '../network'
import { connectedClients, disconnectAll, publishNftUpdated, replayEvent, resetRealtime } from '../realtime'
import { getScenario, isScenarioId, SCENARIOS, setScenario, type ScenarioId } from '../scenarios'

const CONTROL = `${API}/__mock`

const scenarioSchema = z.object({
  scenario: z.string().refine(isScenarioId, 'Cenário desconhecido.') as z.ZodType<ScenarioId>,
})

const resetSchema = z.object({
  scenario: (z.string().refine(isScenarioId, 'Cenário desconhecido.') as z.ZodType<ScenarioId>).optional(),
})

const nftPatchSchema = z.object({
  price: z.string().regex(/^\d+(\.\d{1,18})?$/).optional(),
  previousPrice: z.string().regex(/^\d+(\.\d{1,18})?$/).nullable().optional(),
  editions: z.array(z.object({ id: z.enum(EDITION_IDS), available: z.number().int().min(0) })).optional(),
})

const scenarioState = () => ({ scenario: getScenario(), available: SCENARIOS })

export const controlHandlers = [
  http.get(
    `${CONTROL}/scenario`,
    controlRoute(() => HttpResponse.json(scenarioState())),
  ),

  http.put(
    `${CONTROL}/scenario`,
    controlRoute(async ({ request }) => {
      const { scenario } = await readJson(request, scenarioSchema)
      setScenario(scenario)
      resetNetworkState()
      return HttpResponse.json(scenarioState())
    }),
  ),

  http.post(
    `${CONTROL}/reset`,
    controlRoute(async ({ request }) => {
      const body = request.headers.get('Content-Type')?.includes('json') ? await readJson(request, resetSchema) : {}
      await resetDatabase()
      setScenario(body.scenario ?? 'default')
      resetNetworkState()
      resetRealtime()
      return HttpResponse.json(scenarioState())
    }),
  ),

  http.post(
    `${CONTROL}/sessions/expire`,
    controlRoute(() => {
      const expired = new Date(Date.now() - 1000).toISOString()
      write((db) => db.sessions.forEach((session) => (session.expiresAt = expired)))
      return new HttpResponse(null, { status: 204 })
    }),
  ),

  http.patch(
    `${CONTROL}/nfts/:id`,
    controlRoute(async ({ request, params }) => {
      const id = param(params, 'id')
      const patch = await readJson(request, nftPatchSchema)
      const updated = write((db) => {
        const nft = db.nfts.find((item) => item.id === id)
        if (!nft) throw notFound()
        if (patch.price !== undefined) nft.price = patch.price
        if (patch.previousPrice !== undefined) nft.previousPrice = patch.previousPrice
        for (const change of patch.editions ?? []) {
          const edition = nft.editions.find((item) => item.id === change.id)
          if (edition) edition.available = change.available
        }
        nft.available = nft.editions.some((edition) => edition.available > 0)
        nft.version += 1
        return nft
      })
      publishNftUpdated(updated)
      return HttpResponse.json<Nft>(toNft(updated))
    }),
  ),

  // Reenvia um evento já publicado: `index` -1 é o último (duplicado), -2 o anterior (antigo).
  http.post(
    `${CONTROL}/realtime/replay`,
    controlRoute(async ({ request }) => {
      const { index } = await readJson(request, z.object({ index: z.number().int() }))
      const event = replayEvent(index)
      if (!event) throw notFound('Nenhum evento publicado nessa posição.')
      return HttpResponse.json(event)
    }),
  ),

  http.post(
    `${CONTROL}/realtime/disconnect`,
    controlRoute(() => HttpResponse.json({ closed: disconnectAll() })),
  ),

  http.get(
    `${CONTROL}/realtime`,
    controlRoute(() => HttpResponse.json({ connected: connectedClients() })),
  ),
]
