"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useAuth } from "../contexts/auth-context"

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL


export function useUsers() {
  const { accessToken, user } = useAuth()

  return useQuery({
    queryKey: ["users"],
    queryFn: async () => {
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
    refetchInterval: 30000,
  })
}

export function useOnlineUsers() {
  const { accessToken, user } = useAuth()

  return useQuery({
    queryKey: ["users", "online"],
    queryFn: async () => {
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
        return data.data.filter((user) => user.is_online !== false)
      } else {
        throw new Error(data.message || "Failed to fetch online users")
      }
    },
    enabled: !!accessToken && !!user && !!user.id,
    refetchInterval: 10000,
  })
}

export function useAddContact() {
  const { accessToken, user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ mobile_no, name }) => {
      const response = await fetch(`${API_BASE}/user-add-contact/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          userId: user.id,
          mobile_no,
          name,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to add contact")
      }

      const data = await response.json()

      if (data.status) {
        return data.data
      } else {
        throw new Error(data.message || "Failed to add contact")
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] })
    },
    onError: (error) => {
      console.error("Error adding contact:", error.message)
    },
  })
}

export function useUpdateContactStatus() {
  const { accessToken, user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ contactId, status }) => {
      const response = await fetch(`${API_BASE}/user-add-contact/`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          userId: user.id,
          contactId: contactId, // Include contactId in the body
          status: status,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to update contact status")
      }

      const data = await response.json()

      if (data.status) {
        return data.data
      } else {
        throw new Error(data.message || "Failed to update contact status")
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] })
    },
    onError: (error) => {
      console.error("Error updating contact status:", error.message)
    },
  })
}

// Existing hooks remain unchanged
export function useChats() {
  const { accessToken } = useAuth()

  return useQuery({
    queryKey: ["chats"],
    queryFn: async () => {
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
      return { success: true }
    },
  })
}
