"use client"

import { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Search, Users, UserPlus, Check, X, Phone } from "lucide-react"
import { useUsers, useAddContact, useUpdateContactStatus } from "../hooks/use-chat-queries"
import { useAuth } from "../contexts/auth-context"

export default function UserList({ onUserSelect }) {
  const { user } = useAuth()
  const [searchTerm, setSearchTerm] = useState("")
  const [showAddContact, setShowAddContact] = useState(false)
  const [newContactMobile, setNewContactMobile] = useState("")
  const [newContactName, setNewContactName] = useState("")
  const { data: users = [], isLoading, error, refetch } = useUsers()
  const addContactMutation = useAddContact()
  const updateContactStatusMutation = useUpdateContactStatus()

  const filteredUsers = users.filter(
    (userItem) =>
      userItem.name.toLowerCase().includes(searchTerm.toLowerCase()) || userItem.contact_mobile.includes(searchTerm),
  )

  const acceptedUsers = filteredUsers.filter((userItem) => userItem.status === "Accepted")
  const pendingUsers = filteredUsers.filter((userItem) => userItem.status === "Pending")
  const blockedUsers = filteredUsers.filter((userItem) => userItem.status === "Blocked")

  const handleAddNewContact = async () => {
    if (!newContactMobile.trim() || !newContactName.trim()) {
      alert("Please enter both mobile number and name")
      return
    }

    try {
      await addContactMutation.mutateAsync({
        mobile_no: newContactMobile,
        name: newContactName,
      })
      setNewContactMobile("")
      setNewContactName("")
      setShowAddContact(false)
      console.log("Contact added successfully")
    } catch (error) {
      console.error("Failed to add contact:", error)
      alert("Failed to add contact. Please try again.")
    }
  }

  const handleAcceptContact = async (contactUser) => {
    try {
      await updateContactStatusMutation.mutateAsync({
        contactId: contactUser.id,
        status: "Accepted",
      })
      console.log("Contact accepted successfully")
    } catch (error) {
      console.error("Failed to accept contact:", error)
      alert("Failed to accept contact. Please try again.")
    }
  }

  const handleBlockContact = async (contactUser) => {
    try {
      await updateContactStatusMutation.mutateAsync({
        contactId: contactUser.id,
        status: "Blocked",
      })
      console.log("Contact blocked successfully")
    } catch (error) {
      console.error("Failed to block contact:", error)
      alert("Failed to block contact. Please try again.")
    }
  }

  const handleUserClick = (userItem) => {
    if (userItem.status === "Accepted" && onUserSelect) {
      // Create a user object compatible with the chat system
      const chatUser = {
        id: userItem.contact_id,
        name: userItem.name,
        mobile: userItem.contact_mobile,
        profile_pic: userItem.contact_profile_pic,
        is_online: userItem.is_online || false,
      }
      onUserSelect(chatUser)
    }
  }

  const renderUserActions = (userItem) => {
    if (userItem.status === "Pending") {
      return (
        <div className="flex space-x-1">
          <Button
            size="sm"
            variant="outline"
            className="text-green-600 hover:text-green-700 bg-transparent"
            onClick={(e) => {
              e.stopPropagation()
              handleAcceptContact(userItem)
            }}
            disabled={updateContactStatusMutation.isLoading}
          >
            <Check className="h-3 w-3" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="text-red-600 hover:text-red-700 bg-transparent"
            onClick={(e) => {
              e.stopPropagation()
              handleBlockContact(userItem)
            }}
            disabled={updateContactStatusMutation.isLoading}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )
    }
    return null
  }

  const renderUserSection = (title, usersList, showActions = false) => {
    if (usersList.length === 0) return null

    return (
      <div className="p-4">
        <h4 className="text-sm font-medium text-gray-500 mb-3">
          {title} ({usersList.length})
        </h4>
        <div className="space-y-2">
          {usersList.map((userItem) => (
            <div
              key={userItem.id}
              className={`flex items-center space-x-3 p-2 rounded-md ${
                userItem.status === "Accepted"
                  ? "hover:bg-gray-50 cursor-pointer"
                  : userItem.status === "Pending"
                    ? "bg-yellow-50 border border-yellow-200"
                    : "bg-red-50 border border-red-200 opacity-60"
              }`}
              onClick={() => handleUserClick(userItem)}
            >
              <div className="relative">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={userItem.contact_profile_pic || "/placeholder.svg"} />
                  <AvatarFallback>{userItem.name.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                {userItem.status === "Accepted" && userItem.is_online && (
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
              <div className="flex items-center space-x-2">
                <Badge
                  variant={
                    userItem.status === "Accepted"
                      ? "secondary"
                      : userItem.status === "Pending"
                        ? "outline"
                        : "destructive"
                  }
                  className="text-xs"
                >
                  {userItem.status}
                </Badge>
                {showActions && renderUserActions(userItem)}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <Users className="h-5 w-5 mr-2" />
            Contacts ({users.length})
          </div>
          <Dialog open={showAddContact} onOpenChange={setShowAddContact}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-emerald-500 hover:bg-emerald-600 text-white">
                <UserPlus className="h-4 w-4 mr-1" />
                Add
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Contact</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Mobile Number</label>
                  <Input
                    type="tel"
                    placeholder="Enter mobile number"
                    value={newContactMobile}
                    onChange={(e) => setNewContactMobile(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Name</label>
                  <Input
                    type="text"
                    placeholder="Enter contact name"
                    value={newContactName}
                    onChange={(e) => setNewContactName(e.target.value)}
                  />
                </div>
                <div className="flex space-x-2">
                  <Button
                    onClick={handleAddNewContact}
                    disabled={addContactMutation.isLoading}
                    className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white"
                  >
                    {addContactMutation.isLoading ? "Adding..." : "Add Contact"}
                  </Button>
                  <Button variant="outline" onClick={() => setShowAddContact(false)} className="flex-1">
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </CardTitle>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search contacts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <ScrollArea className="h-96">
          {/* Accepted Contacts */}
          {renderUserSection("Accepted", acceptedUsers)}

          {/* Pending Contacts */}
          {renderUserSection("Pending Requests", pendingUsers, true)}

          {/* Blocked Contacts */}
          {renderUserSection("Blocked", blockedUsers)}

          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
            </div>
          )}

          {error && (
            <div className="text-center py-8 text-red-500">
              <p>Failed to load contacts</p>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                Retry
              </Button>
            </div>
          )}

          {!isLoading && !error && filteredUsers.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No contacts found</p>
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
