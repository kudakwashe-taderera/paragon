"use client"

import { useState, useEffect } from "react"
import { apiClient } from "@/lib/api"

interface PendingUser {
  id: number
  full_name: string
  email: string
  created_at: string
}

interface UserApprovalTableProps {
  onUserApproved: () => void
}

export default function UserApprovalTable({ onUserApproved }: UserApprovalTableProps) {
  const [users, setUsers] = useState<PendingUser[]>([])
  const [selectedUser, setSelectedUser] = useState<PendingUser | null>(null)
  const [selectedRole, setSelectedRole] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchPendingUsers()
  }, [])

  const fetchPendingUsers = async () => {
    try {
      const response = await apiClient.getPendingUsers()
      if (response.ok) {
        const data = await response.json()
        setUsers(data.results || data)
      }
    } catch (error) {
      console.error("Error fetching pending users:", error)
    }
  }

  const handleApprove = async () => {
    if (!selectedUser || !selectedRole) return

    setLoading(true)
    try {
      const response = await apiClient.approveUser(selectedUser.id, selectedRole)
      if (response.ok) {
        setSelectedUser(null)
        setSelectedRole("")
        fetchPendingUsers()
        onUserApproved()
      }
    } catch (error) {
      console.error("Error approving user:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDecline = async () => {
    if (!selectedUser) return

    setLoading(true)
    try {
      const response = await apiClient.declineUser(selectedUser.id)
      if (response.ok) {
        setSelectedUser(null)
        fetchPendingUsers()
        onUserApproved()
      }
    } catch (error) {
      console.error("Error declining user:", error)
    } finally {
      setLoading(false)
    }
  }

  if (users.length === 0) {
    return <div className="text-center py-8 text-gray-500">No pending user registrations</div>
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Registration Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.full_name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(user.created_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button onClick={() => setSelectedUser(user)} className="text-blue-600 hover:text-blue-900">
                    Review
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">User Approval</h3>

            <div className="space-y-4">
              <div>
                <label className="form-label">Full Name</label>
                <p className="text-gray-900">{selectedUser.full_name}</p>
              </div>
              <div>
                <label className="form-label">Email</label>
                <p className="text-gray-900">{selectedUser.email}</p>
              </div>
              <div>
                <label className="form-label">Assign Role</label>
                <select value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)} className="form-input">
                  <option value="">Select a role</option>
                  <option value="DESIGNER">Designer</option>
                  <option value="SALES_REPRESENTATIVE">Sales Representative</option>
                  <option value="OPERATOR">Operator</option>
                  <option value="CLERK">Clerk</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setSelectedUser(null)
                  setSelectedRole("")
                }}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDecline}
                disabled={loading}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                {loading ? "Processing..." : "Decline"}
              </button>
              <button
                onClick={handleApprove}
                disabled={!selectedRole || loading}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                Approve
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
