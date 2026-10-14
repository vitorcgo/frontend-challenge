// A tela é desenhada antes dos mocks iniciarem; só as chamadas à API esperam por eles.
let markReady: () => void = () => {}

export const apiReady = new Promise<void>((resolve) => {
  markReady = resolve
})

export function markApiReady(): void {
  markReady()
}
