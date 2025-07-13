"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { AuthProvider } from "../contexts/auth-context"
import { ChatProvider } from "../contexts/chat-context"
import { WebSocketProvider } from "../contexts/websocket-context"
import { ThemeProvider } from "next-themes" // Import ThemeProvider

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      cacheTime: 1000 * 60 * 10, // 10 minutes
    },
  },
})

export default function AppProviders({ children }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        <AuthProvider>
          <ChatProvider>
            <WebSocketProvider>{children}</WebSocketProvider>
          </ChatProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}
