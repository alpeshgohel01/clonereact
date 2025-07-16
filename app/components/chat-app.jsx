// "use client"

// import { useState, useEffect, useMemo } from "react"
// import { useAuth } from "../contexts/auth-context"
// import { useChat } from "../contexts/chat-context"
// import { useUsers, useOnlineUsers } from "../hooks/use-chat-queries"
// import { Button } from "@/components/ui/button"
// import { Input } from "@/components/ui/input"
// import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
// import { Card, CardContent } from "@/components/ui/card"
// import { Badge } from "@/components/ui/badge"
// import { ScrollArea } from "@/components/ui/scroll-area"
// import { LogOut, Search, Plus, Users, MessageCircle, Sun, Moon, UserCircle } from "lucide-react"
// import ChatRoom from "./chat-room"
// import CreateChatModal from "./create-chat-modal"
// import UserProfileModal from "./user-profile-modal"
// import UserList from "./user-list"
// import { generatePrivateChatId } from "../contexts/websocket-context"
// import { useTheme } from "next-themes"

// export default function ChatApp() {
//   const { user, logout } = useAuth()
//   const { activeChat, setActiveChat, chats, addChat } = useChat()
//   const [searchTerm, setSearchTerm] = useState("")
//   const [showUserList, setShowUserList] = useState(false)
//   const [showCreateChat, setShowCreateChat] = useState(false)
//   const [showProfileModal, setShowProfileModal] = useState(false)
//   const [isMobile, setIsMobile] = useState(false)
//   const { theme, setTheme } = useTheme()

//   // React Query hooks
//   const { data: users = [], isLoading: usersLoading, error: usersError } = useUsers()
//   const { data: onlineUsers = [] } = useOnlineUsers()

//   useEffect(() => {
//     const checkMobile = () => {
//       setIsMobile(window.innerWidth < 768)
//     }

//     checkMobile()
//     window.addEventListener("resize", checkMobile)
//     return () => window.removeEventListener("resize", checkMobile)
//   }, [])

//   // Memoize filtered data to prevent unnecessary re-renders
//   const filteredChats = useMemo(() => {
//     return chats.filter(
//       (chat) =>
//         chat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
//         chat.participants?.some((p) => p.name?.toLowerCase().includes(searchTerm.toLowerCase())),
//     )
//   }, [chats, searchTerm])

//   const handleChatSelect = (chat) => {
//     setActiveChat(chat)
//   }

//   const handleUserSelect = (selectedUser) => {
//     // Generate a consistent chat ID for private chats using the helper
//     if (!user?.mobile || !selectedUser?.mobile) {
//       console.error("Cannot generate chat ID: User or selected user mobile number is missing.")
//       return
//     }

//     // Use the generatePrivateChatId that sorts the mobiles
//     const newChatId = generatePrivateChatId(user.mobile, selectedUser.mobile)
//     console.log("Generated Chat ID:", newChatId)

//     // Check if a chat with this ID already exists
//     const existingChat = chats.find((chat) => chat.id === newChatId)

//     if (existingChat) {
//       setActiveChat(existingChat)
//     } else {
//       // Create a new direct chat with selected user
//       const newChat = {
//         id: newChatId,
//         name: selectedUser.name,
//         participants: [user, selectedUser],
//         is_group: false,
//         avatar: selectedUser.profile_pic,
//         messages: [],
//         created_at: new Date().toISOString(),
//       }
//       addChat(newChat)
//       setActiveChat(newChat)
//     }
//     setShowUserList(false)
//   }

//   const handleCreateChat = (newChat) => {
//     setActiveChat(newChat)
//     setShowCreateChat(false)
//   }

//   const formatLastMessage = (message) => {
//     if (!message) return "No messages yet"
//     return message.content?.length > 30 ? `${message.content.substring(0, 30)}...` : message.content
//   }

//   const formatTime = (timestamp) => {
//     const date = new Date(timestamp)
//     const now = new Date()
//     const diffInHours = (now - date) / (1000 * 60 * 60)

//     if (diffInHours < 24) {
//       return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
//     } else {
//       return date.toLocaleDateString()
//     }
//   }

//   return (
//     <div className="flex h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-50">
//       {/* Sidebar */}
//       <div
//         className={`${isMobile && activeChat ? "hidden" : "flex"} flex-col w-full md:w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 shadow-lg`}
//       >
//         {/* Header */}
//         <div className="p-4 border-b border-gray-200 dark:border-gray-700">
//           <div className="flex items-center justify-between mb-4">
//             <div className="flex items-center space-x-3">
//               <Avatar className="cursor-pointer" onClick={() => setShowProfileModal(true)}>
//                 <AvatarImage src={user.profile_pic || "/placeholder.svg"} />
//                 <AvatarFallback>{user.name.charAt(0).toUpperCase()}</AvatarFallback>
//               </Avatar>
//               <div>
//                 <h2 className="font-semibold">{user.name}</h2>
//                 <p className="text-sm text-gray-500 dark:text-gray-400">Online</p>
//               </div>
//             </div>
//             <div className="flex space-x-2">
//               <Button variant="ghost" size="sm" onClick={() => setShowProfileModal(true)}>
//                 <UserCircle className="h-4 w-4" />
//               </Button>
//               <Button variant="ghost" size="sm" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
//                 {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
//               </Button>
//               <Button variant="ghost" size="sm" onClick={logout}>
//                 <LogOut className="h-4 w-4" />
//               </Button>
//             </div>
//           </div>

//           {/* Search */}
//           <div className="relative">
//             <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
//             <Input
//               placeholder={showUserList ? "Search contacts..." : "Search chats..."}
//               value={searchTerm}
//               onChange={(e) => setSearchTerm(e.target.value)}
//               className="pl-10 bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-50"
//             />
//           </div>
//         </div>

//         {/* Content Area */}
//         <div className="flex-1 overflow-hidden">
//           {showUserList ? (
//             // Users List
//             <UserList onUserSelect={handleUserSelect} />
//           ) : (
//             // Chats List
//             <div className="flex flex-col h-full">
//               <div className="p-4 flex items-center justify-between border-b border-gray-200 dark:border-gray-700">
//                 <h3 className="font-medium">Recent Chats</h3>
//                 <Button
//                   size="sm"
//                   onClick={() => setShowCreateChat(true)}
//                   className="bg-emerald-500 hover:bg-emerald-600 text-white"
//                 >
//                   <Plus className="h-4 w-4 mr-1" />
//                   New
//                 </Button>
//               </div>

//               <ScrollArea className="flex-1">
//                 <div className="px-2 py-2">
//                   {filteredChats.map((chat) => (
//                     <Card
//                       key={chat.id}
//                       className={`mb-2 cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-700 ${
//                         activeChat?.id === chat.id
//                           ? "bg-emerald-50 dark:bg-emerald-900 border-emerald-200 dark:border-emerald-700"
//                           : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
//                       }`}
//                       onClick={() => handleChatSelect(chat)}
//                     >
//                       <CardContent className="p-3">
//                         <div className="flex items-center space-x-3">
//                           <div className="relative">
//                             <Avatar>
//                               <AvatarImage src={chat.avatar || "/placeholder.svg"} />
//                               <AvatarFallback>
//                                 {chat.is_group ? <Users className="h-4 w-4" /> : chat.name.charAt(0).toUpperCase()}
//                               </AvatarFallback>
//                             </Avatar>
//                             {chat.unread_count > 0 && (
//                               <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs bg-emerald-500 text-white">
//                                 {chat.unread_count}
//                               </Badge>
//                             )}
//                           </div>

//                           <div className="flex-1 min-w-0">
//                             <div className="flex items-center justify-between">
//                               <h4 className="font-medium truncate">{chat.name}</h4>
//                               {chat.last_message && (
//                                 <span className="text-xs text-gray-500 dark:text-gray-400">
//                                   {formatTime(chat.last_message.timestamp)}
//                                 </span>
//                               )}
//                             </div>
//                             <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
//                               {formatLastMessage(chat.last_message)}
//                             </p>
//                             {chat.is_group && (
//                               <p className="text-xs text-gray-400 dark:text-gray-500">
//                                 {chat.participants?.length} members
//                               </p>
//                             )}
//                           </div>
//                         </div>
//                       </CardContent>
//                     </Card>
//                   ))}

//                   {filteredChats.length === 0 && (
//                     <div className="text-center py-8 text-gray-500 dark:text-gray-400">
//                       <MessageCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
//                       <p>No chats yet</p>
//                       <Button
//                         variant="link"
//                         onClick={() => setShowUserList(true)}
//                         className="text-emerald-500 dark:text-emerald-400"
//                       >
//                         Browse contacts to start chatting
//                       </Button>
//                     </div>
//                   )}
//                 </div>
//               </ScrollArea>
//             </div>
//           )}
//         </div>

//         {/* Toggle Button */}
//         <div className="p-4 border-t border-gray-200 dark:border-gray-700">
//           <Button variant="outline" onClick={() => setShowUserList(!showUserList)} className="w-full">
//             <Users className="h-4 w-4 mr-2" />
//             {showUserList ? "Show Chats" : "Show Contacts"}
//           </Button>
//         </div>
//       </div>

//       {/* Chat Area */}
//       <div className="flex-1 flex flex-col bg-gray-50 dark:bg-gray-900">
//         {activeChat ? (
//           <ChatRoom onBack={isMobile ? () => setActiveChat(null) : null} />
//         ) : (
//           <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
//             <div className="text-center">
//               <MessageCircle className="h-16 w-16 mx-auto mb-4 text-gray-400 dark:text-gray-600" />
//               <h3 className="text-lg font-medium text-gray-900 dark:text-gray-50 mb-2">Welcome to ChatApp</h3>
//               <p className="text-gray-500 dark:text-gray-400 mb-4">Select a contact or chat to start messaging</p>
//               <Button onClick={() => setShowUserList(true)} className="bg-emerald-500 hover:bg-emerald-600 text-white">
//                 <Users className="h-4 w-4 mr-2" />
//                 Browse Contacts
//               </Button>
//             </div>
//           </div>
//         )}
//       </div>

//       {/* Modals */}
//       {showCreateChat && <CreateChatModal onClose={() => setShowCreateChat(false)} onCreateChat={handleCreateChat} />}
//       {showProfileModal && <UserProfileModal isOpen={showProfileModal} onClose={() => setShowProfileModal(false)} />}
//     </div>
//   )
// }


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
import { LogOut, Search, Plus, Users, MessageCircle, Sun, Moon, UserCircle } from "lucide-react"
import ChatRoom from "./chat-room"
import CreateChatModal from "./create-chat-modal"
import UserProfileModal from "./user-profile-modal"
import UserList from "./user-list"
import { generatePrivateChatId } from "../contexts/websocket-context"
import { useTheme } from "next-themes"

export default function ChatApp() {
  const { user, logout } = useAuth()
  const { activeChat, setActiveChat, chats, addChat } = useChat()
  const [searchTerm, setSearchTerm] = useState("")
  const [showUserList, setShowUserList] = useState(true) // Changed to true
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

  // Memoize filtered data to prevent unnecessary re-renders
  const filteredChats = useMemo(() => {
    return chats.filter(
      (chat) =>
        chat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        chat.participants?.some((p) => p.name?.toLowerCase().includes(searchTerm.toLowerCase())),
    )
  }, [chats, searchTerm])

  const handleChatSelect = (chat) => {
    setActiveChat(chat)
  }

  const handleUserSelect = (selectedUser) => {
    if (!user?.mobile || !selectedUser?.mobile) {
      console.error("Cannot generate chat ID: User or selected user mobile number is missing.")
      return
    }

    const newChatId = generatePrivateChatId(user.mobile, selectedUser.mobile)
    console.log("Generated Chat ID:", newChatId)

    const existingChat = chats.find((chat) => chat.id === newChatId)

    if (existingChat) {
      setActiveChat(existingChat)
    } else {
      const newChat = {
        id: newChatId,
        name: selectedUser.name,
        participants: [user, selectedUser],
        is_group: false,
        avatar: selectedUser.profile_pic,
        messages: [],
        created_at: new Date().toISOString(),
      }
      addChat(newChat)
      setActiveChat(newChat)
    }
    setShowUserList(false)
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
        className={`${isMobile && activeChat ? "hidden" : "flex"} flex-col w-full md:w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 shadow-lg`}
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
              placeholder={showUserList ? "Search contacts..." : "Search chats..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-50"
            />
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden">
          {showUserList ? (
            // Users List
            <UserList onUserSelect={handleUserSelect} />
          ) : (
            // Chats List
            <div className="flex flex-col h-full">
              <div className="p-4 flex items-center justify-between border-b border-gray-200 dark:border-gray-700">
                <h3 className="font-medium">Recent Chats</h3>
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
                      <CardContent className="p-3">
                        <div className="flex items-center space-x-3">
                          <div className="relative">
                            <Avatar>
                              <AvatarImage src={chat.avatar || "/placeholder.svg"} />
                              <AvatarFallback>
                                {chat.is_group ? <Users className="h-4 w-4" /> : chat.name.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            {chat.unread_count > 0 && (
                              <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs bg-emerald-500 text-white">
                                {chat.unread_count}
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

                  {filteredChats.length === 0 && (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      <MessageCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No chats yet</p>
                      <Button
                        variant="link"
                        onClick={() => setShowUserList(true)}
                        className="text-emerald-500 dark:text-emerald-400"
                      >
                        Browse contacts to start chatting
                      </Button>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>

        {/* Toggle Button */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <Button variant="outline" onClick={() => setShowUserList(!showUserList)} className="w-full">
            <Users className="h-4 w-4 mr-2" />
            {showUserList ? "Show Chats" : "Show Contacts"}
          </Button>
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
              <Button onClick={() => setShowUserList(true)} className="bg-emerald-500 hover:bg-emerald-600 text-white">
                <Users className="h-4 w-4 mr-2" />
                Browse Contacts
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