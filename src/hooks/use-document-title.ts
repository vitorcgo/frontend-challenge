import { useEffect } from 'react'

const SITE_NAME = 'Kurio'

export function useDocumentTitle(title: string | undefined) {
  useEffect(() => {
    if (!title) return
    const previous = document.title
    document.title = `${title} | ${SITE_NAME}`
    return () => {
      document.title = previous
    }
  }, [title])
}
