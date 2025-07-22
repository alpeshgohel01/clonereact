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
        return data.contacts
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
        return data.contacts.filter((user) => user.is_online !== false)
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

export function useChats() {
  const { accessToken, user } = useAuth()

  return useQuery({
    queryKey: ["chats"],
    queryFn: async () => {
      if (!user?.id) {
        console.warn("User ID is not available for fetching chats.")
        return []
      }
      try {
        // Simulate fetching chats from a backend endpoint
        const response = await fetch(`${API_BASE}/user-chat-list/`, {
          method: "POST", // Assuming POST based on other queries
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            userId: user.id, // Assuming backend expects userId
          }),
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: "Unknown error" }))
          console.error(`Failed to fetch chats: HTTP Status ${response.status}`, errorData)
          throw new Error(errorData.message || `Failed to fetch chats: HTTP Status ${response.status}`)
        }

        const data = await response.json()

        if (data.status) {
          // Assuming data.data is an array of chat objects with full details
          // Example structure for a chat object:
          // {
          //   id: "chet_currentuser_8401019172_with_9978487625",
          //   name: "Sagar",
          //   participants: [
          //     { id: "user1_id", name: "Alpesh Gohel", mobile: "8401019172", profile_pic: "/placeholder.svg?text=AG", is_online: true },
          //     { id: "user2_id", name: "Sagar", mobile: "9978487625", profile_pic: "/placeholder.svg?text=S", is_online: true },
          //   ],
          //   is_group: false,
          //   avatar: "/placeholder.svg?text=S",
          //   last_message: {
          //     id: 176,
          //     chat_id: "chet_currentuser_8401019172_with_9978487625",
          //     content: "hjjffjf",
          //     timestamp: "2025-07-18T19:34:58.307989+00:00",
          //     sender: { id: "user2_id", name: "Sagar", profile_pic: "/placeholder.svg?text=S" },
          //   },
          //   updated_at: "2025-07-18T19:34:58.307989+00:00",
          //   unread_count: 0,
          // }
          return data.data
        } else {
          console.error("Backend reported error fetching chats:", data.message)
          throw new Error(data.message || "Failed to fetch chats")
        }
      } catch (error) {
        console.error("Error fetching chats:", error)
        // Return an empty array or re-throw based on desired error handling
        throw error
      }
    },
    enabled: !!accessToken && !!user?.id,
    refetchInterval: 15000, // Refetch chats periodically to get updates
  })
}

export function useChatMessages(chatId) {
  const { accessToken } = useAuth()

  return useQuery({
    queryKey: ["messages", chatId],
    queryFn: async () => {
      // This should fetch messages for the given chatId from your backend
      // For now, returning an empty array as per previous implementation
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
      // This should ideally call your backend to create a chat
      // For now, it's a mock creation
      return {
        id: Date.now(),
        name: chatData.name || "New Chat",
        participants: chatData.participants || [],
        is_group: chatData.is_group || false,
        created_at: new Date().toISOString(),
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chats"] }) // Invalidate chats to re-fetch the new chat
    },
  })
}

export function useSendMessage() {
  const { accessToken } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ chatId, content, messageType = "text" }) => {
      // This should ideally send the message to your backend
      return {
        id: Date.now(),
        content,
        message_type: messageType,
        timestamp: new Date().toISOString(),
      }
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["messages", variables.chatId] })
      queryClient.invalidateQueries({ queryKey: ["chats"] }) // Invalidate chats to update last message
    },
  })
}

export function useMarkMessageRead() {
  const { accessToken } = useAuth()

  return useMutation({
    mutationFn: async (messageId) => {
      // This should ideally mark the message as read on your backend
      return { success: true }
    },
  })
}
