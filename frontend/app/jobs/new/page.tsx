"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
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

interface JobFormData {
  branch: string
  job_type: string
  docket_number: string
  sales_rep: string
  order_taken_by: string
  customer: string
  contact_person: string
  mobile_number: string
  email_address: string
  quantity: string
  description: string
  product_type: string
  paper_type: string
  paper_weight: string
  paper_size: string
  custom_size_name: string
  custom_width_mm: string
  custom_height_mm: string
  notes: string
  print_cost: string
  design_cost: string
}

export default function NewJobPage() {
  const [user, setUser] = useState<User | null>(null)
  const [productTypes, setProductTypes] = useState<ProductType[]>([])
  const [paperTypes, setPaperTypes] = useState<PaperType[]>([])
  const [paperWeights, setPaperWeights] = useState<PaperWeight[]>([])
  const [paperSizes, setPaperSizes] = useState<PaperSize[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [showCustomSize, setShowCustomSize] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const [formData, setFormData] = useState<JobFormData>({
    branch: "BORROWDALE",
    job_type: "LOCAL",
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
    custom_size_name: "",
    custom_width_mm: "",
    custom_height_mm: "",
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
      if (currentUser) {
        setFormData(prev => ({
          ...prev,
          order_taken_by: currentUser.full_name,
          sales_rep: currentUser.role === 'SALES_REPRESENTATIVE' ? currentUser.full_name : ''
        }))
      }
      setLoading(false)
    }

    checkAuth()
  }, [router])

  useEffect(() => {
    const fetchDocketNumber = async () => {
      try {
        const res = await apiClient.getDocketCounter(formData.job_type || "LOCAL")
        if (res.ok) {
          const data = await res.json()
          if (formData.job_type === "LOCAL") {
            setFormData(prev => ({
              ...prev,
              docket_number: data.current_number
                ? `LOC-${Number(data.current_number) + 1}`
                : "LOC-1"
            }))
          } else {
            // For foreign jobs, set a default prefix if empty
            setFormData(prev => ({
              ...prev,
              docket_number: prev.docket_number || "FOR-"
            }))
          }
        }
      } catch (error) {
        // Optionally handle error
      }
    }
    if (user) fetchDocketNumber()
    // Only run on initial load
  }, [user]) // Remove formData.job_type from dependencies

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [productTypesRes, paperTypesRes, paperWeightsRes] = await Promise.all([
          apiClient.getProductTypes(),
          apiClient.getPaperTypes(),
          apiClient.getPaperWeights()
        ])

        if (productTypesRes.ok) setProductTypes((await productTypesRes.json()).results || [])
        if (paperTypesRes.ok) setPaperTypes((await paperTypesRes.json()).results || [])
        if (paperWeightsRes.ok) setPaperWeights((await paperWeightsRes.json()).results || [])
      } catch (error) {
        console.error("Error loading initial data:", error)
        toast({
          title: "Error",
          description: "Failed to load initial data",
          variant: "destructive",
        })
      }
    }

    if (user) loadInitialData()
  }, [user, toast])

  useEffect(() => {
    const fetchSizes = async () => {
      try {
        const res = await apiClient.getCompatibleSizes()
        if (res.ok) {
          setPaperSizes(await res.json())
        } else {
          setPaperSizes([])
        }
      } catch {
        setPaperSizes([])
      }
    }
    fetchSizes()
  }, [])

  const handleSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value
    setFormData({ 
      ...formData, 
      paper_size: value,
      custom_size_name: value === 'other' ? formData.custom_size_name : "",
      custom_width_mm: value === 'other' ? formData.custom_width_mm : "",
      custom_height_mm: value === 'other' ? formData.custom_height_mm : ""
    })
    setShowCustomSize(value === 'other')
  }

  // Add handler for job type change
  const handleJobTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newJobType = e.target.value
    setFormData(prev => ({
      ...prev,
      job_type: newJobType,
      // Only set FOR- prefix if switching to FOREIGN and no FOR- prefix exists
      docket_number: newJobType === "FOREIGN" 
        ? (prev.docket_number.startsWith("FOR-") ? prev.docket_number : "FOR-")
        : prev.docket_number
    }))
  }

  // Add handler for docket number change
  const handleDocketNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value
    if (formData.job_type === "FOREIGN") {
      // Ensure the FOR- prefix is always present for foreign jobs
      if (!value.startsWith("FOR-")) {
        value = "FOR-" + value.replace("FOR-", "")
      }
      setFormData(prev => ({ ...prev, docket_number: value }))
    }
  }

  // Add validation for foreign docket number
  const validateForeignDocketNumber = () => {
    if (formData.job_type === "FOREIGN") {
      if (!formData.docket_number.startsWith("FOR-")) {
        return "Foreign docket numbers must start with FOR-"
      }
      if (formData.docket_number === "FOR-") {
        return "Please complete the docket number"
      }
    }
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setFormError(null)

    // Validate foreign docket number
    const docketError = validateForeignDocketNumber()
    if (docketError) {
      setFormError(docketError)
      setSubmitting(false)
      return
    }

    try {
      const submitData = {
        ...formData,
        quantity: Number(formData.quantity),
        print_cost: Number(formData.print_cost || "0"),
        design_cost: Number(formData.design_cost || "0"),
      }

      if (showCustomSize) {
        const customSizeRes = await apiClient.createCustomSize({
          name: formData.custom_size_name,
          width_mm: Number(formData.custom_width_mm),
          height_mm: Number(formData.custom_height_mm),
          weight_id: formData.paper_weight
        })

        if (!customSizeRes.ok) {
          const errorData = await customSizeRes.json()
          throw new Error(errorData.error || "Failed to create custom size")
        }

        const customSize = await customSizeRes.json()
        submitData.paper_size = customSize.id
      }

      const response = await apiClient.createJob(submitData)
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || errorData.detail || "Failed to create job")
      }

      const job = await response.json()
      
      // Make sure we have a job ID before redirecting
      if (!job || !job.job_id) {
        throw new Error("Invalid response: Missing job ID")
      }

      toast({ 
        title: "Success", 
        description: `Job ${job.docket_number} created successfully` 
      })
      
      // Add a small delay to ensure the job is fully created
      setTimeout(() => {
        router.push(`/jobs/${job.job_id}`)
      }, 500)  // Increased delay to 500ms to ensure backend sync
    } catch (error: any) {
      console.error("Error creating job:", error)
      setFormError(error.message)
      toast({
        title: "Error",
        description: error.message || "Failed to create job",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <DashboardLayout title="New Job">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto"></div>
          <p className="mt-2 text-gray-500">Loading...</p>
        </div>
      </DashboardLayout>
    )
  }

  const totalCost = (Number(formData.print_cost) || 0) + (Number(formData.design_cost) || 0)

  return (
    <DashboardLayout title="New Job">
      <Toaster />
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Create New Job</h1>
            <p className="text-gray-600">Fill in the job details below</p>
          </div>

          {formError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl shadow-sm mb-6">
              <div className="font-semibold mb-1">There were errors with your submission:</div>
              <pre className="whitespace-pre-wrap text-sm">{formError}</pre>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Job Information Section */}
            <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
              <h2 className="text-xl font-semibold mb-4">Job Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Branch</label>
                  <select
                    value={formData.branch}
                    onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white transition-all"
                    required
                  >
                    <option value="BORROWDALE">Borrowdale</option>
                    <option value="PADDINGTON">Paddington</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Job Type</label>
                  <select
                    value={formData.job_type}
                    onChange={handleJobTypeChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white transition-all"
                    required
                  >
                    <option value="LOCAL">Local</option>
                    <option value="FOREIGN">Foreign</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Docket Number</label>
                  <input
                    type="text"
                    value={formData.docket_number}
                    onChange={handleDocketNumberChange}
                    className={`w-full px-4 py-3 border border-gray-300 rounded-xl ${
                      formData.job_type === "FOREIGN" 
                        ? "bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent" 
                        : "bg-gray-100 text-gray-600"
                    }`}
                    disabled={formData.job_type !== "FOREIGN"}
                    readOnly={formData.job_type !== "FOREIGN"}
                    placeholder={formData.job_type === "FOREIGN" ? "FOR-..." : "Will be generated"}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Sales Representative</label>
                  <input
                    type="text"
                    value={formData.sales_rep}
                    onChange={(e) => setFormData({ ...formData, sales_rep: e.target.value })}
                    className={`w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all ${user?.role === 'SALES_REPRESENTATIVE' ? 'bg-gray-100 text-gray-600' : 'bg-white'}`}
                    placeholder="Enter sales representative name"
                    required
                    readOnly={user?.role === 'SALES_REPRESENTATIVE'}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Order Taken By</label>
                  <input
                    type="text"
                    value={formData.order_taken_by}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-100 text-gray-600"
                    disabled
                  />
                </div>
              </div>
            </div>

            {/* Customer Information Section */}
            <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
              <h2 className="text-xl font-semibold mb-4">Customer Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Customer Name</label>
                  <input
                    type="text"
                    value={formData.customer}
                    onChange={(e) => setFormData({ ...formData, customer: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white transition-all"
                    placeholder="Enter customer name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Contact Person</label>
                  <input
                    type="text"
                    value={formData.contact_person}
                    onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white transition-all"
                    placeholder="Enter contact person name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Mobile Number</label>
                  <input
                    type="tel"
                    value={formData.mobile_number}
                    onChange={(e) => setFormData({ ...formData, mobile_number: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white transition-all"
                    placeholder="Enter mobile number"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                  <input
                    type="email"
                    value={formData.email_address}
                    onChange={(e) => setFormData({ ...formData, email_address: e.target.value })}
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
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Product Type</label>
                  <select
                    value={formData.product_type}
                    onChange={(e) => setFormData({ ...formData, product_type: e.target.value, paper_type: "", paper_weight: "", paper_size: "" })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white transition-all"
                    required
                  >
                    <option value="">Select product type</option>
                    {productTypes.map((type) => (
                      <option key={type.id} value={type.id}>{type.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Paper Type</label>
                  <select
                    value={formData.paper_type}
                    onChange={(e) => setFormData({ ...formData, paper_type: e.target.value, paper_weight: "", paper_size: "" })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white transition-all"
                    required
                  >
                    <option value="">Select paper type</option>
                    {paperTypes.map((type) => (
                      <option key={type.id} value={type.id}>{type.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Paper Weight</label>
                  <select
                    value={formData.paper_weight}
                    onChange={(e) => setFormData({ ...formData, paper_weight: e.target.value, paper_size: "" })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white transition-all"
                    required
                  >
                    <option value="">Select paper weight</option>
                    {paperWeights.map((weight) => (
                      <option key={weight.id} value={weight.id}>{weight.gsm} GSM</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Paper Size</label>
                    <select
                      value={formData.paper_size}
                      onChange={handleSizeChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white transition-all"
                      required
                    >
                      <option value="">Select paper size</option>
                      {paperSizes.map((size) => (
                        <option key={size.id} value={size.id}>
                          {`${size.name} (${size.width_mm}mm × ${size.height_mm}mm)`}
                        </option>
                      ))}
                      <option value="other">Other (Custom Size)</option>
                    </select>
                </div>

                {showCustomSize && (
                  <div className="col-span-2 space-y-6 bg-gray-50 p-6 rounded-xl border border-gray-200 mt-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Custom Size Name</label>
                      <input
                        type="text"
                        value={formData.custom_size_name}
                        onChange={(e) => setFormData({ ...formData, custom_size_name: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white transition-all"
                        placeholder="Enter a name for this custom size"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Width (mm)</label>
                        <input
                          type="number"
                          value={formData.custom_width_mm}
                          onChange={(e) => setFormData({ ...formData, custom_width_mm: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white transition-all"
                          placeholder="Enter width"
                          required
                          min="1"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Height (mm)</label>
                        <input
                          type="number"
                          value={formData.custom_height_mm}
                          onChange={(e) => setFormData({ ...formData, custom_height_mm: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white transition-all"
                          placeholder="Enter height"
                          required
                          min="1"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Quantity</label>
                  <input
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
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
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white transition-all"
                    rows={3}
                    placeholder="Enter detailed job description"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white transition-all"
                    rows={3}
                    placeholder="Enter any additional notes"
                  />
                </div>
              </div>
            </div>

            {/* Cost Section */}
            <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
              <h2 className="text-xl font-semibold mb-4">Cost Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Print Cost ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.print_cost}
                    onChange={(e) => setFormData({ ...formData, print_cost: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white transition-all"
                    placeholder="0.00"
                    required
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Design Cost ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.design_cost}
                    onChange={(e) => setFormData({ ...formData, design_cost: e.target.value })}
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
                    <div className="text-sm font-medium text-gray-600 mb-1">Total Cost</div>
                    <div className="text-3xl font-bold text-primary-600">${totalCost.toFixed(2)}</div>
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
                disabled={submitting}
                className="bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white font-semibold px-8 py-3 rounded-xl transition-all duration-200 disabled:opacity-50 shadow-lg hover:shadow-xl"
              >
                {submitting ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Creating Job...</span>
                  </div>
                ) : (
                  "Create Job"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  )
}