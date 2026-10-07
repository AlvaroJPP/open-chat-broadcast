import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { Cast } from 'lucide-react'
import { useState, type FormEvent } from 'react'

export const Route = createFileRoute('/auth/login')({
  component: RouteComponent,
})

/**
 * Tela de login.
 * - Login feito via `nickname` + senha (conforme regra de negócio do backend).
 * - Usa tokens do design system (bg-card, border-border, ring-ring, etc)
 *   para manter contraste correto em tema claro e escuro.
 * - Acessível: labels visíveis, aria-describedby para erros, foco visível.
 */
function RouteComponent() {
  const navigate = useNavigate()

  const [nickname, setNickname] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    if (!nickname.trim() || !password) {
      setError('Preencha o apelido e a senha para continuar.')
      return
    }

    setIsSubmitting(true)
    try {
      // TODO: integrar com o endpoint real de autenticação (ex: /api/auth/login)
      const response = await fetch('/api/users/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          nickname: nickname.trim(),
          pwd: password,
        }),
      })

    const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(
          result?.error?.message || 'Apelido ou senha inválidos.'
        )
      }

      // Guarda o usuário autenticado para a tela /rooms
      if (result.data) {
        localStorage.setItem('currentUser', JSON.stringify(result.data))
      }

      navigate({ to: '/rooms' })
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Não foi possível entrar. Tente novamente.')
          } finally {
            setIsSubmitting(false)
          }
        }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        {/* Cabeçalho consistente com o restante da aplicação */}
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
            Entrar na sua conta
          </h1>
          <p className="text-sm text-muted-foreground">
            Bem-vindo de volta! Informe seus dados para continuar.
          </p>
        </header>

        <div className="rounded-[var(--radius)] border border-border bg-card p-6 shadow-sm sm:p-8">
          <form className="space-y-5" onSubmit={handleSubmit} noValidate>
            {/* Campo: Apelido (nickname) */}
            <div className="space-y-1.5">
              <label
                htmlFor="nickname"
                className="text-sm font-medium text-foreground"
              >
                Apelido
              </label>
              <input
                id="nickname"
                name="nickname"
                type="text"
                autoComplete="email"
                required
                autoFocus
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                aria-invalid={!!error}
                aria-describedby={error ? 'login-error' : undefined}
                placeholder="seu_apelido"
                className="w-full rounded-md border border-input bg-input/30 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
              />
            </div>

            {/* Campo: Senha */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="text-sm font-medium text-foreground"
                >
                  Senha
                </label>
                <Link
                  to="/auth/forgot-password"
                  className="text-xs font-medium text-accent hover:underline"
                >
                  Esqueceu a senha?
                </Link>
              </div>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  aria-invalid={!!error}
                  aria-describedby={error ? 'login-error' : undefined}
                  placeholder="Sua Senha"
                  className="w-full rounded-md border border-input bg-input/30 px-3 py-2 pr-10 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {/* Mensagem de erro acessível */}
            {error && (
              <p
                id="login-error"
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
              {isSubmitting ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-muted-foreground">
          Não tem uma conta?{' '}
          <Link to="/auth/register" className="font-medium text-accent hover:underline">
            Criar conta
          </Link>
        </p>
      </div>
    </div>
  )
}