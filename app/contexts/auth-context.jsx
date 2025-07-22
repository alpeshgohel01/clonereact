// "use client"

// import { createContext, useContext, useReducer, useEffect } from "react"

// const AuthContext = createContext()

// const authReducer = (state, action) => {
//   switch (action.type) {
//     case "SET_LOADING":
//       return { ...state, loading: action.payload }
//     case "SET_USER":
//       return { ...state, user: action.payload, loading: false }
//     case "SET_TOKENS":
//       return { ...state, accessToken: action.payload.access, refreshToken: action.payload.refresh }
//     case "LOGOUT":
//       return { ...state, user: null, accessToken: null, refreshToken: null, loading: false }
//     case "SET_ERROR":
//       return { ...state, error: action.payload, loading: false }
//     default:
//       return state
//   }
// }

// const initialState = {
//   user: null,
//   accessToken: null,
//   refreshToken: null,
//   loading: true,
//   error: null,
// }

// export function AuthProvider({ children }) {
//   const [state, dispatch] = useReducer(authReducer, initialState)

//   useEffect(() => {
//     // Check for existing tokens on app start
//     const accessToken = localStorage.getItem("accessToken")
//     const refreshToken = localStorage.getItem("refreshToken")
//     const userData = localStorage.getItem("userData")

//     if (accessToken && refreshToken && userData) {
//       dispatch({ type: "SET_TOKENS", payload: { access: accessToken, refresh: refreshToken } })
//       dispatch({ type: "SET_USER", payload: JSON.parse(userData) })
//     } else {
//       dispatch({ type: "SET_LOADING", payload: false })
//     }
//   }, [])

//   const login = async (credentials) => {
//     dispatch({ type: "SET_LOADING", payload: true })
//     dispatch({ type: "SET_ERROR", payload: null })

//     try {
//       alert(process.env.NEXT_PUBLIC_API_BASE_URL);
//       console.log("envvvvvvvvvvvvvvvvv",process.env);
//       const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/login/`, {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
        
//         body: JSON.stringify({
//           mobile_no: credentials.mobile_no,
//           password: credentials.password,
//         }),
//       })

//       const data = await response.json()

//       if (response.ok && data.status) {
//         // Store tokens and user data
//         localStorage.setItem("accessToken", data.token.access)
//         localStorage.setItem("refreshToken", data.token.refresh)
//         localStorage.setItem("userData", JSON.stringify(data.data))

//         dispatch({ type: "SET_TOKENS", payload: data.token })
//         dispatch({ type: "SET_USER", payload: data.data })
//         return { success: true }
//       } else {
//         dispatch({ type: "SET_ERROR", payload: data.message || "Login failed" })
//         return { success: false, error: data.message }
//       }
//     } catch (error) {
//       console.log(error)
//       dispatch({ type: "SET_ERROR", payload: "Network error. Please try again." })
//       return { success: false, error: "Network error" }
//     }
//   }

//   const register = async (userData) => {
//     dispatch({ type: "SET_LOADING", payload: true })
//     dispatch({ type: "SET_ERROR", payload: null })

//     try {
//       const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/register/`, {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({
//           name: userData.name,
//           password: userData.password,
//           email: userData.email,
//           mobile: userData.mobile,
//         }),
//       })

//       const data = await response.json()

//       if (response.ok && data.status) {
//         // Store tokens and user data
//         localStorage.setItem("accessToken", data.token.access)
//         localStorage.setItem("refreshToken", data.token.refresh)
//         localStorage.setItem("userData", JSON.stringify(data.data))

//         dispatch({ type: "SET_TOKENS", payload: data.token })
//         dispatch({ type: "SET_USER", payload: data.data })
//         return { success: true }
//       } else {
//         dispatch({ type: "SET_ERROR", payload: data.message || "Registration failed" })
//         return { success: false, error: data.message }
//       }
//     } catch (error) {
//       console.log(error)
//       dispatch({ type: "SET_ERROR", payload: "Network error. Please try again." })
//       return { success: false, error: "Network error" }
//     }
//   }

//   const logout = () => {
//     localStorage.removeItem("accessToken")
//     localStorage.removeItem("refreshToken")
//     localStorage.removeItem("userData")
//     dispatch({ type: "LOGOUT" })
//   }

//   const value = {
//     ...state,
//     login,
//     register,
//     logout,
//   }

//   return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
// }

// export const useAuth = () => {
//   const context = useContext(AuthContext)
//   if (!context) {
//     throw new Error("useAuth must be used within an AuthProvider")
//   }
//   return context
// }











"use client"

import { createContext, useContext, useReducer, useEffect, useRef } from "react"

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
  const refreshTimer = useRef(null)

  // 🔁 Refresh Access Token Using Refresh Token
  const refreshAccessToken = async () => {
    try {
      const refreshToken = localStorage.getItem("refreshToken")
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/user-get-token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refreshToken }),
      })

      const data = await response.json()

      if (response.ok && data.status) {
        const { access, refresh } = data.token
        localStorage.setItem("accessToken", access)
        localStorage.setItem("refreshToken", refresh)
        dispatch({ type: "SET_TOKENS", payload: { access, refresh } })
        console.log("✅ Access token refreshed")
      } else {
        console.error("❌ Token refresh failed")
        logout()
      }
    } catch (error) {
      console.error("❌ Network error while refreshing token", error)
      logout()
    }
  }

  // 🔄 Auto-refresh token every 25 minutes
  useEffect(() => {
    if (state.accessToken && state.refreshToken) {
      if (refreshTimer.current) clearInterval(refreshTimer.current)

      refreshTimer.current = setInterval(() => {
        refreshAccessToken()
      }, 25 * 60 * 1000) // 25 minutes

      return () => clearInterval(refreshTimer.current)
    }
  }, [state.accessToken, state.refreshToken])

  // ✅ On app load check localStorage tokens
  useEffect(() => {
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
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/login/`, {
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
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/register/`, {
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

    if (refreshTimer.current) clearInterval(refreshTimer.current)
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














