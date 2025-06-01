"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { AuthService, type User } from "@/lib/auth"
import { apiClient } from "@/lib/api"
import DashboardLayout from "@/components/layout/DashboardLayout"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"

interface ProductType {
  id: string
  name: string
}

interface PaperType {
  id: string
  name: string
}

interface PaperWeight {
  id: string
  gsm: number
}

interface PaperSize {
  id: string
  name: string
  width_mm: number
  height_mm: number
}

export default function EditJobPage() {
  const [user, setUser] = useState<User | null>(null)
  const [productTypes, setProductTypes] = useState<ProductType[]>([])
  const [paperTypes, setPaperTypes] = useState<PaperType[]>([])
  const [paperWeights, setPaperWeights] = useState<PaperWeight[]>([])
  const [paperSizes, setPaperSizes] = useState<PaperSize[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()

  // Loading states for dependent dropdowns
  const [loadingPaperTypes, setLoadingPaperTypes] = useState(false)
  const [loadingWeights, setLoadingWeights] = useState(false)
  const [loadingSizes, setLoadingSizes] = useState(false)

  const [formData, setFormData] = useState({
    branch: "",
    job_type: "",
    docket_number: "",
    sales_rep: "",
    order_taken_by: "",
    customer: "",
    contact_person: "",
    mobile_number: "",
    email_address: "",
    quantity: "",
    description: "",
    product_type: "",
    paper_type: "",
    paper_weight: "",
    paper_size: "",
    notes: "",
    print_cost: "",
    design_cost: "",
  })

  useEffect(() => {
    const checkAuth = async () => {
      if (!AuthService.isAuthenticated()) {
        router.push("/login")
        return
      }

      const currentUser = await AuthService.getCurrentUser()
      setUser(currentUser)
    }

    checkAuth()
  }, [router])

  useEffect(() => {
    const loadData = async () => {
      if (!user) return
      if (!params.id || isNaN(Number(params.id))) {
        toast({
          title: "Error",
          description: "Invalid job ID",
          variant: "destructive",
        })
        router.push("/jobs")
        return
      }
      await Promise.all([
        fetchJob(Number(params.id)),
        fetchProductTypes()
      ])
    }

    loadData()
  }, [user, params.id])

  // Fetch compatible paper types when product type changes
  useEffect(() => {
    if (formData.product_type) {
      fetchCompatiblePaperTypes(formData.product_type)
    } else {
      setPaperTypes([])
      setPaperWeights([])
      setPaperSizes([])
      setFormData(prev => ({
        ...prev,
        paper_type: "",
        paper_weight: "",
        paper_size: ""
      }))
    }
  }, [formData.product_type])

  // Fetch compatible weights when paper type changes
  useEffect(() => {
    if (formData.paper_type) {
      fetchCompatibleWeights(formData.paper_type)
    } else {
      setPaperWeights([])
      setPaperSizes([])
      setFormData(prev => ({
        ...prev,
        paper_weight: "",
        paper_size: ""
      }))
    }
  }, [formData.paper_type])

  // Fetch compatible sizes when weight changes
  useEffect(() => {
    if (formData.paper_weight) {
      fetchCompatibleSizes(formData.paper_weight)
    } else {
      setPaperSizes([])
      setFormData(prev => ({
        ...prev,
        paper_size: ""
      }))
    }
  }, [formData.paper_weight])

  const fetchJob = async (jobId: number) => {
    try {
      const response = await apiClient.getJob(jobId)
      if (!response.ok) {
        toast({
          title: "Error",
          description: "Job not found",
          variant: "destructive",
        })
        router.push("/jobs")
        return
      }

      const job = await response.json()
      
      // Check if user has permission to edit
      if (job.status === "PRINTED") {
        toast({
          title: "Error",
          description: "Cannot edit a printed job",
          variant: "destructive",
        })
        router.push(`/jobs/${jobId}`)
        return
      }

      if (user?.role !== "SUPERUSER" && job.order_taken_by !== user?.full_name) {
        toast({
          title: "Error",
          description: "You don't have permission to edit this job",
          variant: "destructive",
        })
        router.push(`/jobs/${jobId}`)
        return
      }

      // Populate form data
      setFormData({
        branch: job.branch || "",
        job_type: job.job_type || "",
        docket_number: job.docket_number || "",
        sales_rep: job.sales_rep || "",
        order_taken_by: job.order_taken_by || "",
        customer: job.customer || "",
        contact_person: job.contact_person || "",
        mobile_number: job.mobile_number || "",
        email_address: job.email_address || "",
        quantity: job.quantity?.toString() || "",
        description: job.description || "",
        product_type: job.product_type?.id || "",
        paper_type: job.paper_type?.id || "",
        paper_weight: job.paper_weight?.id || "",
        paper_size: job.paper_size?.id || "",
        notes: job.notes || "",
        print_cost: job.print_cost?.toString() || "0",
        design_cost: job.design_cost?.toString() || "0",
      })
    } catch (error) {
      console.error("Error fetching job:", error)
      toast({
        title: "Error",
        description: "Failed to load job details",
        variant: "destructive",
      })
      router.push("/jobs")
    } finally {
      setLoading(false)
    }
  }

  const fetchProductTypes = async () => {
    try {
      const response = await apiClient.getProductTypes()
      if (response.ok) {
        const data = await response.json()
        setProductTypes(data.results || data)
      }
    } catch (error) {
      console.error("Error fetching product types:", error)
      toast({
        title: "Error",
        description: "Failed to load product types",
        variant: "destructive",
      })
    }
  }

  const fetchCompatiblePaperTypes = async (productTypeId: string) => {
    setLoadingPaperTypes(true)
    try {
      const response = await apiClient.getCompatiblePaperTypes(productTypeId)
      if (response.ok) {
        const data = await response.json()
        setPaperTypes(data.paper_types || [])
      }
    } catch (error) {
      console.error("Error fetching paper types:", error)
      toast({
        title: "Error",
        description: "Failed to load paper types",
        variant: "destructive",
      })
    } finally {
      setLoadingPaperTypes(false)
    }
  }

  const fetchCompatibleWeights = async (paperTypeId: string) => {
    setLoadingWeights(true)
    try {
      const response = await apiClient.getCompatibleWeights(paperTypeId)
      if (response.ok) {
        const data = await response.json()
        setPaperWeights(data.results || data)
      }
    } catch (error) {
      console.error("Error fetching paper weights:", error)
      toast({
        title: "Error",
        description: "Failed to load paper weights",
        variant: "destructive",
      })
    } finally {
      setLoadingWeights(false)
    }
  }

  const fetchCompatibleSizes = async (weightId: string) => {
    setLoadingSizes(true)
    try {
      const response = await apiClient.getCompatibleSizes(weightId)
      if (response.ok) {
        const data = await response.json()
        setPaperSizes(data.results || data)
      }
    } catch (error) {
      console.error("Error fetching paper sizes:", error)
      toast({
        title: "Error",
        description: "Failed to load paper sizes",
        variant: "destructive",
      })
    } finally {
      setLoadingSizes(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setUpdating(true)
    setFormError(null)

    try {
      const response = await apiClient.updateJob(Number(params.id), {
        ...formData,
        quantity: Number.parseInt(formData.quantity),
        print_cost: Number.parseFloat(formData.print_cost || "0"),
        design_cost: Number.parseFloat(formData.design_cost || "0"),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Job updated successfully",
        })
        router.push(`/jobs/${params.id}`)
      } else {
        let errorMessage = "Failed to update job"
        try {
          const errorData = await response.json()
          if (typeof errorData === "object") {
            const messages = Object.entries(errorData)
              .map(([key, val]) =>
                `${key}: ${Array.isArray(val) ? val.join(", ") : val}`
              )
              .join("\n")
            errorMessage = messages
          }
        } catch (parseError) {
          console.error("Error parsing error response:", parseError)
        }
        setFormError(errorMessage)
        toast({
          title: "Error",
          description: "Failed to update job",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error updating job:", error)
      setFormError("A system error occurred. Please try again.")
      toast({
        title: "Error",
        description: "A system error occurred",
        variant: "destructive",
      })
    } finally {
      setUpdating(false)
    }
  }

  if (loading) {
    return (
      <DashboardLayout title="Edit Job">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto"></div>
          <p className="mt-2 text-gray-500">Loading job details...</p>
        </div>
      </DashboardLayout>
    )
  }

  const totalCost =
    Number.parseFloat(formData.print_cost || "0") +
    Number.parseFloat(formData.design_cost || "0")

  return (
    <DashboardLayout title={`Edit Job ${formData.docket_number}`}>
      <Toaster />
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Edit Job {formData.docket_number}
            </h1>
            <p className="text-gray-600">
              Update the job details below
            </p>
          </div>

          {formError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl shadow-sm mb-6">
              <div className="font-semibold mb-1">
                There were errors with your submission:
              </div>
              <pre className="whitespace-pre-wrap text-sm">{formError}</pre>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Job Information Section */}
            <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
              <h2 className="text-xl font-semibold mb-4">Job Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Branch
                  </label>
                  <select
                    value={formData.branch}
                    onChange={(e) =>
                      setFormData({ ...formData, branch: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white transition-all"
                    required
                  >
                    <option value="BORROWDALE">Borrowdale</option>
                    <option value="PADDINGTON">Paddington</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Job Type
                  </label>
                  <input
                    type="text"
                    value={formData.job_type}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-100 text-gray-600"
                    disabled
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Docket Number
                  </label>
                  <input
                    type="text"
                    value={formData.docket_number}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-100 text-gray-600"
                    disabled
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Sales Representative
                  </label>
                  <input
                    type="text"
                    value={formData.sales_rep}
                    onChange={(e) =>
                      setFormData({ ...formData, sales_rep: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white transition-all"
                    placeholder="Enter sales representative name"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Customer Information Section */}
            <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
              <h2 className="text-xl font-semibold mb-4">Customer Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Customer Name
                  </label>
                  <input
                    type="text"
                    value={formData.customer}
                    onChange={(e) =>
                      setFormData({ ...formData, customer: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white transition-all"
                    placeholder="Enter customer name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Contact Person
                  </label>
                  <input
                    type="text"
                    value={formData.contact_person}
                    onChange={(e) =>
                      setFormData({ ...formData, contact_person: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white transition-all"
                    placeholder="Enter contact person name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Mobile Number
                  </label>
                  <input
                    type="tel"
                    value={formData.mobile_number}
                    onChange={(e) =>
                      setFormData({ ...formData, mobile_number: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white transition-all"
                    placeholder="Enter mobile number"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={formData.email_address}
                    onChange={(e) =>
                      setFormData({ ...formData, email_address: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white transition-all"
                    placeholder="Enter email address"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Product Specifications Section */}
            <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
              <h2 className="text-xl font-semibold mb-4">Product Specifications</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Product Type
                  </label>
                  <select
                    value={formData.product_type}
                    onChange={(e) =>
                      setFormData({ ...formData, product_type: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white transition-all"
                    required
                  >
                    <option value="">Select product type</option>
                    {productTypes.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Paper Type
                  </label>
                  <select
                    value={formData.paper_type}
                    onChange={(e) =>
                      setFormData({ ...formData, paper_type: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white transition-all"
                    required
                    disabled={!formData.product_type || loadingPaperTypes}
                  >
                    <option value="">
                      {loadingPaperTypes 
                        ? "Loading paper types..." 
                        : formData.product_type 
                          ? "Select paper type"
                          : "Select product type first"}
                    </option>
                    {paperTypes.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Paper Weight
                  </label>
                  <select
                    value={formData.paper_weight}
                    onChange={(e) =>
                      setFormData({ ...formData, paper_weight: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white transition-all"
                    required
                    disabled={!formData.paper_type || loadingWeights}
                  >
                    <option value="">
                      {loadingWeights 
                        ? "Loading weights..." 
                        : formData.paper_type 
                          ? "Select paper weight"
                          : "Select paper type first"}
                    </option>
                    {paperWeights.map((weight) => (
                      <option key={weight.id} value={weight.id}>
                        {weight.gsm} GSM
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Paper Size
                  </label>
                  <select
                    value={formData.paper_size}
                    onChange={(e) =>
                      setFormData({ ...formData, paper_size: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white transition-all"
                    required
                    disabled={!formData.paper_weight || loadingSizes}
                  >
                    <option value="">
                      {loadingSizes 
                        ? "Loading sizes..." 
                        : formData.paper_weight 
                          ? "Select paper size"
                          : "Select paper weight first"}
                    </option>
                    {paperSizes.map((size) => (
                      <option key={size.id} value={size.id}>
                        {size.name} ({size.width_mm}mm x {size.height_mm}mm)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Quantity
                  </label>
                  <input
                    type="number"
                    value={formData.quantity}
                    onChange={(e) =>
                      setFormData({ ...formData, quantity: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white transition-all"
                    placeholder="Enter quantity"
                    required
                    min="1"
                  />
                </div>
              </div>
            </div>

            {/* Description and Notes Section */}
            <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
              <h2 className="text-xl font-semibold mb-4">Description and Notes</h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white transition-all"
                    rows={3}
                    placeholder="Enter detailed job description"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Notes
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white transition-all"
                    rows={3}
                    placeholder="Enter any additional notes or special requirements"
                  />
                </div>
              </div>
            </div>

            {/* Cost Section */}
            <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
              <h2 className="text-xl font-semibold mb-4">Cost Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Print Cost ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.print_cost}
                    onChange={(e) =>
                      setFormData({ ...formData, print_cost: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white transition-all"
                    placeholder="0.00"
                    required
                    min="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Design Cost ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.design_cost}
                    onChange={(e) =>
                      setFormData({ ...formData, design_cost: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white transition-all"
                    placeholder="0.00"
                    required
                    min="0"
                  />
                </div>
              </div>

              <div className="mt-6">
                <div className="bg-gradient-to-r from-primary-50 to-secondary-50 p-6 rounded-xl border border-primary-200">
                  <div className="text-center">
                    <div className="text-sm font-medium text-gray-600 mb-1">
                      Total Cost
                    </div>
                    <div className="text-3xl font-bold text-primary-600">
                      ${totalCost.toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-4 pt-6">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-all duration-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={updating}
                className="bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white font-semibold px-8 py-3 rounded-xl transition-all duration-200 disabled:opacity-50 shadow-lg hover:shadow-xl"
              >
                {updating ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Updating Job...</span>
                  </div>
                ) : (
                  "Update Job"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  )
} 