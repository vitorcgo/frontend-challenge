import { Link, useCanGoBack, useNavigate, useRouter } from '@tanstack/react-router'
import facebookLogo from '@/assets/brands/facebook.svg'
import googleLogo from '@/assets/brands/google.svg'
import { Icon } from '@/components/icon'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { HomePage } from '@/features/catalog/components/home-page'
import { CATALOG_DEFAULTS } from '@/features/catalog/search'
import { useDocumentTitle } from '@/hooks/use-document-title'
import { useMediaQuery } from '@/hooks/use-media-query'
import { announce } from '@/lib/announce'
import { cn } from '@/lib/utils'
import type { AuthSearch } from '../redirect'
import { LoginForm, RegisterForm } from './auth-forms'

type Mode = 'login' | 'register'

const COPY = {
  login: {
    title: 'Entrar',
    mobileTitle: 'Entrar',
    description: 'Entre para gerenciar sua carteira, coleção e perfil de criador.',
  },
  register: {
    title: 'Criar conta',
    mobileTitle: 'Criar perfil de colecionador',
    description: 'Crie seu perfil de colecionador e conecte uma carteira quando quiser.',
  },
} as const

const SOON = 'disponível em breve'

/** Login social e recuperação de senha estão no Figma, mas fora do escopo: aparecem sem fingir que funcionam (§3). */
function SocialButtons({ className }: { className?: string }) {
  const providers = [
    { name: 'Google', logo: googleLogo },
    { name: 'Facebook', logo: facebookLogo },
  ]
  return (
    <div className={cn('flex flex-col gap-3 md:gap-4', className)}>
      {providers.map((provider) => (
        <button
          key={provider.name}
          type="button"
          disabled
          title="Disponível em breve"
          className="flex h-10 w-full items-center justify-center gap-3 rounded-[5px] border border-line text-caption leading-4 font-medium text-subtle-text disabled:cursor-not-allowed"
        >
          <img src={provider.logo} alt="" width={20} height={20} />
          Continuar com {provider.name}
          <span className="sr-only"> ({SOON})</span>
        </button>
      ))}
    </div>
  )
}

function Divider() {
  return (
    <div className="flex items-center gap-3">
      <span aria-hidden className="h-px flex-1 bg-line" />
      <span className="text-caption leading-4 text-cream">Ou continue com</span>
      <span aria-hidden className="h-px flex-1 bg-line" />
    </div>
  )
}

function ForgotPassword() {
  return (
    <span
      role="link"
      aria-disabled="true"
      title="Disponível em breve"
      className="self-end text-sm leading-4 text-accent-text opacity-80"
    >
      Esqueceu a senha?
      <span className="sr-only"> ({SOON})</span>
    </span>
  )
}

function useFinish(redirect: string | undefined) {
  const navigate = useNavigate()
  return (name: string) => {
    announce(`Você entrou como ${name}.`)
    // Volta para a tela de onde a pessoa veio (§3: retorno ao fluxo anterior).
    void navigate({ href: redirect ?? '/', replace: true })
  }
}

function AuthForm({ mode, redirect, submitLabel }: { mode: Mode; redirect?: string; submitLabel: string }) {
  const finish = useFinish(redirect)
  return mode === 'login' ? (
    <LoginForm onSuccess={finish} beforeSubmit={<ForgotPassword />} />
  ) : (
    <RegisterForm onSuccess={finish} submitLabel={submitLabel} />
  )
}

/** Desktop: modal sobre a Início, com as abas "Entrar | Criar conta" (Figma "Sign In Modal" e "Sign Up Modal"). */
function AuthDialog({ mode, redirect }: { mode: Mode; redirect?: string }) {
  const router = useRouter()
  const navigate = useNavigate()
  const canGoBack = useCanGoBack()
  const close = () => (canGoBack ? router.history.back() : void navigate({ to: '/' }))
  const copy = COPY[mode]
  const tab = (target: Mode) => (
    <Link
      to={target === 'login' ? '/entrar' : '/cadastro'}
      search={redirect ? { redirect } : {}}
      replace
      aria-current={mode === target ? 'page' : undefined}
      className={cn('rounded-sm text-xl leading-4 font-medium', mode === target ? 'text-accent-text' : 'text-cream hover:text-accent-text')}
    >
      {COPY[target].title}
    </Link>
  )

  return (
    <>
      <div aria-hidden inert>
        <HomePage search={{ ...CATALOG_DEFAULTS }} />
      </div>
      <Dialog open onOpenChange={(open) => !open && close()}>
        <DialogContent
          showCloseButton={false}
          // O Figma não escurece a página atrás do modal.
          overlayClassName="bg-transparent"
          // O foco começa no primeiro campo, não no botão de fechar.
          onOpenAutoFocus={(event) => {
            event.preventDefault()
            ;(event.currentTarget as HTMLElement).querySelector('input')?.focus()
          }}
          className="top-[160px] max-h-[calc(100dvh-180px)] w-[500px] max-w-[calc(100%-2rem)] translate-y-0 gap-0 overflow-y-auto rounded-lg border-0 bg-surface-card p-0 pb-[58px] text-cream sm:max-w-[500px]"
        >
          <button
            type="button"
            onClick={close}
            aria-label="Fechar"
            className="absolute top-[13px] right-[13px] grid size-8 place-items-center rounded-sm text-accent-text hover:text-cream"
          >
            <Icon name="close" />
          </button>
          <div className="flex flex-col items-center gap-10 px-12 pt-12">
            <nav aria-label="Entrar ou criar conta" className="flex items-center gap-2">
              {tab('login')}
              <span aria-hidden className="h-5 w-px bg-coral" />
              {tab('register')}
            </nav>
            <DialogTitle asChild>
              <h1 className="sr-only">{copy.title}</h1>
            </DialogTitle>
            <DialogDescription className="text-center text-caption leading-4 text-cream">{copy.description}</DialogDescription>
          </div>
          <div className="px-10 pt-6 sm:px-20">
            <AuthForm mode={mode} redirect={redirect} submitLabel="Criar conta" />
          </div>
          <div className="flex flex-col gap-3 pt-6 md:gap-4">
            <Divider />
            <SocialButtons className="px-10 sm:px-20" />
          </div>
          {/* Faixa laranja da base do modal no Figma. */}
          <span aria-hidden className="absolute inset-x-0 bottom-0 h-2.5 bg-brand" />
        </DialogContent>
      </Dialog>
    </>
  )
}

/** Mobile: tela cheia com a marca no topo (Figma "Mobile / Login" e "Mobile / Cadastro"). */
function AuthPage({ mode, redirect }: { mode: Mode; redirect?: string }) {
  const copy = COPY[mode]
  const other: Mode = mode === 'login' ? 'register' : 'login'
  return (
    <div className="mx-auto flex w-full max-w-[420px] flex-col px-6 pt-[120px] pb-10">
      <p className="text-center text-[32px] leading-none font-bold tracking-logo text-cream">KURIO</p>
      <h1 className="mt-[90px] text-center text-xl leading-6 font-bold text-cream">{copy.mobileTitle}</h1>
      <div className="mt-[46px]">
        <AuthForm mode={mode} redirect={redirect} submitLabel="Criar perfil" />
      </div>
      <div className="mt-12 flex flex-col gap-4">
        <Divider />
        <SocialButtons />
      </div>
      <p className="mt-12 text-center text-body text-subtle-text">
        {mode === 'login' ? 'Novo na Kurio? ' : 'Já tem uma conta? '}
        <Link
          to={other === 'login' ? '/entrar' : '/cadastro'}
          search={redirect ? { redirect } : {}}
          replace
          className="rounded-sm text-subtle-text underline-offset-4 hover:text-accent-text hover:underline"
        >
          {other === 'login' ? 'Entre' : 'Crie uma conta'}
        </Link>
      </p>
    </div>
  )
}

export function AuthScreen({ mode, search }: { mode: Mode; search: AuthSearch }) {
  const isDesktop = useMediaQuery('(min-width: 768px)')
  useDocumentTitle(COPY[mode].title)
  return isDesktop ? <AuthDialog mode={mode} redirect={search.redirect} /> : <AuthPage mode={mode} redirect={search.redirect} />
}
