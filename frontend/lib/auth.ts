import { apiClient } from "./api"

export interface User {
  id: number
  full_name: string
  email: string
  role: string
  approved: boolean
}

export interface AuthResponse {
  access: string
  refresh: string
  user: User
}

export class AuthService {
  static async login(email: string, password: string): Promise<AuthResponse> {
    const response = await apiClient.login(email, password)

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || error.non_field_errors?.[0] || "Login failed")
    }

    const data = await response.json()

    // Store tokens
    if (typeof window !== "undefined") {
      localStorage.setItem("access_token", data.access)
      localStorage.setItem("refresh_token", data.refresh)
    }

    apiClient.setToken(data.access)
    return data
  }

  static async register(userData: {
    full_name: string
    email: string
    password: string
    confirm_password: string
  }) {
    const response = await apiClient.register(userData)

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.email?.[0] || error.password?.[0] || error.non_field_errors?.[0] || "Registration failed")
    }

    return response.json()
  }

  static async getCurrentUser(): Promise<User | null> {
    try {
      const response = await apiClient.getProfile()
      if (response.ok) {
        return response.json()
      }
    } catch (error) {
      console.error("Error getting current user:", error)
    }
    return null
  }

  static logout() {
    apiClient.clearToken()
    if (typeof window !== "undefined") {
      window.location.href = "/login"
    }
  }

  static isAuthenticated(): boolean {
    if (typeof window === "undefined") return false
    return !!localStorage.getItem("access_token")
  }
}
