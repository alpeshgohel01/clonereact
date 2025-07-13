"use client"

import { useWebSocket } from "../contexts/websocket-context"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Wifi, WifiOff, RotateCcw } from "lucide-react"

export default function ConnectionStatus() {
  const { connectionStatus, reconnect } = useWebSocket()

  if (connectionStatus === "connected") {
    return null // Don't show anything when connected
  }

  const getStatusConfig = () => {
    switch (connectionStatus) {
      case "reconnecting":
        return {
          icon: <RotateCcw className="h-4 w-4 animate-spin" />,
          message: "Reconnecting to chat...",
          variant: "default",
          showReconnect: false,
        }
      case "error":
        return {
          icon: <WifiOff className="h-4 w-4" />,
          message: "Connection failed. Some features may not work.",
          variant: "destructive",
          showReconnect: true,
        }
      case "disconnected":
        return {
          icon: <WifiOff className="h-4 w-4" />,
          message: "Disconnected from chat. Messages may not be real-time.",
          variant: "destructive",
          showReconnect: true,
        }
      default:
        return null
    }
  }

  const config = getStatusConfig()
  if (!config) return null

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-md px-4">
      <Alert variant={config.variant}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {config.icon}
            <AlertDescription>{config.message}</AlertDescription>
          </div>
          {config.showReconnect && (
            <Button size="sm" variant="outline" onClick={reconnect}>
              <Wifi className="h-3 w-3 mr-1" />
              Retry
            </Button>
          )}
        </div>
      </Alert>
    </div>
  )
}
