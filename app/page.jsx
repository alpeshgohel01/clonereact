"use client"

import { useState, useEffect } from "react" // Import useState and useEffect
import { useAuth } from "./contexts/auth-context"
import RegisterForm from "./components/register-form"
import ChatApp from "./components/chat-app"
import AppProviders from "./providers/app-providers"
// Removed ConnectionStatus import as it's no longer needed at the entry point

function AppContent() {
  const { user, loading } = useAuth()
  const [mounted, setMounted] = useState(false) // New mounted state

  useEffect(() => {
    setMounted(true) // Set mounted to true after client-side hydration
  }, [])

  // Render a loading state until the component is mounted on the client
  // and the authentication status is determined.
  if (!mounted || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading ChatApp...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {user ? (
        <>
          {/* Removed <ConnectionStatus /> from here */}
          <ChatApp />
        </>
      ) : (
        <RegisterForm />
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
