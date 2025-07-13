"use client"

import { createContext, useContext, useReducer, useEffect } from "react"

const AuthContext = createContext()

const authReducer = (state, action) => {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, loading: action.payload }
    case "SET_USER":
      return { ...state, user: action.payload, loading: false }
    case "SET_TOKENS":
      return { ...state, accessToken: action.payload.access, refreshToken: action.payload.refresh }
    case "LOGOUT":
      return { ...state, user: null, accessToken: null, refreshToken: null, loading: false }
    case "SET_ERROR":
      return { ...state, error: action.payload, loading: false }
    case "UPDATE_USER_PROFILE":
      return { ...state, user: { ...state.user, ...action.payload }, loading: false }
    default:
      return state
  }
}

const initialState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  loading: true,
  error: null,
}

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState)

  useEffect(() => {
    // Check for existing tokens on app start
    const accessToken = localStorage.getItem("accessToken")
    const refreshToken = localStorage.getItem("refreshToken")
    const userData = localStorage.getItem("userData")

    if (accessToken && refreshToken && userData) {
      dispatch({ type: "SET_TOKENS", payload: { access: accessToken, refresh: refreshToken } })
      dispatch({ type: "SET_USER", payload: JSON.parse(userData) })
    } else {
      dispatch({ type: "SET_LOADING", payload: false })
    }
  }, [])

  const register = async (userData) => {
    dispatch({ type: "SET_LOADING", payload: true })
    dispatch({ type: "SET_ERROR", payload: null })

    try {
      // FIX: Use the specific IP address and port for the register API
      const response = await fetch(`http://192.168.17.136:8000/register/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: userData.name,
          password: userData.password,
          email: userData.email,
          mobile: userData.mobile,
        }),
      })

      const data = await response.json()

      if (response.ok && data.status) {
        // Store tokens and user data
        localStorage.setItem("accessToken", data.token.access)
        localStorage.setItem("refreshToken", data.token.refresh)
        localStorage.setItem("userData", JSON.stringify(data.data))

        dispatch({ type: "SET_TOKENS", payload: data.token })
        dispatch({ type: "SET_USER", payload: data.data })
        return { success: true }
      } else {
        dispatch({ type: "SET_ERROR", payload: data.message || "Registration failed" })
        return { success: false, error: data.message }
      }
    } catch (error) {
      dispatch({ type: "SET_ERROR", payload: "Network error. Please try again." })
      return { success: false, error: "Network error" }
    }
  }

  const updateProfile = async (updatedData) => {
    dispatch({ type: "SET_LOADING", payload: true })
    dispatch({ type: "SET_ERROR", payload: null })

    try {
      // Simulate API call for profile update
      // In a real app, you'd send this to your Django backend
      console.log("Simulating profile update with:", updatedData)
      await new Promise((resolve) => setTimeout(resolve, 500)) // Simulate network delay

      // Assuming success for now
      const updatedUser = { ...state.user, ...updatedData }
      localStorage.setItem("userData", JSON.stringify(updatedUser))
      dispatch({ type: "UPDATE_USER_PROFILE", payload: updatedUser })
      return { success: true }
    } catch (error) {
      dispatch({ type: "SET_ERROR", payload: "Failed to update profile." })
      return { success: false, error: "Failed to update profile." }
    } finally {
      dispatch({ type: "SET_LOADING", payload: false })
    }
  }

  const logout = () => {
    localStorage.removeItem("accessToken")
    localStorage.removeItem("refreshToken")
    localStorage.removeItem("userData")
    dispatch({ type: "LOGOUT" })
  }

  const value = {
    ...state,
    register,
    logout,
    updateProfile, // Add updateProfile to context value
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
