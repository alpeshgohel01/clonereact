"use client"

export default function TypingIndicator({ users }) {
  if (users.length === 0) return null

  const getTypingText = () => {
    if (users.length === 1) {
      return `${users[0]} is typing...`
    } else if (users.length === 2) {
      return `${users[0]} and ${users[1]} are typing...`
    } else {
      return `${users[0]} and ${users.length - 1} others are typing...`
    }
  }

  return (
    <div className="flex justify-start">
      <div className="bg-gray-200 rounded-lg px-4 py-2 max-w-xs">
        <div className="flex items-center space-x-1">
          <span className="text-sm text-gray-600">{getTypingText()}</span>
          <div className="flex space-x-1">
            <div className="w-1 h-1 bg-gray-500 rounded-full animate-bounce"></div>
            <div className="w-1 h-1 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
            <div className="w-1 h-1 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
          </div>
        </div>
      </div>
    </div>
  )
}
