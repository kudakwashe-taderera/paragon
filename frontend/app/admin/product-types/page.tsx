"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { AuthService } from "@/lib/auth"
import { apiClient } from "@/lib/api"
import DashboardLayout from "@/components/layout/DashboardLayout"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"

interface ProductType {
  id: number
  name: string
  created_at: string
}

export default function ProductTypesPage() {
  const [productTypes, setProductTypes] = useState<ProductType[]>([])
  const [loading, setLoading] = useState(true)
  const [newProductType, setNewProductType] = useState("")
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

      fetchProductTypes()
    }

    checkAuth()
  }, [router])

  const fetchProductTypes = async () => {
    try {
      const response = await apiClient.getProductTypes()
      if (response.ok) {
        const data = await response.json()
        setProductTypes(data.results || data)
      }
    } catch (error) {
      console.error("Error fetching product types:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddProductType = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newProductType.trim()) return

    setAdding(true)
    try {
      const response = await apiClient.createProductType(newProductType.trim())
      if (response.ok) {
        setNewProductType("")
        fetchProductTypes()
        toast({
          title: "Success",
          description: "Product type added successfully",
        })
      } else {
        toast({
          title: "Error",
          description: "Failed to add product type",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error adding product type:", error)
      toast({
        title: "Error",
        description: "Failed to add product type",
        variant: "destructive",
      })
    } finally {
      setAdding(false)
    }
  }

  if (loading) {
    return (
      <DashboardLayout title="Product Types">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto"></div>
          <p className="mt-2 text-gray-500">Loading product types...</p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="Product Types">
      <Toaster />
      <div className="space-y-6">
        {/* Add New Product Type */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Add New Product Type</h2>
          <form onSubmit={handleAddProductType} className="flex gap-4">
            <input
              type="text"
              value={newProductType}
              onChange={(e) => setNewProductType(e.target.value)}
              placeholder="Enter product type name"
              className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              required
            />
            <button
              type="submit"
              disabled={adding}
              className="bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white font-semibold px-6 py-3 rounded-xl transition-all duration-200 disabled:opacity-50 shadow-lg hover:shadow-xl"
            >
              {adding ? "Adding..." : "Add Product Type"}
            </button>
          </form>
        </div>

        {/* Product Types List */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Product Types ({productTypes.length})</h2>
          {productTypes.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No product types found</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {productTypes.map((productType) => (
                <div
                  key={productType.id}
                  className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors border border-gray-200"
                >
                  <h3 className="font-semibold text-gray-900">{productType.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Created: {new Date(productType.created_at).toLocaleDateString()}
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
