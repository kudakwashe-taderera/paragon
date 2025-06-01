"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { AuthService } from "@/lib/auth"
import { apiClient } from "@/lib/api"
import DashboardLayout from "@/components/layout/DashboardLayout"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"

interface PaperType {
  id: number
  name: string
  created_at: string
}

export default function PaperTypesPage() {
  const [paperTypes, setPaperTypes] = useState<PaperType[]>([])
  const [loading, setLoading] = useState(true)
  const [newPaperType, setNewPaperType] = useState("")
  const [adding, setAdding] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

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

      fetchPaperTypes()
    }

    checkAuth()
  }, [router])

  const fetchPaperTypes = async () => {
    try {
      const response = await apiClient.getPaperTypes()
      if (response.ok) {
        const data = await response.json()
        setPaperTypes(data.results || data)
      }
    } catch (error) {
      console.error("Error fetching paper types:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddPaperType = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newPaperType.trim()) return

    setAdding(true)
    try {
      const response = await apiClient.createPaperType(newPaperType.trim())
      if (response.ok) {
        setNewPaperType("")
        fetchPaperTypes()
        toast({
          title: "Success",
          description: "Paper type added successfully",
        })
      } else {
        toast({
          title: "Error",
          description: "Failed to add paper type",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error adding paper type:", error)
      toast({
        title: "Error",
        description: "Failed to add paper type",
        variant: "destructive",
      })
    } finally {
      setAdding(false)
    }
  }

  if (loading) {
    return (
      <DashboardLayout title="Paper Types">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto"></div>
          <p className="mt-2 text-gray-500">Loading paper types...</p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="Paper Types">
      <Toaster />
      <div className="space-y-6">
        {/* Add New Paper Type */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Add New Paper Type</h2>
          <form onSubmit={handleAddPaperType} className="flex gap-4">
            <input
              type="text"
              value={newPaperType}
              onChange={(e) => setNewPaperType(e.target.value)}
              placeholder="Enter paper type name"
              className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              required
            />
            <button
              type="submit"
              disabled={adding}
              className="bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white font-semibold px-6 py-3 rounded-xl transition-all duration-200 disabled:opacity-50 shadow-lg hover:shadow-xl"
            >
              {adding ? "Adding..." : "Add Paper Type"}
            </button>
          </form>
        </div>

        {/* Paper Types List */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Paper Types ({paperTypes.length})</h2>
          {paperTypes.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No paper types found</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {paperTypes.map((paperType) => (
                <div
                  key={paperType.id}
                  className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors border border-gray-200"
                >
                  <h3 className="font-semibold text-gray-900">{paperType.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Created: {new Date(paperType.created_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
