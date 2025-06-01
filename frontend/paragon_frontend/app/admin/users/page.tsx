"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { AuthService } from "@/lib/auth"
import DashboardLayout from "@/components/layout/DashboardLayout"
import { apiClient } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

interface UserData {
  id: number
  full_name: string
  email: string
  role: string
  approved: boolean
  created_at: string
}

function UsersContent() {
  const [users, setUsers] = useState<UserData[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("all")
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()

  useEffect(() => {
    const status = searchParams.get("status")
    if (status) {
      setFilter(status.toLowerCase())
    }
  }, [searchParams])

  useEffect(() => {
    const checkAuth = async () => {
      if (!AuthService.isAuthenticated()) {
        router.push("/login")
        return
      }

      const user = await AuthService.getCurrentUser()
      if (!user || user.role !== "SUPERUSER") {
        router.push("/dashboard")
        return
      }

      fetchUsers()
    }

    checkAuth()
  }, [router])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      // First get all users
      const allUsersResponse = await apiClient.getUsers()
      
      // Then get pending users
      const pendingUsersResponse = await apiClient.getPendingUsers()
      
      if (allUsersResponse.ok && pendingUsersResponse.ok) {
        const allUsersData = await allUsersResponse.json()
        const pendingUsersData = await pendingUsersResponse.json()
        
        // Combine and deduplicate users
        const allUsers = allUsersData.results || allUsersData
        const pendingUsers = pendingUsersData.results || pendingUsersData
        
        // Create a map of all users
        const userMap = new Map()
        
        // Add all users first
        allUsers.forEach((user: UserData) => {
          userMap.set(user.id, { ...user, approved: true })
        })
        
        // Then add/update with pending users
        pendingUsers.forEach((user: UserData) => {
          userMap.set(user.id, { ...user, approved: false })
        })
        
        // Convert map back to array
        setUsers(Array.from(userMap.values()))
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch users",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error fetching users:", error)
      toast({
        title: "Error",
        description: "Failed to fetch users",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const filteredUsers = users.filter((user) => {
    if (filter === "all") return true
    if (filter === "approved") return user.approved
    if (filter === "pending") return !user.approved
    return user.role === filter
  })

  if (loading) {
    return (
      <DashboardLayout title="User Management">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto"></div>
          <p className="mt-2 text-gray-500">Loading users...</p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="User Management">
      <div className="space-y-6">
        {/* Filter Controls */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Filter Users</h2>
          <div className="flex flex-wrap gap-2">
            {["all", "approved", "pending", "SUPERUSER", "DESIGNER", "SALES_REPRESENTATIVE", "OPERATOR", "CLERK"].map(
              (filterOption) => (
                <button
                  key={filterOption}
                  onClick={() => {
                    setFilter(filterOption)
                    if (filterOption === "pending") {
                      router.push("/admin/users?status=pending")
                    } else {
                      router.push("/admin/users")
                    }
                  }}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    filter === filterOption
                      ? "bg-primary-500 text-white shadow-md"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {filterOption.replace("_", " ").toUpperCase()}
                </button>
              ),
            )}
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Users ({filteredUsers.length})</h2>
          {filteredUsers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No users found for the selected filter</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {user.full_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                          {user.role?.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            user.approved ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {user.approved ? "Approved" : "Pending"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}

export default function AdminUsersPage() {
  return (
    <Suspense fallback={
      <DashboardLayout title="User Management">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto"></div>
          <p className="mt-2 text-gray-500">Loading users...</p>
        </div>
      </DashboardLayout>
    }>
      <UsersContent />
    </Suspense>
  )
}
