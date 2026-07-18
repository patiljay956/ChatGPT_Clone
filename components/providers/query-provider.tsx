"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

export const QueryProvider = ({ children }: { children: React.ReactNode }) => {

    const [queryClient] = React.useState(()=> new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 60 * 1000, // 
          gcTime: 1000 * 60 * 5,
        },
      },
    }));

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};
