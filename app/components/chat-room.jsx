"use client"

import { useState, useEffect, useRef } from "react"
import { useAuth } from "../contexts/auth-context"
import { useChat } from "../contexts/chat-context"
import { useWebSocket } from "../contexts/websocket-context"
import { useChatMessages } from "../hooks/use-chat-queries"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Send, ArrowLeft, Phone, Video, MoreVertical, Paperclip, Smile, XCircle } from "lucide-react" // Added XCircle
import MessageBubble from "./message-bubble"
import TypingIndicator from "./typing-indicator"

export default function ChatRoom({ onBack }) {
  const { user } = useAuth()
  const { activeChat, messages, typingUsers, setMessages } = useChat()
  const { sendChatMessage, sendTyping, sendStopTyping, connectionStatus } = useWebSocket()
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const [selectedImage, setSelectedImage] = useState(null) // State for selected image file
  const [imagePreview, setImagePreview] = useState(null) // State for image preview URL
  const messagesEndRef = useRef(null)
  const typingTimeoutRef = useRef(null)
  const fileInputRef = useRef(null) // Ref for hidden file input

  // Get messages from React Query
  const { data: fetchedMessages = [], isLoading: messagesLoading } = useChatMessages(activeChat?.id)

  useEffect(() => {
    if (activeChat) {
      if (fetchedMessages.length > 0) {
        setMessages(activeChat.id, fetchedMessages)
      }
    }
  }, [activeChat, fetchedMessages, setMessages])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const currentMessages = messages[activeChat?.id] || []
  const currentTypingUsers = typingUsers[activeChat?.id] || []

  const sendMessage = async (e) => {
    e.preventDefault()
    if ((!newMessage.trim() && !selectedImage) || loading || connectionStatus !== "connected") return

    setLoading(true)
    const messageText = newMessage
    const imageToSend = selectedImage

    setNewMessage("")
    setSelectedImage(null)
    setImagePreview(null)

    let success = false
    if (imageToSend) {
      // Simulate image upload to a backend and get a URL
      // In a real application, you would send `imageToSend` to your Django backend
      // and receive the actual URL of the uploaded image.
      // For now, we'll use a mock URL.
      console.log("Simulating image upload for:", imageToSend.name)
      const mockImageUrl = `/placeholder.svg?text=Image+${imageToSend.name}` // Mock URL
      // Example: const formData = new FormData(); formData.append('file', imageToSend);
      // const uploadResponse = await fetch('/api/upload-image', { method: 'POST', body: formData });
      // const imageUrl = (await uploadResponse.json()).url;

      success = sendChatMessage(messageText, "image", mockImageUrl, imageToSend.name)
    } else {
      success = sendChatMessage(messageText, "text")
    }

    if (!success) {
      // If WebSocket fails, restore message and image
      setNewMessage(messageText)
      setSelectedImage(imageToSend)
      if (imageToSend) setImagePreview(URL.createObjectURL(imageToSend))
    }

    setLoading(false)
  }

  const handleTyping = () => {
    if (connectionStatus === "connected") {
      sendTyping()
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    typingTimeoutRef.current = setTimeout(() => {
      if (connectionStatus === "connected") {
        sendStopTyping()
      }
    }, 1000)
  }

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (file && file.type.startsWith("image/")) {
      setSelectedImage(file)
      setImagePreview(URL.createObjectURL(file))
      setNewMessage(file.name) // Pre-fill message input with file name
    } else {
      setSelectedImage(null)
      setImagePreview(null)
      alert("Please select an image file.")
    }
  }

  const removeImagePreview = () => {
    setSelectedImage(null)
    setImagePreview(null)
    setNewMessage("") // Clear message input if it was pre-filled with file name
    if (fileInputRef.current) {
      fileInputRef.current.value = "" // Clear the file input
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const getChatName = () => {
    if (activeChat.is_group) {
      return activeChat.name
    } else {
      const otherParticipant = activeChat.participants.find((p) => p.id !== user.id)
      return otherParticipant ? otherParticipant.name : "Unknown User"
    }
  }

  const getChatAvatar = () => {
    if (activeChat.is_group) {
      return activeChat.avatar
    } else {
      const otherParticipant = activeChat.participants.find((p) => p.id !== user.id)
      return otherParticipant ? otherParticipant.profile_pic : null
    }
  }

  const getOnlineStatus = () => {
    if (activeChat.is_group) {
      const onlineCount = activeChat.participants.filter((p) => p.is_online).length
      return `${onlineCount} online`
    } else {
      const otherParticipant = activeChat.participants.find((p) => p.id !== user.id)
      return otherParticipant?.is_online ? "Online" : "Offline"
    }
  }

  if (!activeChat) {
    return null
  }

  if (messagesLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-50">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {onBack && (
              <Button variant="ghost" size="sm" onClick={onBack}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <Avatar>
              <AvatarImage src={getChatAvatar() || "/placeholder.svg"} />
              <AvatarFallback>{getChatName()?.charAt(0)?.toUpperCase() || "?"}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold">{getChatName()}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {getOnlineStatus()}
                {connectionStatus !== "connected" && <span className="text-red-500 ml-2">• Offline</span>}
              </p>
            </div>
          </div>

          <div className="flex space-x-2">
            <Button variant="ghost" size="sm">
              <Phone className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <Video className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {currentMessages.map((message, index) => (
            <MessageBubble
              key={message.id}
              message={message}
              isOwn={message.sender?.id === user?.id}
              showAvatar={index === 0 || currentMessages[index - 1]?.sender?.id !== message.sender?.id}
            />
          ))}

          {currentTypingUsers.length > 0 && <TypingIndicator users={currentTypingUsers} />}

          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Message Input */}
      <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4 shadow-md">
        {imagePreview && (
          <div className="relative mb-2 p-2 border rounded-lg bg-gray-50 dark:bg-gray-700">
            <img
              src={imagePreview || "/placeholder.svg"}
              alt="Image preview"
              className="max-h-32 rounded-md object-contain"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute top-1 right-1 h-6 w-6 text-red-500 hover:bg-red-100 dark:hover:bg-red-900"
              onClick={removeImagePreview}
            >
              <XCircle className="h-4 w-4" />
              <span className="sr-only">Remove image</span>
            </Button>
          </div>
        )}
        <form onSubmit={sendMessage} className="flex items-center space-x-2">
          <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
          <Button type="button" variant="ghost" size="sm" onClick={() => fileInputRef.current?.click()}>
            <Paperclip className="h-4 w-4" />
          </Button>

          <div className="flex-1 relative">
            <Input
              value={newMessage}
              onChange={(e) => {
                setNewMessage(e.target.value)
                handleTyping()
              }}
              placeholder={connectionStatus === "connected" ? "Type a message..." : "Reconnecting..."}
              className="pr-10 bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-50"
              disabled={loading || connectionStatus !== "connected"}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-2 top-1/2 transform -translate-y-1/2"
            >
              <Smile className="h-4 w-4" />
            </Button>
          </div>

          <Button
            type="submit"
            disabled={loading || (!newMessage.trim() && !selectedImage) || connectionStatus !== "connected"}
            className="bg-emerald-500 hover:bg-emerald-600 text-white"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  )
}
