"use client"

import { createContext, useContext, useEffect, useRef, useState, useCallback } from "react"
import { useAuth } from "./auth-context"
import { useChat } from "./chat-context" // Ensure useChat is imported

const WebSocketContext = createContext()

// Helper function to generate a consistent room name for private chats
const generatePrivateChatId = (mobile1, mobile2) => {
  const sortedMobiles = [mobile1, mobile2].sort()
  return `chet_currentuser_${sortedMobiles[0]}_with_${sortedMobiles[1]}`
}

export function WebSocketProvider({ children }) {
  const { user, accessToken } = useAuth()
  const {
    activeChat,
    addMessage,
    updateMessage,
    setTypingUsers,
    setOnlineUsers,
    setMessages,
    incrementUnreadCount,
    resetUnreadCount,
     updateChat,             // ✅ Add this
  addChat,                // ✅ And this
  chats,       
  } = useChat()

  // State for chat WebSocket
  const [chatConnectionStatus, setChatConnectionStatus] = useState("disconnected")
  const wsChatRef = useRef(null)
  const chatReconnectTimeoutRef = useRef(null)
  const chatReconnectAttemptsRef = useRef(0)
  const maxReconnectAttempts = 5

  // State for message status WebSocket
  const [statusConnectionStatus, setStatusConnectionStatus] = useState("disconnected")
  const wsStatusRef = useRef(null)
  const statusReconnectTimeoutRef = useRef(null)
  const statusReconnectAttemptsRef = useRef(0)

  // State for notification WebSocket
  const [notificationConnectionStatus, setNotificationConnectionStatus] = useState("disconnected")
  const wsNotificationRef = useRef(null)
  const notificationReconnectTimeoutRef = useRef(null)
  const notificationReconnectAttemptsRef = useRef(0)

  // Replace all hardcoded URLs with these:
  // const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;
  const WS_BASE_URL = process.env.NEXT_PUBLIC_WS_BASE_URL

  // --- Chat WebSocket Connection Logic ---
  const connectChatWebSocket = useCallback(
    (chatId) => {
      if (!user || !accessToken || !chatId || wsChatRef.current?.readyState === WebSocket.OPEN) {
        console.warn("Cannot connect Chat WebSocket: Missing user, token, chatId, or already connected")
        return
      }

      try {
        const wsUrl = `${WS_BASE_URL}/ws/chat/${chatId}/?token=${accessToken}`
        console.log(`Connecting to Chat WebSocket: ${wsUrl}`)
        wsChatRef.current = new WebSocket(wsUrl)

        wsChatRef.current.onopen = () => {
          console.log(`Chat WebSocket connected to room: ${chatId}`)
          setChatConnectionStatus("connected")
          chatReconnectAttemptsRef.current = 0

          sendChatMessageInternal({ type: "authenticate", token: accessToken, user_id: user.id })
          sendChatMessageInternal({ type: "join_chat", chat_id: chatId, room_id: chatId, user_id: user.id })
        }

        wsChatRef.current.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data)
            console.log("Received Chat WebSocket message:", data)
            handleChatWebSocketMessage(data)
          } catch (error) {
            console.error("Chat WebSocket parse error:", error)
          }
        }

        wsChatRef.current.onclose = (event) => {
          console.log(`Chat WebSocket disconnected from room ${chatId}:`, event.code, event.reason)
          setChatConnectionStatus("disconnected")
          if (event.code !== 1000 && chatReconnectAttemptsRef.current < maxReconnectAttempts) {
            scheduleChatReconnect(chatId)
          }
        }

        wsChatRef.current.onerror = (error) => {
          console.error(`Chat WebSocket error for room ${chatId}:`, error)
          setChatConnectionStatus("error")
          if (wsChatRef.current) wsChatRef.current.close()
        }
      } catch (error) {
        console.error("Chat WebSocket init error:", error)
        setChatConnectionStatus("error")
        scheduleChatReconnect(chatId)
      }
    },
    [accessToken, user],
  )

  const scheduleChatReconnect = useCallback(
    (chatIdToReconnect) => {
      if (chatReconnectTimeoutRef.current) clearTimeout(chatReconnectTimeoutRef.current)

      const delay = Math.min(1000 * Math.pow(2, chatReconnectAttemptsRef.current), 30000)
      chatReconnectAttemptsRef.current += 1

      console.log(
        `Reconnecting to Chat room ${chatIdToReconnect} in ${delay}ms (Attempt ${chatReconnectAttemptsRef.current})`,
      )
      setChatConnectionStatus("reconnecting")

      chatReconnectTimeoutRef.current = setTimeout(() => {
        if (user && accessToken && chatIdToReconnect) {
          connectChatWebSocket(chatIdToReconnect)
        }
      }, delay)
    },
    [user, accessToken, connectChatWebSocket],
  )

  const disconnectChatWebSocket = useCallback(() => {
    if (chatReconnectTimeoutRef.current) clearTimeout(chatReconnectTimeoutRef.current)
    if (wsChatRef.current) {
      wsChatRef.current.close(1000, "Client disconnected")
      wsChatRef.current = null
    }
    setChatConnectionStatus("disconnected")
    chatReconnectAttemptsRef.current = 0
  }, [])

  // --- Message Status WebSocket Connection Logic ---
  const connectStatusWebSocket = useCallback(() => {
    if (!user || !accessToken || wsStatusRef.current?.readyState === WebSocket.OPEN) {
      console.warn("Cannot connect Status WebSocket: Missing user, token, or already connected")
      return
    }

    try {
      const wsUrl = `${WS_BASE_URL}/ws/message_status/?token=${accessToken}`
      console.log(`Connecting to Status WebSocket: ${wsUrl}`)
      wsStatusRef.current = new WebSocket(wsUrl)

      wsStatusRef.current.onopen = () => {
        console.log("Status WebSocket connected")
        setStatusConnectionStatus("connected")
        statusReconnectAttemptsRef.current = 0
      }

      wsStatusRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          console.log("Received Status WebSocket message:", data)
          handleStatusWebSocketMessage(data)
        } catch (error) {
          console.error("Status WebSocket parse error:", error)
        }
      }

      wsStatusRef.current.onclose = (event) => {
        console.log(`Status WebSocket disconnected:`, event.code, event.reason)
        setStatusConnectionStatus("disconnected")
        if (event.code !== 1000 && statusReconnectAttemptsRef.current < maxReconnectAttempts) {
          scheduleStatusReconnect()
        }
      }

      wsStatusRef.current.onerror = (error) => {
        console.error(`Status WebSocket error:`, error)
        setStatusConnectionStatus("error")
        if (wsStatusRef.current) wsStatusRef.current.close()
      }
    } catch (error) {
      console.error("Status WebSocket init error:", error)
      setStatusConnectionStatus("error")
      scheduleStatusReconnect()
    }
  }, [accessToken, user])

  const scheduleStatusReconnect = useCallback(() => {
    if (statusReconnectTimeoutRef.current) clearTimeout(statusReconnectTimeoutRef.current)

    const delay = Math.min(1000 * Math.pow(2, statusReconnectAttemptsRef.current), 30000)
    statusReconnectAttemptsRef.current += 1

    console.log(`Reconnecting to Status WebSocket in ${delay}ms (Attempt ${statusReconnectAttemptsRef.current})`)
    setStatusConnectionStatus("reconnecting")

    statusReconnectTimeoutRef.current = setTimeout(() => {
      if (user && accessToken) {
        connectStatusWebSocket()
      }
    }, delay)
  }, [user, accessToken, connectStatusWebSocket])

  const disconnectStatusWebSocket = useCallback(() => {
    if (statusReconnectTimeoutRef.current) clearTimeout(statusReconnectTimeoutRef.current)
    if (wsStatusRef.current) {
      wsStatusRef.current.close(1000, "Client disconnected")
      wsStatusRef.current = null
    }
    setStatusConnectionStatus("disconnected")
    statusReconnectAttemptsRef.current = 0
  }, [])

  // --- Notification WebSocket Connection Logic ---
  const connectNotificationWebSocket = useCallback(() => {
    if (!user || !accessToken || wsNotificationRef.current?.readyState === WebSocket.OPEN) {
      console.warn("Cannot connect Notification WebSocket: Missing user, token, or already connected")
      return
    }

    try {
      const wsUrl = `${WS_BASE_URL}/ws/notifications/?token=${accessToken}&user_id=${user.id}`

      console.log(`Connecting to Notification WebSocket: ${wsUrl}`)
      wsNotificationRef.current = new WebSocket(wsUrl)

      wsNotificationRef.current.onopen = () => {
        console.log("Notification WebSocket connected")
        setNotificationConnectionStatus("connected")
        notificationReconnectAttemptsRef.current = 0
      }

      wsNotificationRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          console.log("Received Notification WebSocket message:", data)
          handleNotificationWebSocketMessage(data)
        } catch (error) {
          console.error("Notification WebSocket parse error:", error)
        }
      }

      wsNotificationRef.current.onclose = (event) => {
        console.log(`Notification WebSocket disconnected:`, event.code, event.reason)
        setNotificationConnectionStatus("disconnected")
        if (event.code !== 1000 && notificationReconnectAttemptsRef.current < maxReconnectAttempts) {
          scheduleNotificationReconnect()
        }
      }

      wsNotificationRef.current.onerror = (error) => {
        console.error(`Notification WebSocket error:`, error)
        setNotificationConnectionStatus("error")
        if (wsNotificationRef.current) wsNotificationRef.current.close()
      }
    } catch (error) {
      console.error("Notification WebSocket init error:", error)
      setNotificationConnectionStatus("error")
      scheduleNotificationReconnect()
    }
  }, [accessToken, user])

  const scheduleNotificationReconnect = useCallback(() => {
    if (notificationReconnectTimeoutRef.current) clearTimeout(notificationReconnectTimeoutRef.current)

    const delay = Math.min(1000 * Math.pow(2, notificationReconnectAttemptsRef.current), 30000)
    notificationReconnectAttemptsRef.current += 1

    console.log(
      `Reconnecting to Notification WebSocket in ${delay}ms (Attempt ${notificationReconnectAttemptsRef.current})`,
    )
    setNotificationConnectionStatus("reconnecting")

    notificationReconnectTimeoutRef.current = setTimeout(() => {
      if (user && accessToken) {
        connectNotificationWebSocket()
      }
    }, delay)
  }, [user, accessToken, connectNotificationWebSocket])

  const disconnectNotificationWebSocket = useCallback(() => {
    if (notificationReconnectTimeoutRef.current) clearTimeout(notificationReconnectTimeoutRef.current)
    if (wsNotificationRef.current) {
      wsNotificationRef.current.close(1000, "Client disconnected")
      wsNotificationRef.current = null
    }
    setNotificationConnectionStatus("disconnected")
    notificationReconnectAttemptsRef.current = 0
  }, [])

  // --- General Effects for all WebSockets ---
  // Effect for Notification WebSocket (connects on auth)
  useEffect(() => {
    if (user && accessToken) {
      connectNotificationWebSocket()
    } else {
      disconnectNotificationWebSocket()
    }
    return () => {
      disconnectNotificationWebSocket()
    }
  }, [user, accessToken, connectNotificationWebSocket, disconnectNotificationWebSocket])

  // Effect for Chat and Status WebSockets (connects when active chat is set)
  useEffect(() => {
    if (user && accessToken && activeChat?.id) {
      // Connect Chat WebSocket
      disconnectChatWebSocket() // Ensure previous chat connection is closed
      connectChatWebSocket(activeChat.id)

      // Connect Status WebSocket
      disconnectStatusWebSocket() // Ensure previous status connection is closed
      connectStatusWebSocket()
    } else {
      // Disconnect both when no active chat or user logs out
      disconnectChatWebSocket()
      disconnectStatusWebSocket()
    }
    return () => {
      // Cleanup on unmount or activeChat change
      disconnectChatWebSocket()
      disconnectStatusWebSocket()
    }
  }, [
    user,
    accessToken,
    activeChat?.id,
    connectChatWebSocket,
    disconnectChatWebSocket,
    connectStatusWebSocket,
    disconnectStatusWebSocket,
  ])

  // --- Message Handlers ---
  const handleChatWebSocketMessage = useCallback(
    (data) => {
      switch (data.type) {
        case "old_messages":
          console.log("Old messages received:", data.messages)
          if (data.messages && data.messages.length > 0) {
            setMessages(data.chat_id || data.room_id, data.messages)
          }
          break
        case "receiver_info":
          console.log("Receiver info received:", data.receiver)
          break
        case "authenticate_response":
          console.log("Authentication response:", data)
          break
        case "new_message":
          console.log("New message received:", data.message)
          const isOwnNewMessage = data.message.sender?.id === user?.id
          // Add message with initial read status
          addMessage(data.chat_id || data.room_id, { ...data.message, is_read: isOwnNewMessage })

          // Increment unread count if the message is not from the current user
          // AND the chat is not currently active
          if (!isOwnNewMessage && activeChat?.id !== (data.chat_id || data.room_id)) {
            incrementUnreadCount(data.chat_id || data.room_id)
          }
          break
        case "typing":
        case "stop_typing":
          if (data.user_id !== user?.id) {
            console.log(`${data.type} event from ${data.user_name}`)
            setTypingUsers(data.chat_id || data.room_id, data.typing_users || [data.user_name])
          }
          break
        case "message_status_update":
          console.log("Ignoring message_status_update from Chat WebSocket (handled by Status WebSocket).")
          break
        default:
          console.log("Unknown Chat WebSocket message type:", data.type)
      }
    },
    [user, activeChat, addMessage, setTypingUsers, setMessages, incrementUnreadCount],
  )

  const handleStatusWebSocketMessage = useCallback(
    (data) => {
      switch (data.type) {
        case "message_status_update":
          console.log("Message status update received:", data.message_id, data.status)
          updateMessage(data.chat_id || data.room_id, {
            id: data.message_id,
            status: data.status,
            is_read: data.status === "Read", // Assuming backend sends 'Read' for read messages
          })
          break
        case "user_online":
        case "user_offline":
          console.log("Online users update:", data.online_users)
          setOnlineUsers(data.online_users || [])
          break
        default:
          console.log("Unknown Status WebSocket message type:", data.type)
      }
    },
    [updateMessage, setOnlineUsers],
  )

const handleNotificationWebSocketMessage = useCallback(
  (data) => {
    console.log("Notification received:", data)

    switch (data.type) {
    case "notification": {
  const chatId = data.last_message.chat_id

  // Update unread count
  incrementUnreadCount(chatId)

  // Get sender name from notification data
  const senderName = data.last_message.sender || "Unknown User"
  
  // Extract mobile number from chat ID for fallback
  const extractMobileFromChatId = (chatId, currentUserMobile) => {
    const match = chatId.match(/chet_currentuser_(\d+)_with_(\d+)/)
    if (!match) return "Unknown"
    const [_, m1, m2] = match
    return m1 === currentUserMobile ? m2 : m1
  }

  const otherUserMobile = extractMobileFromChatId(chatId, user?.mobile)

  // Prepare updated chat object
  const updatedChat = {
    id: chatId,
    last_message: {
      ...data.last_message,
      content: data.last_message.text,
    },
    updated_at: data.last_message.timestamp,
  }

  // Always update (even if it's already in the list)
  updateChat(updatedChat)

  // Check if chat already exists before adding
  const exists = chats.some((chat) => chat.id === chatId)
  if (!exists) {
    addChat({
      ...updatedChat,
      name: senderName, // ✅ Use sender name instead of mobile number
      participants: [
        // Add current user
        {
          id: user.id,
          name: user.name,
          mobile: user.mobile,
          profile_pic: user.profile_pic,
          is_online: user.is_online || false,
        },
        // Add sender as participant
        {
          id: null, // Backend doesn't provide sender ID in notification
          name: senderName,
          mobile: otherUserMobile,
          profile_pic: null,
          is_online: false,
        },
      ],
      is_group: false,
      avatar: null,
      messages: [],
      created_at: new Date().toISOString(),
    })
  }

  break
}


      case "new_notification":
        console.log("New notification:", data.message)
        break

      default:
        console.log("Unknown Notification WebSocket message type:", data.type)
    }
  },
  [chats, incrementUnreadCount, updateChat, addChat, user?.mobile, user],
)



  // --- Send Message Functions ---
  const sendChatMessageInternal = useCallback((msg) => {
    if (wsChatRef.current?.readyState === WebSocket.OPEN) {
      console.log("Sending message via Chat WebSocket:", msg)
      wsChatRef.current.send(JSON.stringify(msg))
      return true
    }
    console.warn("Chat WebSocket not open, cannot send message:", msg)
    return false
  }, [])

  const sendStatusMessageInternal = useCallback((msg) => {
    if (wsStatusRef.current?.readyState === WebSocket.OPEN) {
      console.log("Sending message via Status WebSocket:", msg)
      wsStatusRef.current.send(JSON.stringify(msg))
      return true
    }
    console.warn("Status WebSocket not open, cannot send message:", msg)
    return false
  }, [])

  const sendNotificationMessageInternal = useCallback((msg) => {
    if (wsNotificationRef.current?.readyState === WebSocket.OPEN) {
      console.log("Sending message via Notification WebSocket:", msg)
      wsNotificationRef.current.send(JSON.stringify(msg))
      return true
    }
    console.warn("Notification WebSocket not open, cannot send message:", msg)
    return false
  }, [])

  const sendChatMessage = useCallback(
    (content, messageType = "text") => {
      if (!activeChat?.id || !user) {
        console.warn("Cannot send message: Missing activeChat or user")
        return false
      }
      return sendChatMessageInternal({
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
    [sendChatMessageInternal, user, activeChat],
  )

  const sendTyping = useCallback(() => {
    if (!activeChat?.id || !user) {
      console.warn("Cannot send typing: Missing activeChat or user")
      return false
    }
    return sendChatMessageInternal({
      type: "typing",
      chat_id: activeChat.id,
      room_id: activeChat.id,
      user_id: user.id,
      user_name: user.name,
    })
  }, [sendChatMessageInternal, user, activeChat])

  const sendStopTyping = useCallback(() => {
    if (!activeChat?.id || !user) {
      console.warn("Cannot send stop_typing: Missing activeChat or user")
      return false
    }
    return sendChatMessageInternal({
      type: "stop_typing",
      chat_id: activeChat.id,
      room_id: activeChat.id,
      user_id: user.id,
      user_name: user.name,
    })
  }, [sendChatMessageInternal, user, activeChat])

  const markMessageAsRead = useCallback(
    (messageId) => {
      if (!activeChat?.id || !user) {
        console.warn("Cannot mark message as read: Missing activeChat or user")
        return false
      }
      return sendStatusMessageInternal({
        type: "mark_read",
        chat_id: activeChat.id,
        message_id: messageId,
        user_id: user.id,
      })
    },
    [sendStatusMessageInternal, user, activeChat],
  )

  const joinChat = useCallback(
    (chatId) => {
      if (!user) {
        console.warn("Cannot join chat: Missing user")
        return false
      }
      return sendChatMessageInternal({
        type: "join_chat",
        chat_id: chatId,
        room_id: chatId,
        user_id: user.id,
      })
    },
    [sendChatMessageInternal, user],
  )

  const leaveChat = useCallback(
    (chatId) => {
      if (!user) {
        console.warn("Cannot leave chat: Missing user")
        return false
      }
      return sendChatMessageInternal({
        type: "leave_chat",
        chat_id: chatId,
        room_id: chatId,
        user_id: user.id,
      })
    },
    [sendChatMessageInternal, user],
  )

  const value = {
    chatConnectionStatus,
    statusConnectionStatus,
    notificationConnectionStatus,
    sendMessage: sendChatMessageInternal,
    sendChatMessage,
    sendTyping,
    sendStopTyping,
    markMessageAsRead,
    joinChat,
    leaveChat,
    reconnect: () => {
      if (activeChat?.id) connectChatWebSocket(activeChat.id)
      connectStatusWebSocket()
      connectNotificationWebSocket()
    },
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