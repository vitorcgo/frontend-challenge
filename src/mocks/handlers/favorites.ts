import { http, HttpResponse } from 'msw'
import type { FavoritesResponse } from '@/api/contracts'
import { read, write } from '../db'
import { API, notFound, param, requireSession, route } from '../http'

function favoritesOf(userId: string): FavoritesResponse {
  return { nftIds: read((db) => [...(db.favorites[userId] ?? [])]) }
}

function assertNftExists(nftId: string): void {
  if (!read((db) => db.nfts.some((nft) => nft.id === nftId))) {
    throw notFound('Este NFT não existe ou foi removido do catálogo.')
  }
}

export const favoriteHandlers = [
  http.get(
    `${API}/favorites`,
    route(({ request }) => {
      const { user } = requireSession(request)
      return HttpResponse.json<FavoritesResponse>(favoritesOf(user.id))
    }),
  ),

  http.put(
    `${API}/favorites/:nftId`,
    route(({ request, params }) => {
      const { user } = requireSession(request)
      const nftId = param(params, 'nftId')
      assertNftExists(nftId)
      write((db) => {
        const list = (db.favorites[user.id] ??= [])
        if (!list.includes(nftId)) list.push(nftId)
      })
      return HttpResponse.json<FavoritesResponse>(favoritesOf(user.id))
    }),
  ),

  http.delete(
    `${API}/favorites/:nftId`,
    route(({ request, params }) => {
      const { user } = requireSession(request)
      const nftId = param(params, 'nftId')
      write((db) => {
        db.favorites[user.id] = (db.favorites[user.id] ?? []).filter((id) => id !== nftId)
      })
      return HttpResponse.json<FavoritesResponse>(favoritesOf(user.id))
    }),
  ),
]
