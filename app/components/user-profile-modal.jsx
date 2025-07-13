"use client"

import { useRef } from "react"

import { useState, useEffect } from "react"
import { useAuth } from "../contexts/auth-context"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Camera, User, Mail, Phone, Save, X } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function UserProfileModal({ isOpen, onClose }) {
  const { user, updateProfile, loading, error } = useAuth()
  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    mobile: "",
    profile_pic: "",
  })
  const [selectedFile, setSelectedFile] = useState(null)
  const [filePreview, setFilePreview] = useState(null)
  const [localError, setLocalError] = useState("")
  const fileInputRef = useRef(null)

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || "",
        email: user.email || "",
        mobile: user.mobile || "",
        profile_pic: user.profile_pic || "/placeholder.svg",
      })
      setFilePreview(user.profile_pic || "/placeholder.svg")
    }
  }, [user, isOpen])

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setFilePreview(URL.createObjectURL(file))
      setLocalError("")
    }
  }

  const handleSaveProfile = async (e) => {
    e.preventDefault()
    setLocalError("")

    let newProfilePicUrl = profileData.profile_pic

    if (selectedFile) {
      // Simulate file upload to a backend and get a URL
      // In a real application, you would send `selectedFile` to your Django backend
      // and receive the actual URL of the uploaded image.
      // For now, we'll use a mock URL.
      console.log("Simulating file upload for:", selectedFile.name)
      // Replace with actual API call to Django for file upload
      newProfilePicUrl = `/placeholder.svg?text=Uploaded+${selectedFile.name}` // Mock URL
      // Example: const uploadResponse = await fetch('/api/upload-profile-pic', { method: 'POST', body: formData });
      // newProfilePicUrl = (await uploadResponse.json()).url;
    }

    const result = await updateProfile({
      ...profileData,
      profile_pic: newProfilePicUrl,
    })

    if (result.success) {
      onClose()
    } else {
      setLocalError(result.error || "Failed to update profile.")
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" /> Your Profile
          </DialogTitle>
          <DialogDescription>View and update your profile information.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSaveProfile} className="grid gap-4 py-4">
          <div className="flex flex-col items-center gap-4">
            <div className="relative w-24 h-24">
              <Avatar className="w-24 h-24 border-2 border-primary">
                <AvatarImage src={filePreview || "/placeholder.svg"} alt="Profile Picture" />
                <AvatarFallback className="text-4xl">{profileData.name.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <Button
                type="button"
                variant="secondary"
                size="icon"
                className="absolute bottom-0 right-0 rounded-full"
                onClick={() => fileInputRef.current?.click()}
              >
                <Camera className="h-4 w-4" />
                <span className="sr-only">Upload profile picture</span>
              </Button>
              <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
            </div>
            <h3 className="text-lg font-semibold">{profileData.name}</h3>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="name" className="flex items-center gap-1">
              <User className="h-4 w-4 text-muted-foreground" /> Name
            </Label>
            <Input
              id="name"
              value={profileData.name}
              onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
              disabled={loading}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email" className="flex items-center gap-1">
              <Mail className="h-4 w-4 text-muted-foreground" /> Email
            </Label>
            <Input
              id="email"
              type="email"
              value={profileData.email}
              onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
              disabled={loading}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="mobile" className="flex items-center gap-1">
              <Phone className="h-4 w-4 text-muted-foreground" /> Mobile
            </Label>
            <Input
              id="mobile"
              type="tel"
              value={profileData.mobile}
              onChange={(e) => setProfileData({ ...profileData, mobile: e.target.value })}
              disabled={loading}
            />
          </div>

          {(error || localError) && (
            <Alert variant="destructive">
              <AlertDescription>{error || localError}</AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              <X className="h-4 w-4 mr-2" /> Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </div>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" /> Save changes
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
