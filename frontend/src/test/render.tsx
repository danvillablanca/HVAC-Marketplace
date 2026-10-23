import type { ReactElement, ReactNode } from "react";
import { render, type RenderOptions } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/lib/theme";
import { AuthProvider } from "@/features/auth";

export function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
  });
}

interface WrapperProps {
  children: ReactNode;
  route?: string;
  queryClient?: QueryClient;
}

export function AllProviders({ children, route = "/", queryClient }: WrapperProps) {
  return (
    <QueryClientProvider client={queryClient ?? createTestQueryClient()}>
      <ThemeProvider>
        <TooltipProvider>
          <MemoryRouter initialEntries={[route]}>
            <AuthProvider>{children}</AuthProvider>
          </MemoryRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

interface RenderWithProvidersOptions extends Omit<RenderOptions, "wrapper"> {
  route?: string;
  queryClient?: QueryClient;
}

/** Renderiza un componente con todos los providers de la app (router, query, theme, auth). */
export function renderWithProviders(ui: ReactElement, options: RenderWithProvidersOptions = {}) {
  const { route, queryClient, ...rest } = options;
  return render(ui, {
    wrapper: ({ children }) => (
      <AllProviders route={route} queryClient={queryClient}>
        {children}
      </AllProviders>
    ),
    ...rest,
  });
}

export * from "@testing-library/react";
export { default as userEvent } from "@testing-library/user-event";
