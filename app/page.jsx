"use client"

import { useState, useEffect } from "react"
import { useAuth } from "./contexts/auth-context"
import LoginForm from "./components/login-form" // Import LoginForm
import ChatApp from "./components/chat-app"
import AppProviders from "./providers/app-providers"

function AppContent() {
  const { user, loading } = useAuth()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-emerald-50 to-violet-100 dark:from-gray-950 dark:to-gray-800">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-emerald-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading ChatApp...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {user ? (
        <ChatApp />
      ) : (
        <LoginForm /> // Render LoginForm for both login and registration
      )}
    </div>
  )
}

export default function App() {
  return (
    <AppProviders>
      <AppContent />
    </AppProviders>
  )
}
