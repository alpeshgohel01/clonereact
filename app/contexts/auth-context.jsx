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

  const login = async (credentials) => {
    dispatch({ type: "SET_LOADING", payload: true })
    dispatch({ type: "SET_ERROR", payload: null })

    try {
      const response = await fetch(`http://192.168.17.136:8000/login/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mobile_no: credentials.mobile_no,
          password: credentials.password,
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
        dispatch({ type: "SET_ERROR", payload: data.message || "Login failed" })
        return { success: false, error: data.message }
      }
    } catch (error) {
      console.log(error)
      dispatch({ type: "SET_ERROR", payload: "Network error. Please try again." })
      return { success: false, error: "Network error" }
    }
  }

  const register = async (userData) => {
    dispatch({ type: "SET_LOADING", payload: true })
    dispatch({ type: "SET_ERROR", payload: null })

    try {
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
      console.log(error)
      dispatch({ type: "SET_ERROR", payload: "Network error. Please try again." })

      return { success: false, error: "Network error" }
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
    login,
    register,
    logout,
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













// "use client"

// import React, { createContext, useEffect, useReducer } from "react"
// import { useRouter } from "next/router"

// const AuthContext = createContext()

// const initialState = {
//   user: null,
//   loading: false,
//   error: null,
// }

// const reducer = (state, action) => {
//   switch (action.type) {
//     case "SET_USER":
//       return { ...state, user: action.payload, loading: false, error: null }
//     case "SET_LOADING":
//       return { ...state, loading: action.payload }
//     case "SET_ERROR":
//       return { ...state, error: action.payload, loading: false }
//     case "LOGOUT":
//       return { ...state, user: null, loading: false, error: null }
//     default:
//       return state
//   }
// }

// export const AuthProvider = ({ children }) => {
//   const [state, dispatch] = useReducer(reducer, initialState)
//   const router = useRouter()

//   useEffect(() => {
//     // Check for token in local storage and set user if found
//     const token = localStorage.getItem("token")
//     if (token) {
//       try {
//         const user = JSON.parse(localStorage.getItem("user"))
//         dispatch({ type: "SET_USER", payload: user })
//       } catch (error) {
//         console.error("Error parsing user from localStorage:", error)
//         localStorage.removeItem("token")
//         localStorage.removeItem("user")
//       }
//     }
//   }, [])

//   const login = async (credentials) => {
//     dispatch({ type: "SET_LOADING", payload: true })
//     dispatch({ type: "SET_ERROR", payload: null })

//     // Add this line to log the credentials
//     console.log("Attempting login with credentials:", credentials)

//     try {
//       const response = await fetch(`http://192.168.17.136:8000/login/`, {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({
//           mobile_no: credentials.mobile,
//           password: credentials.password,
//         }),
//       })

//       const data = await response.json()

//       if (response.ok) {
//         localStorage.setItem("token", data.token)
//         localStorage.setItem("user", JSON.stringify(data.user))
//         dispatch({ type: "SET_USER", payload: data.user })
//         router.push("/")
//       } else {
//         dispatch({ type: "SET_ERROR", payload: data.message || "Login failed" })
//       }
//     } catch (error) {
//       dispatch({ type: "SET_ERROR", payload: "Network error. Please try again." })
//     } finally {
//       dispatch({ type: "SET_LOADING", payload: false })
//     }
//   }

//   const logout = () => {
//     localStorage.removeItem("token")
//     localStorage.removeItem("user")
//     dispatch({ type: "LOGOUT" })
//     router.push("/login")
//   }

//   const value = {
//     user: state.user,
//     loading: state.loading,
//     error: state.error,
//     login,
//     logout,
//   }

//   return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
// }

// export const useAuth = () => React.useContext(AuthContext)
