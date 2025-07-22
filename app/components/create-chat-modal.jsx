"use client"

import { useState, useEffect } from "react"
import { useUsers, useCreateChat } from "../hooks/use-chat-queries"
import { useChat } from "../contexts/chat-context"
import { useAuth } from "../contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Search, X, Users, MessageCircle } from "lucide-react"

export default function CreateChatModal({ onClose, onCreateChat }) {
  const { user } = useAuth()
  const { addChat } = useChat()
  const { data: users = [], isLoading: usersLoading } = useUsers()
  const createChatMutation = useCreateChat()

  const [selectedUsers, setSelectedUsers] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [chatName, setChatName] = useState("")
  const [isGroup, setIsGroup] = useState(false)

  useEffect(() => {
    setIsGroup(selectedUsers.length > 1)
  }, [selectedUsers])

  const filteredUsers = users.filter(
    (userItem) =>
      userItem.name.toLowerCase().includes(searchTerm.toLowerCase()) || userItem.mobile.includes(searchTerm),
  )

  const handleUserSelect = (selectedUser) => {
    setSelectedUsers((prev) => {
      const isSelected = prev.find((u) => u.mobile === selectedUser.mobile)
      if (isSelected) {
        return prev.filter((u) => u.mobile !== selectedUser.mobile)
      } else {
        return [...prev, selectedUser]
      }
    })
  }

  const handleCreateChat = async () => {
    if (selectedUsers.length === 0) return

    const chatData = {
      participants: selectedUsers,
      is_group: isGroup,
      name: isGroup ? chatName : selectedUsers[0].name,
    }

    try {
      const newChat = await createChatMutation.mutateAsync(chatData)

      // Create chat object with proper structure
      const chatObject = {
        id: newChat.id,
        name: isGroup ? chatName : selectedUsers[0].name,
        participants: [user, ...selectedUsers],
        is_group: isGroup,
        avatar: isGroup ? null : selectedUsers[0].profile_pic,
        messages: [],
        created_at: newChat.created_at,
        unread_count: 0, // New chats start with 0 unread
      }

      addChat(chatObject)
      onCreateChat(chatObject)
    } catch (error) {
      console.error("Failed to create chat:", error)
    }
  }

  const removeSelectedUser = (mobile) => {
    setSelectedUsers((prev) => prev.filter((u) => u.mobile !== mobile))
  }

  if (usersLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md max-h-[80vh] flex flex-col">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <MessageCircle className="h-5 w-5 mr-2" />
              New Chat
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <CardDescription>Select users to start a conversation</CardDescription>
        </CardHeader>

        <CardContent className="flex-1 overflow-hidden">
          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Selected Users */}
          {selectedUsers.length > 0 && (
            <div className="mb-4">
              <Label className="text-sm font-medium mb-2 block">Selected ({selectedUsers.length})</Label>
              <div className="flex flex-wrap gap-2">
                {selectedUsers.map((selectedUser) => (
                  <Badge key={selectedUser.mobile} variant="secondary" className="flex items-center space-x-1">
                    <span>{selectedUser.name}</span>
                    <button
                      onClick={() => removeSelectedUser(selectedUser.mobile)}
                      className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Group Chat Name */}
          {isGroup && (
            <div className="mb-4">
              <Label htmlFor="chat-name" className="text-sm font-medium mb-2 block">
                Group Name
              </Label>
              <Input
                id="chat-name"
                placeholder="Enter group name..."
                value={chatName}
                onChange={(e) => setChatName(e.target.value)}
              />
            </div>
          )}

          {/* User List */}
          <div className="mb-4">
            <Label className="text-sm font-medium mb-2 block">Users</Label>
            <ScrollArea className="h-48 border rounded-md">
              <div className="p-2">
                {filteredUsers.map((userItem) => (
                  <div
                    key={userItem.mobile}
                    className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-md cursor-pointer"
                    onClick={() => handleUserSelect(userItem)}
                  >
                    <Checkbox
                      checked={selectedUsers.some((u) => u.mobile === userItem.mobile)}
                      onChange={() => handleUserSelect(userItem)}
                    />
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={userItem.profile_pic || "/placeholder.svg"} />
                      <AvatarFallback className="text-xs">{userItem.name.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{userItem.name}</p>
                      <p className="text-xs text-gray-500">{userItem.mobile}</p>
                    </div>
                    {/* Removed the online status indicator */}
                  </div>
                ))}

                {filteredUsers.length === 0 && (
                  <div className="text-center py-4 text-gray-500">
                    <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No users found</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </CardContent>

        <CardFooter className="flex space-x-2">
          <Button variant="outline" onClick={onClose} className="flex-1 bg-transparent">
            Cancel
          </Button>
          <Button
            onClick={handleCreateChat}
            disabled={selectedUsers.length === 0 || createChatMutation.isPending || (isGroup && !chatName.trim())}
            className="flex-1"
          >
            {createChatMutation.isPending ? "Creating..." : `Create ${isGroup ? "Group" : "Chat"}`}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
