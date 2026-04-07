"use client";

import {
  MutationCache,
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { useState } from "react";
import { AuthProvider } from "./auth-context";
import { publishAppError } from "./error-bus";
import { ErrorToast } from "@/components/ui/ErrorToast";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        queryCache: new QueryCache({
          onError: (error) => publishAppError(error),
        }),
        mutationCache: new MutationCache({
          onError: (error) => publishAppError(error),
        }),
        defaultOptions: {
          queries: { staleTime: 60 * 1000 },
        },
      }),
  );
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {children}
        <ErrorToast />
      </AuthProvider>
    </QueryClientProvider>
  );
}
