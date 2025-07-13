"use client"

import { createContext, useContext, useReducer } from "react"

const ChatContext = createContext()

const chatReducer = (state, action) => {
  switch (action.type) {
    case "SET_ACTIVE_CHAT":
      return { ...state, activeChat: action.payload }
    case "SET_CHATS":
      return { ...state, chats: action.payload }
    case "ADD_CHAT":
      return { ...state, chats: [action.payload, ...state.chats] }
    case "UPDATE_CHAT":
      return {
        ...state,
        chats: state.chats.map((chat) => (chat.id === action.payload.id ? { ...chat, ...action.payload } : chat)),
      }
    case "SET_MESSAGES":
      return {
        ...state,
        messages: {
          ...state.messages,
          [action.payload.chatId]: action.payload.messages,
        },
      }
    case "ADD_MESSAGE":
      const { chatId, message } = action.payload
      return {
        ...state,
        messages: {
          ...state.messages,
          [chatId]: [...(state.messages[chatId] || []), message],
        },
      }
    case "UPDATE_MESSAGE":
      return {
        ...state,
        messages: {
          ...state.messages,
          [action.payload.chatId]:
            state.messages[action.payload.chatId]?.map((msg) =>
              msg.id === action.payload.message.id ? { ...msg, ...action.payload.message } : msg,
            ) || [],
        },
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

    // Update chat's last message
    updateChat({
      id: chatId,
      last_message: message,
      updated_at: message.timestamp,
    })
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
