import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { Cast } from 'lucide-react'
import { useState, type FormEvent } from 'react'

export const Route = createFileRoute('/auth/register')({
  component: RouteComponent,
})

/**
 * Tela de cadastro.
 * Backend (POST /api/users) espera: { email, nickname, avatar }
 * OBS: o endpoint atual não recebe senha — sinalizamos isso abaixo.
 */
function RouteComponent() {
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [nickname, setNickname] = useState('')
  const [avatar, setAvatar] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    if (!email.trim() || !nickname.trim()) {
      setError('Email e apelido são obrigatórios.')
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch('http://localhost:3001/api/users/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, nickname, avatar: avatar || undefined }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => null)
        throw new Error(data?.message ?? 'Não foi possível criar a conta.')
      }

      navigate({ to: '/auth/login' })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro inesperado. Tente novamente.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <header className="flex flex-col items-center gap-2 text-center">
          <div className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Cast className="size-5" />
            </span>
            <span className="text-lg font-semibold text-foreground">
              Open Chat <span className="text-success">Broadcast</span>
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Criar sua conta
          </h1>
          <p className="text-sm text-muted-foreground">
            Preencha os dados abaixo para começar.
          </p>
        </header>

        <div className="rounded-[var(--radius)] border border-border bg-card p-6 shadow-sm sm:p-8">
          <form className="space-y-5" onSubmit={handleSubmit} noValidate>
            {/* Email */}
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-sm font-medium text-foreground">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="joao@example.com"
                className="w-full rounded-md border border-input bg-input/30 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
              />
            </div>

            {/* Apelido */}
            <div className="space-y-1.5">
              <label htmlFor="nickname" className="text-sm font-medium text-foreground">
                Apelido
              </label>
              <input
                id="nickname"
                name="nickname"
                type="text"
                autoComplete="email"
                required
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="joaosilva"
                className="w-full rounded-md border border-input bg-input/30 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
              />
              <p className="text-xs text-muted-foreground">
                É com o apelido que você vai fazer login.
              </p>
            </div>

            {/* Avatar (opcional, URL) */}
            <div className="space-y-1.5">
              <label htmlFor="avatar" className="text-sm font-medium text-foreground">
                URL do avatar <span className="text-muted-foreground">(opcional)</span>
              </label>
              <input
                id="avatar"
                name="avatar"
                type="url"
                value={avatar}
                onChange={(e) => setAvatar(e.target.value)}
                placeholder="https://exemplo.com/avatar.png"
                className="w-full rounded-md border border-input bg-input/30 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
              />
            </div>

            {error && (
              <p
                role="alert"
                className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? 'Criando conta...' : 'Criar conta'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-muted-foreground">
          Já tem uma conta?{' '}
          <Link to="/auth/login" className="font-medium text-accent hover:underline">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  )
}