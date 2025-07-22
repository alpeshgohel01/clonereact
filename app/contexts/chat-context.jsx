"use client"

import { createContext, useContext, useReducer } from "react"

const ChatContext = createContext()

const chatReducer = (state, action) => {
  switch (action.type) {
    case "SET_ACTIVE_CHAT":
      return { ...state, activeChat: action.payload }
    case "SET_CHATS":
      return { ...state, chats: action.payload }
   case "ADD_CHAT": {
  const exists = state.chats.some((chat) => chat.id === action.payload.id)
  if (exists) return state // Don't add again
  return { ...state, chats: [action.payload, ...state.chats] }
}

    case "UPDATE_CHAT":
      return {
        ...state,
        chats: state.chats.map((chat) => (chat.id === action.payload.id ? { ...chat, ...action.payload } : chat)),
      }
    case "SET_MESSAGES":
      // Sort messages by timestamp to ensure proper order
      const sortedMessages = action.payload.messages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
      return {
        ...state,
        messages: {
          ...state.messages,
          [action.payload.chatId]: sortedMessages,
        },
      }
    case "ADD_MESSAGE":
      const { chatId, message } = action.payload
      const updatedMessages = {
        ...state.messages,
        [chatId]: [...(state.messages[chatId] || []), message],
      }

      // Update chat's last message
      const updatedChatsForMessage = state.chats.map((chat) => {
        if (chat.id === chatId) {
          return {
            ...chat,
            last_message: message,
            updated_at: message.timestamp,
          }
        }
        return chat
      })

      return {
        ...state,
        messages: updatedMessages,
        chats: updatedChatsForMessage,
      }
    case "UPDATE_MESSAGE":
      const updatedMessagesForUpdate = {
        ...state.messages,
        [action.payload.chatId]:
          state.messages[action.payload.chatId]?.map((msg) =>
            msg.id === action.payload.message.id ? { ...msg, ...action.payload.message } : msg,
          ) || [],
      }

      // Also update the chat's last message if the updated message is the last one
      const updatedChatsForUpdate = state.chats.map((chat) => {
        if (chat.id === action.payload.chatId) {
          const lastMessage = updatedMessagesForUpdate[action.payload.chatId]?.slice(-1)[0]
          if (lastMessage && lastMessage.id === action.payload.message.id) {
            return {
              ...chat,
              last_message: lastMessage,
            }
          }
        }
        return chat
      })
      return {
        ...state,
        messages: updatedMessagesForUpdate,
        chats: updatedChatsForUpdate,
      }
    case "SET_TYPING_USERS":
      return {
        ...state,
        typingUsers: {
          ...state.typingUsers,
          [action.payload.chatId]: action.payload.users,
        },
      }
    case "SET_ONLINE_USERS":
      return { ...state, onlineUsers: action.payload }
    case "INCREMENT_UNREAD_COUNT":
      return {
        ...state,
        unreadCounts: {
          ...state.unreadCounts,
          [action.payload.chatId]: (state.unreadCounts[action.payload.chatId] || 0) + 1,
        },
      }
    case "RESET_UNREAD_COUNT":
      return {
        ...state,
        unreadCounts: {
          ...state.unreadCounts,
          [action.payload.chatId]: 0,
        },
      }
    case "SET_UNREAD_COUNT": // For initial load or backend sync
      return {
        ...state,
        unreadCounts: {
          ...state.unreadCounts,
          [action.payload.chatId]: action.payload.count,
        },
      }
    default:
      return state
  }
}

const initialState = {
  activeChat: null,
  chats: [],
  messages: {}, // { chatId: [messages] }
  typingUsers: {}, // { chatId: [usernames] }
  onlineUsers: [],
  unreadCounts: {}, // { chatId: count }
}

export function ChatProvider({ children }) {
  const [state, dispatch] = useReducer(chatReducer, initialState)

  const setActiveChat = (chat) => {
    dispatch({ type: "SET_ACTIVE_CHAT", payload: chat })
  }

  const setChats = (chats) => {
    dispatch({ type: "SET_CHATS", payload: chats })
  }

  const addChat = (chat) => {
    dispatch({ type: "ADD_CHAT", payload: chat })
  }

  const updateChat = (chat) => {
    dispatch({ type: "UPDATE_CHAT", payload: chat })
  }

  const setMessages = (chatId, messages) => {
    dispatch({ type: "SET_MESSAGES", payload: { chatId, messages } })
  }

  const addMessage = (chatId, message) => {
    dispatch({ type: "ADD_MESSAGE", payload: { chatId, message } })

    // Update chat's last message is handled in the reducer now
  }

  const updateMessage = (chatId, message) => {
    dispatch({ type: "UPDATE_MESSAGE", payload: { chatId, message } })
  }

  const setTypingUsers = (chatId, users) => {
    dispatch({ type: "SET_TYPING_USERS", payload: { chatId, users } })
  }

  const setOnlineUsers = (users) => {
    dispatch({ type: "SET_ONLINE_USERS", payload: users })
  }

  const incrementUnreadCount = (chatId) => {
    dispatch({ type: "INCREMENT_UNREAD_COUNT", payload: { chatId } })
  }

  const resetUnreadCount = (chatId) => {
    dispatch({ type: "RESET_UNREAD_COUNT", payload: { chatId } })
  }

  const setUnreadCount = (chatId, count) => {
    dispatch({ type: "SET_UNREAD_COUNT", payload: { chatId, count } })
  }

  const value = {
    ...state,
    setActiveChat,
    setChats,
    addChat,
    updateChat,
    setMessages,
    addMessage,
    updateMessage,
    setTypingUsers,
    setOnlineUsers,
    incrementUnreadCount,
    resetUnreadCount,
    setUnreadCount,
  }

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>
}

export const useChat = () => {
  const context = useContext(ChatContext)
  if (!context) {
    throw new Error("useChat must be used within a ChatProvider")
  }
  return context
}
