"use client";

import {
  MutationCache,
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { useState } from "react";
import { AuthProvider } from "./auth-context";
import { publishAppError, toastSuccess } from "./error-bus";
import { ErrorToast } from "@/components/ui/ErrorToast";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        queryCache: new QueryCache({
          onError: (error) => publishAppError(error),
        }),
        mutationCache: new MutationCache({
          // A mutation that shows its own error (e.g. "already applied, apply again?") sets meta.silentError.
          onError: (error, _vars, _ctx, mutation) => {
            if (!mutation.meta?.silentError) publishAppError(error);
          },
          // Every save says so: hooks set meta.successMessage ("Client created").
          onSuccess: (_data, _vars, _ctx, mutation) => {
            const message = mutation.meta?.successMessage;
            if (typeof message === "string") toastSuccess(message);
          },
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
