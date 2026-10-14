export const CATALOG_SECTION_ID = 'mercado'

const MAX_FRAMES = 60

/** Leva a pessoa (e o foco do teclado e do leitor de tela) até os resultados do catálogo. */
export function focusCatalogResults(): void {
  // Vindo de outra página, a seção ainda pode estar carregando: tenta a cada quadro por cerca de 1 s.
  const attempt = (frame: number) => {
    const section = document.getElementById(CATALOG_SECTION_ID)
    if (!section) {
      if (frame < MAX_FRAMES) requestAnimationFrame(() => attempt(frame + 1))
      return
    }
    section.scrollIntoView({ block: 'start' })
    section.focus({ preventScroll: true })
  }
  requestAnimationFrame(() => attempt(0))
}
