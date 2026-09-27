import {
  Link,
  Outlet,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
} from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

import { reportLovableError } from "../lib/lovable-error-reporting";
import { VisualConfigProvider } from "../kiosk/VisualContext";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>

        <h2 className="mt-4 text-xl font-semibold text-foreground">Página não encontrada</h2>

        <p className="mt-2 text-sm text-muted-foreground">A página solicitada não existe.</p>

        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            Voltar
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);

  const router = useRouter();

  useEffect(() => {
    reportLovableError(error, {
      boundary: "tanstack_root_error_component",
    });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Não foi possível carregar
        </h1>

        <p className="mt-2 text-sm text-muted-foreground">Ocorreu um erro na aplicação.</p>

        <div className="mt-6 flex justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            Tentar novamente
          </button>

          <Link
            to="/"
            className="rounded-md border border-input bg-background px-4 py-2 text-sm font-medium"
          >
            Início
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient;
}>()({
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <VisualConfigProvider>
        <Outlet />
        <NavigationTransition />
      </VisualConfigProvider>
    </QueryClientProvider>
  );
}

function NavigationTransition() {
  const isPending = useRouterState({ select: (state) => state.status === "pending" });
  if (!isPending) return null;
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/95">
      <div className="relative h-32 w-full">
      </div>
      <Loader2 className="mt-4 size-10 animate-spin text-primary" />
    </div>
  );
}
