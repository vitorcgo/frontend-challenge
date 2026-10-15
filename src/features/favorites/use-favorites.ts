import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { FavoritesResponse } from '@/api/contracts'
import { addFavorite, getFavorites, removeFavorite } from '@/api/endpoints/favorites'
import { useSession } from '@/features/auth/session'
import { announce } from '@/lib/announce'

export const favoriteKeys = {
  list: (userId: string | undefined) => ['favorites', userId] as const,
}

const TOGGLE_KEY = ['favorites', 'toggle'] as const

export function useFavorites() {
  const { user } = useSession()
  return useQuery({
    queryKey: favoriteKeys.list(user?.id),
    queryFn: ({ signal }) => getFavorites(signal),
    enabled: Boolean(user),
  })
}

export function useFavoriteStatus(nftId: string) {
  const { data, isPending } = useFavorites()
  return { isFavorite: data?.nftIds.includes(nftId) ?? false, isLoading: isPending }
}

interface ToggleInput {
  nftId: string
  favorite: boolean
}

export function useToggleFavorite() {
  const queryClient = useQueryClient()
  const { user } = useSession()
  const key = favoriteKeys.list(user?.id)

  const mutation = useMutation({
    mutationKey: TOGGLE_KEY,
    // Em fila: com latência variável, um "remover" antigo chegaria ao servidor depois de um "adicionar" novo.
    scope: { id: 'favorites' },
    mutationFn: ({ nftId, favorite }: ToggleInput) => (favorite ? addFavorite(nftId) : removeFavorite(nftId)),
    onMutate: async ({ nftId, favorite }) => {
      const previous = queryClient.getQueryData<FavoritesResponse>(key)
      queryClient.setQueryData<FavoritesResponse>(key, (current) => {
        const ids = current?.nftIds.filter((id) => id !== nftId) ?? []
        return { nftIds: favorite ? [...ids, nftId] : ids }
      })
      await queryClient.cancelQueries({ queryKey: key }, { revert: false })
      return { previous }
    },
    onError: (_error, _input, context) => {
      queryClient.setQueryData(key, context?.previous)
      announce('Não foi possível atualizar seus favoritos. Tente novamente.')
    },
    onSuccess: (_data, { favorite }) => {
      announce(favorite ? 'Adicionado aos favoritos.' : 'Removido dos favoritos.')
    },
    onSettled: () => {
      // Com cliques seguidos, só a última resposta sincroniza: uma resposta antiga não desfaz o clique mais novo.
      if (queryClient.isMutating({ mutationKey: TOGGLE_KEY }) === 1) {
        void queryClient.invalidateQueries({ queryKey: key })
      }
    },
  })

  // Lê o cache na hora do clique, não o valor da última renderização: cliques rápidos alternam de verdade.
  const toggle = (nftId: string) => {
    const isFavorite = queryClient.getQueryData<FavoritesResponse>(key)?.nftIds.includes(nftId) ?? false
    mutation.mutate({ nftId, favorite: !isFavorite })
  }

  return { toggle, isError: mutation.isError }
}
