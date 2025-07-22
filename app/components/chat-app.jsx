// chat-app.jsx
"use client"

import { useState, useEffect, useMemo } from "react"
import { useAuth } from "../contexts/auth-context"
import { useChat } from "../contexts/chat-context"
import { useUsers, useOnlineUsers } from "../hooks/use-chat-queries"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { LogOut, Search, Plus, Users, MessageCircle, Sun, Moon, UserCircle, Phone } from "lucide-react"
import ChatRoom from "./chat-room"
import CreateChatModal from "./create-chat-modal"
import UserProfileModal from "./user-profile-modal"
import { generatePrivateChatId } from "../contexts/websocket-context"
import { useTheme } from "next-themes"

export default function ChatApp() {
  const { user, logout } = useAuth()
  const { activeChat, setActiveChat, chats, addChat, unreadCounts, resetUnreadCount } = useChat()
  const [searchTerm, setSearchTerm] = useState("")
  const [showCreateChat, setShowCreateChat] = useState(false)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const { theme, setTheme } = useTheme()

  // React Query hooks
  const { data: users = [], isLoading: usersLoading, error: usersError } = useUsers()
  const { data: onlineUsers = [] } = useOnlineUsers()

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  // Sort chats by updated_at to bring chats with new messages to the top
  const sortedChats = useMemo(() => {
    return [...chats].sort((a, b) => {
      const timeA = a.updated_at ? new Date(a.updated_at).getTime() : 0
      const timeB = b.updated_at ? new Date(b.updated_at).getTime() : 0
      return timeB - timeA
    })
  }, [chats])

  // Memoize filtered data to prevent unnecessary re-renders
  const filteredChats = useMemo(() => {
    return sortedChats.filter(
      (chat) =>
        chat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        chat.participants?.some((p) => p.name?.toLowerCase().includes(searchTerm.toLowerCase())),
    )
  }, [sortedChats, searchTerm])

  const filteredUsers = useMemo(() => {
    return users.filter(
      (userItem) =>
        userItem.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        userItem.contact_mobile.includes(searchTerm),
    ).filter((userItem) => userItem.status === "Accepted" && userItem.contact_id !== user.id)
  }, [users, searchTerm, user.id])

  const handleChatSelect = (chat) => {
    setActiveChat(chat)
    resetUnreadCount(chat.id)
  }

  const handleUserSelect = (selectedUser) => {
    if (!user?.mobile || !selectedUser?.contact_mobile) {
      console.error("Cannot generate chat ID: User or selected user mobile number is missing.", {
        userMobile: user?.mobile,
        selectedUserMobile: selectedUser?.contact_mobile,
      })
      return
    }

    const newChatId = generatePrivateChatId(user.mobile, selectedUser.contact_mobile)
    console.log("Generated Chat ID:", newChatId)

    const existingChat = chats.find((chat) => chat.id === newChatId)

    if (existingChat) {
      setActiveChat(existingChat)
    } else {
      const newChat = {
        id: newChatId,
        name: selectedUser.name,
        participants: [
          user,
          {
            id: selectedUser.contact_id,
            name: selectedUser.name,
            mobile: selectedUser.contact_mobile,
            profile_pic: selectedUser.contact_profile_pic,
            is_online: selectedUser.is_online || false,
          },
        ],
        is_group: false,
        avatar: selectedUser.contact_profile_pic,
        messages: [],
        created_at: new Date().toISOString(),
      }
      addChat(newChat)
      setActiveChat(newChat)
    }
  }

  const handleCreateChat = (newChat) => {
    setActiveChat(newChat)
    setShowCreateChat(false)
  }

  const formatLastMessage = (message) => {
    if (!message) return "No messages yet"
    return message.content?.length > 30 ? `${message.content.substring(0, 30)}...` : message.content
  }

  const formatTime = (timestamp) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = (now - date) / (1000 * 60 * 60)

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    } else {
      return date.toLocaleDateString()
    }
  }

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-50">
      {/* Sidebar */}
      <div
        className={`${
          isMobile && activeChat ? "hidden" : "flex"
        } flex-col w-full md:w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 shadow-lg`}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <Avatar className="cursor-pointer" onClick={() => setShowProfileModal(true)}>
                <AvatarImage src={user.profile_pic || "/placeholder.svg"} />
                <AvatarFallback>{user.name.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <h2 className="font-semibold">{user.name}</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Online</p>
              </div>
            </div>
            <div className="flex space-x-2">
              <Button variant="ghost" size="sm" onClick={() => setShowProfileModal(true)}>
                <UserCircle className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
                {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
              <Button variant="ghost" size="sm" onClick={logout}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search chats or contacts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-50"
            />
          </div>
        </div>

        {/* Combined Chats and Contacts List */}
        <div className="flex-1 overflow-hidden">
          <div className="flex flex-col h-full">
            <div className="p-4 flex items-center justify-between border-b border-gray-200 dark:border-gray-700">
              <h3 className="font-medium">Chats & Contacts</h3>
              <Button
                size="sm"
                onClick={() => setShowCreateChat(true)}
                className="bg-emerald-500 hover:bg-emerald-600 text-white"
              >
                <Plus className="h-4 w-4 mr-1" />
                New
              </Button>
            </div>

            <ScrollArea className="flex-1">
              <div className="px-2 py-2">
                {/* Chats Section */}
                {filteredChats.length > 0 && (
                  <div className="p-4">
                    <h4 className="text-sm font-medium text-gray-500 mb-3">Chats ({filteredChats.length})</h4>
                    {filteredChats.map((chat) => (
                      <Card
                        key={chat.id}
                        className={`mb-2 cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-700 ${
                          activeChat?.id === chat.id
                            ? "bg-emerald-50 dark:bg-emerald-900 border-emerald-200 dark:border-emerald-700"
                            : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                        }`}
                        onClick={() => handleChatSelect(chat)}
                      >
                        <CardContent  className="p-3">
                          <div className="flex items-center space-x-3">
                            <div className="relative">
                              <Avatar>
                                <AvatarImage src={chat.avatar || "/placeholder.svg"} />
                                <AvatarFallback>
                                  {chat.is_group ? <Users className="h-4 w-4" /> : chat.name.charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              {(unreadCounts[chat.id] || 0) > 0 && (
                                <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs bg-emerald-500 text-white">
                                  {unreadCounts[chat.id]}
                                </Badge>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <h4 className="font-medium truncate">{chat.name}</h4>
                                {chat.last_message && (
                                  <span className="text-xs text-gray-500 dark:text-gray-400">
                                    {formatTime(chat.last_message.timestamp)}
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                {formatLastMessage(chat.last_message)}
                              </p>
                              {chat.is_group && (
                                <p className="text-xs text-gray-400 dark:text-gray-500">
                                  {chat.participants?.length} members
                                </p>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                {/* Contacts Section */}
                {filteredUsers.length > 0 && (
                  <div className="p-4">
                    <h4 className="text-sm font-medium text-gray-500 mb-3">Contacts ({filteredUsers.length})</h4>
                    <div className="space-y-2">
                      {filteredUsers.map((userItem) => (
                        <div
                          key={userItem.id}
                          className="flex items-center space-x-3 p-2 rounded-md hover:bg-gray-50 cursor-pointer"
                          onClick={() => handleUserSelect(userItem)}
                        >
                          <div className="relative">
                            <Avatar className="w-10 h-10">
                              <AvatarImage src={userItem.contact_profile_pic || "/placeholder.svg"} />
                              <AvatarFallback>{userItem.name.charAt(0).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            {userItem.is_online && (
                              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium">{userItem.name}</p>
                            <p className="text-xs text-gray-500 flex items-center">
                              <Phone className="h-3 w-3 mr-1" />
                              {userItem.contact_mobile}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {(filteredChats.length === 0 && filteredUsers.length === 0) && (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <MessageCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No chats or contacts found</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-gray-50 dark:bg-gray-900">
        {activeChat ? (
          <ChatRoom onBack={isMobile ? () => setActiveChat(null) : null} />
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
            <div className="text-center">
              <MessageCircle className="h-16 w-16 mx-auto mb-4 text-gray-400 dark:text-gray-600" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-50 mb-2">Welcome to ChatApp</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">Select a contact or chat to start messaging</p>
              <Button onClick={() => setShowCreateChat(true)} className="bg-emerald-500 hover:bg-emerald-600 text-white">
                <Users className="h-4 w-4 mr-2" />
                Create New Chat
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showCreateChat && <CreateChatModal onClose={() => setShowCreateChat(false)} onCreateChat={handleCreateChat} />}
      {showProfileModal && <UserProfileModal isOpen={showProfileModal} onClose={() => setShowProfileModal(false)} />}
    </div>
  )
}