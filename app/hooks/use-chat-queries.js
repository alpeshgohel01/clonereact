"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useAuth } from "../contexts/auth-context"

// FIX: Use the specific IP address and port for the API base URL
const API_BASE = `http://192.168.17.136:8000`

export function useUsers() {
  const { accessToken, user } = useAuth()

  return useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      // USE YOUR DJANGO API: POST http://192.168.17.136:8000/user-list/
      const response = await fetch(`${API_BASE}/user-list/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          userId: user.id,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to fetch users")
      }

      const data = await response.json()

      if (data.status) {
        return data.data
      } else {
        throw new Error(data.message || "Failed to fetch users")
      }
    },
    enabled: !!accessToken && !!user && !!user.id,
    refetchInterval: 30000, // Refetch every 30 seconds
  })
}

export function useOnlineUsers() {
  const { accessToken, user } = useAuth()

  return useQuery({
    queryKey: ["users", "online"],
    queryFn: async () => {
      // USE YOUR DJANGO API: POST http://192.168.17.136:8000/user-list/
      const response = await fetch(`${API_BASE}/user-list/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          userId: user.id,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to fetch online users")
      }

      const data = await response.json()

      if (data.status) {
        // Filter online users or return all users for now
        return data.data.filter((user) => user.is_online !== false)
      } else {
        throw new Error(data.message || "Failed to fetch online users")
      }
    },
    enabled: !!accessToken && !!user && !!user.id,
    refetchInterval: 10000, // Refetch every 10 seconds
  })
}

// Mock functions for chat functionality - you'll need to implement these APIs in Django
export function useChats() {
  const { accessToken } = useAuth()

  return useQuery({
    queryKey: ["chats"],
    queryFn: async () => {
      // This will be handled via WebSocket for now
      // Return empty array until you implement chat list API
      return []
    },
    enabled: !!accessToken,
  })
}

export function useChatMessages(chatId) {
  const { accessToken } = useAuth()

  return useQuery({
    queryKey: ["messages", chatId],
    queryFn: async () => {
      // This will be handled via WebSocket for now
      // Return empty array until you implement messages API
      return []
    },
    enabled: !!accessToken && !!chatId,
  })
}

export function useCreateChat() {
  const { accessToken } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (chatData) => {
      // This will be handled via WebSocket for now
      // Mock response until you implement create chat API
      return {
        id: Date.now(),
        name: chatData.name || "New Chat",
        participants: chatData.participants || [],
        is_group: chatData.is_group || false,
        created_at: new Date().toISOString(),
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chats"] })
    },
  })
}

export function useSendMessage() {
  const { accessToken } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ chatId, content, messageType = "text" }) => {
      // This will be handled via WebSocket for now
      // Mock response until you implement send message API
      return {
        id: Date.now(),
        content,
        message_type: messageType,
        timestamp: new Date().toISOString(),
      }
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["messages", variables.chatId] })
      queryClient.invalidateQueries({ queryKey: ["chats"] })
    },
  })
}

export function useMarkMessageRead() {
  const { accessToken } = useAuth()

  return useMutation({
    mutationFn: async (messageId) => {
      // This will be handled via WebSocket for now
      return { success: true }
    },
  })
}
