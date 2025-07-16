// DOCUMENT filename="message-bubble.jsx"
"use client"

import { useState, useEffect } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Check, CheckCheck, Download, Play, Pause } from "lucide-react"

export default function MessageBubble({ message, isOwn, showAvatar, onRead = () => {} }) {
  const [imageLoaded, setImageLoaded] = useState(false)
  const [audioPlaying, setAudioPlaying] = useState(false)

  useEffect(() => {
    if (!isOwn && !message.is_read && onRead) {
      const timer = setTimeout(() => {
        onRead()
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [message, isOwn, onRead])

  const formatTime = (timestamp) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  const getMessageStatus = () => {
    if (!isOwn) return null

    switch (message.status) {
      case "Read":
        return <CheckCheck className="h-3 w-3 text-blue-500" />
      case "Delivered":
        return <CheckCheck className="h-3 w-3 text-gray-400" />
      case "Sent":
        return <Check className="h-3 w-3 text-gray-400" />
      default:
        return <Check className="h-3 w-3 text-gray-400" />
    }
  }

  const renderMessageContent = () => {
    switch (message.message_type) {
      case "image":
        return (
          <div className="relative">
            <img
              src={message.file_url || "/placeholder.svg"}
              alt="Shared image"
              className={`max-w-xs rounded-lg cursor-pointer transition-opacity ${
                imageLoaded ? "opacity-100" : "opacity-0"
              }`}
              onLoad={() => setImageLoaded(true)}
              onClick={() => window.open(message.file_url, "_blank")}
            />
            {!imageLoaded && (
              <div className="w-48 h-32 bg-gray-200 rounded-lg animate-pulse flex items-center justify-center">
                <span className="text-gray-400">Loading...</span>
              </div>
            )}
            {message.content && <p className="mt-2 text-sm">{message.content}</p>}
          </div>
        )

      case "file":
        return (
          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg max-w-xs">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                <Download className="h-5 w-5 text-white" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{message.file_name}</p>
              <p className="text-xs text-gray-500">{message.file_size}</p>
            </div>
          </div>
        )

      case "audio":
        return (
          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg max-w-xs">
            <button
              onClick={() => setAudioPlaying(!audioPlaying)}
              className="flex-shrink-0 w-10 h-10 bg-white rounded-full flex items-center justify-center"
            >
              {audioPlaying ? <Pause className="h-5 w-5 text-white" /> : <Play className="h-5 w-5 text-white ml-1" />}
            </button>
            <div className="flex-1">
              <div className="w-32 h-2 bg-gray-300 rounded-full">
                <div className="w-1/3 h-2 bg-white rounded-full"></div>
              </div>
              <p className="text-xs text-gray-500 mt-1">{message.duration || "0:30"}</p>
            </div>
          </div>
        )

      default:
        return <p className="text-sm">{message.content}</p>
    }
  }

  return (
    <div className={`flex ${isOwn ? "justify-end" : "justify-start"} ${showAvatar ? "mt-4" : "mt-1"}`}>
      <div className={`flex ${isOwn ? "flex-row-reverse" : "flex-row"} items-end space-x-2 max-w-xs md:max-w-md`}>
        {showAvatar && !isOwn && (
          <Avatar className="w-8 h-8">
            <AvatarImage src={message.sender?.profile_pic || "/placeholder.svg"} />
            <AvatarFallback className="text-xs">
              {message.sender?.name?.charAt(0)?.toUpperCase() || "?"}
            </AvatarFallback>
          </Avatar>
        )}

        <div className={`${showAvatar && !isOwn ? "ml-2" : ""} ${showAvatar && isOwn ? "mr-2" : ""}`}>
          {showAvatar && !isOwn && (
            <p className="text-xs text-gray-500 mb-1 ml-1">{message.sender?.name || "Unknown"}</p>
          )}

          <Card className={`${isOwn ? "bg-gray-200 text-black" : "bg-white border-gray-200"}`}>
            <CardContent className="p-3">
              {renderMessageContent()}

              <div
                className={`flex items-center justify-end space-x-1 mt-2 ${isOwn ? "text-black" : "text-gray-700"}`}
              >
                <span className="text-xs">{formatTime(message.timestamp)}</span>
                {getMessageStatus()}
              </div>
            </CardContent>
          </Card>

          {message.reactions && message.reactions.length > 0 && (
            <div className="flex space-x-1 mt-1">
              {message.reactions.map((reaction, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {reaction.emoji} {reaction.count}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}