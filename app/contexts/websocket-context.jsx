"use client"

import { createContext, useContext, useEffect, useRef, useState, useCallback } from "react"
import { useAuth } from "./auth-context"
import { useChat } from "./chat-context"

const WebSocketContext = createContext()

// Helper function to generate a consistent room name for private chats
// This ensures that for any two users, the chat ID is always the same regardless of who initiates.
const generatePrivateChatId = (mobile1, mobile2) => {
  const sortedMobiles = [mobile1, mobile2].sort()
  return `chet_currentuser_${sortedMobiles[0]}_with_${sortedMobiles[1]}`
}

export function WebSocketProvider({ children }) {
  const { user, accessToken } = useAuth()
  const { activeChat, addMessage, updateMessage, setTypingUsers, setOnlineUsers } = useChat()
  const [connectionStatus, setConnectionStatus] = useState("disconnected")
  const wsRef = useRef(null)
  const reconnectTimeoutRef = useRef(null)
  const reconnectAttemptsRef = useRef(0)
  const maxReconnectAttempts = 5

  const connectWebSocket = useCallback(
    (chatId) => {
      if (!user || !accessToken || !chatId || wsRef.current?.readyState === WebSocket.OPEN) {
        console.warn("Cannot connect WebSocket: Missing user, token, chatId, or already connected")
        return
      }

      try {
        const wsUrl = `ws://192.168.17.136:8000/ws/chat/${chatId}/?token=${accessToken}`
        console.log(`Connecting to WebSocket: ${wsUrl}`)
        wsRef.current = new WebSocket(wsUrl)

        wsRef.current.onopen = () => {
          console.log(`WebSocket connected to room: ${chatId}`)
          setConnectionStatus("connected")
          reconnectAttemptsRef.current = 0

          sendMessage({ type: "authenticate", token: accessToken, user_id: user.id })
          sendMessage({ type: "join_chat", chat_id: chatId, room_id: chatId, user_id: user.id })
        }

        wsRef.current.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data)
            console.log("Received WebSocket message:", data)
            handleWebSocketMessage(data)
          } catch (error) {
            console.error("WebSocket parse error:", error)
          }
        }

        wsRef.current.onclose = (event) => {
          console.log(`WebSocket disconnected from room ${chatId}:`, event.code, event.reason)
          setConnectionStatus("disconnected")
          if (event.code !== 1000 && reconnectAttemptsRef.current < maxReconnectAttempts) {
            scheduleReconnect(chatId)
          }
        }

        wsRef.current.onerror = (error) => {
          console.error(`WebSocket error for room ${chatId}:`, error)
          setConnectionStatus("error")
          if (wsRef.current) wsRef.current.close()
        }
      } catch (error) {
        console.error("WebSocket init error:", error)
        setConnectionStatus("error")
        scheduleReconnect(chatId)
      }
    },
    [accessToken, user],
  )

  const scheduleReconnect = useCallback(
    (chatIdToReconnect) => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current)

      const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000)
      reconnectAttemptsRef.current += 1

      console.log(`Reconnecting to room ${chatIdToReconnect} in ${delay}ms (Attempt ${reconnectAttemptsRef.current})`)
      setConnectionStatus("reconnecting")

      reconnectTimeoutRef.current = setTimeout(() => {
        if (user && accessToken && chatIdToReconnect) {
          connectWebSocket(chatIdToReconnect)
        }
      }, delay)
    },
    [user, accessToken, connectWebSocket],
  )

  const disconnectWebSocket = useCallback(() => {
    if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current)
    if (wsRef.current) {
      wsRef.current.close(1000, "Client disconnected")
      wsRef.current = null
    }
    setConnectionStatus("disconnected")
    reconnectAttemptsRef.current = 0
  }, [])

  useEffect(() => {
    if (user && accessToken && activeChat?.id) {
      disconnectWebSocket()
      connectWebSocket(activeChat.id)
    } else {
      disconnectWebSocket()
    }
    return () => disconnectWebSocket()
  }, [user, accessToken, activeChat?.id, connectWebSocket, disconnectWebSocket])

  const handleWebSocketMessage = useCallback(
    (data) => {
      switch (data.type) {
        case "new_message":
          console.log("New message received:", data.message)
          addMessage(data.chat_id || data.room_id, data.message)
          break
        case "typing":
        case "stop_typing":
          if (data.user_id !== user?.id) {
            console.log(`${data.type} event from ${data.user_name}`)
            setTypingUsers(data.chat_id || data.room_id, data.typing_users || [data.user_name])
          }
          break
        case "user_online":
        case "user_offline":
          console.log("Online users update:", data.online_users)
          setOnlineUsers(data.online_users || [])
          break
        case "message_read":
          console.log("Message read update:", data.message_id, data.read_by)
          updateMessage(data.chat_id || data.room_id, {
            id: data.message_id,
            read_by: data.read_by,
          })
          break
        default:
          console.log("Unknown WebSocket message type:", data.type)
      }
    },
    [user, addMessage, setTypingUsers, setOnlineUsers, updateMessage],
  )

  const sendMessage = useCallback((msg) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      console.log("Sending message:", msg)
      wsRef.current.send(JSON.stringify(msg))
      return true
    }
    console.warn("WebSocket not open, cannot send message:", msg)
    return false
  }, [])

  const sendChatMessage = useCallback(
    (content, messageType = "text") => {
      if (!activeChat?.id || !user) {
        console.warn("Cannot send message: Missing activeChat or user")
        return false
      }
      return sendMessage({
        type: "send_message",
        chat_id: activeChat.id,
        room_id: activeChat.id,
        content,
        message_type: messageType,
        user_id: user.id,
        sender: {
          id: user.id,
          name: user.name,
          email: user.email,
          mobile: user.mobile,
          profile_pic: user.profile_pic,
          is_online: user.is_online,
        },
      })
    },
    [sendMessage, user, activeChat],
  )

  const sendTyping = useCallback(() => {
    if (!activeChat?.id || !user) {
      console.warn("Cannot send typing: Missing activeChat or user")
      return false
    }
    return sendMessage({
      type: "typing",
      chat_id: activeChat.id,
      room_id: activeChat.id,
      user_id: user.id,
      user_name: user.name,
    })
  }, [sendMessage, user, activeChat])

  const sendStopTyping = useCallback(() => {
    if (!activeChat?.id || !user) {
      console.warn("Cannot send stop_typing: Missing activeChat or user")
      return false
    }
    return sendMessage({
      type: "stop_typing",
      chat_id: activeChat.id,
      room_id: activeChat.id,
      user_id: user.id,
      user_name: user.name,
    })
  }, [sendMessage, user, activeChat])

  const markMessageAsRead = useCallback(
    (messageId) => {
      if (!activeChat?.id || !user) {
        console.warn("Cannot mark message as read: Missing activeChat or user")
        return false
      }
      return sendMessage({
        type: "mark_read",
        chat_id: activeChat.id,
        room_id: activeChat.id,
        message_id: messageId,
        user_id: user.id,
      })
    },
    [sendMessage, user, activeChat],
  )

  const joinChat = useCallback(
    (chatId) => {
      if (!user) {
        console.warn("Cannot join chat: Missing user")
        return false
      }
      return sendMessage({
        type: "join_chat",
        chat_id: chatId,
        room_id: chatId,
        user_id: user.id,
      })
    },
    [sendMessage, user],
  )

  const leaveChat = useCallback(
    (chatId) => {
      if (!user) {
        console.warn("Cannot leave chat: Missing user")
        return false
      }
      return sendMessage({
        type: "leave_chat",
        chat_id: chatId,
        room_id: chatId,
        user_id: user.id,
      })
    },
    [sendMessage, user],
  )

  const value = {
    connectionStatus,
    sendMessage,
    sendChatMessage,
    sendTyping,
    sendStopTyping,
    markMessageAsRead,
    joinChat,
    leaveChat,
    reconnect: () => activeChat?.id && connectWebSocket(activeChat.id),
  }

  return <WebSocketContext.Provider value={value}>{children}</WebSocketContext.Provider>
}

export const useWebSocket = () => {
  const context = useContext(WebSocketContext)
  if (!context) {
    throw new Error("useWebSocket must be used within a WebSocketProvider")
  }
  return context
}

export { generatePrivateChatId }
