"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { AuthService, type User } from "@/lib/auth"
import { apiClient } from "@/lib/api"
import DashboardLayout from "@/components/layout/DashboardLayout"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"
import Link from "next/link"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface Job {
  job_id: number
  docket_number: string
  customer: string
  contact_person: string
  mobile_number: string
  email_address: string
  description: string
  quantity: number
  branch: string
  job_type: string
  status: string
  payment_status: string
  payment_ref: string
  print_cost: string | number
  design_cost: string | number
  total_cost: string | number
  notes: string
  created_at: string
  updated_at: string
  order_taken_by: string
  printed_at: string | null
  printed_by: string | null
  sales_rep: string | null
  product_type: {
    id: string
    name: string
  }
  paper_type: {
    id: string
    name: string
  }
  paper_weight: {
    id: string
    gsm: number
  }
  paper_size: {
    id: string
    name: string
    width_mm: number
    height_mm: number
  }
}

export default function JobDetailPage() {
  const [job, setJob] = useState<Job | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [showPrintConfirmation, setShowPrintConfirmation] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentStatus, setPaymentStatus] = useState("")
  const [paymentRef, setPaymentRef] = useState("")
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()

  useEffect(() => {
    const checkAuth = async () => {
      if (!AuthService.isAuthenticated()) {
        router.push("/login")
        return
      }

      const currentUser = await AuthService.getCurrentUser()
      setUser(currentUser)
      if (currentUser && params.id) {
        const jobId = Number(params.id)
        if (!isNaN(jobId)) {
          fetchJob(jobId)
        } else {
          toast({
            title: "Error",
            description: "Invalid job ID",
            variant: "destructive",
          })
          router.push("/jobs")
        }
      }
    }

    checkAuth()
  }, [router, params.id])

  const fetchJob = async (jobId: number) => {
    try {
      const response = await apiClient.getJob(jobId)
      if (response.ok) {
        const data = await response.json()
        setJob(data)
      } else {
        let errorMessage = "Job not found"
        try {
          const errorData = await response.json()
          if (typeof errorData === "object" && errorData.error) {
            errorMessage = errorData.error
          }
        } catch (parseError) {
          console.error("Error parsing error response:", parseError)
        }
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        })
        router.push("/jobs")
      }
    } catch (error) {
      console.error("Error fetching job:", error)
      toast({
        title: "Error",
        description: "Failed to load job details",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async (newStatus: string) => {
    if (!job) return

    setUpdating(true)
    try {
      const response = await apiClient.updateJobStatus(job.job_id, newStatus)
      if (response.ok) {
        const data = await response.json()
        setJob(data)
        toast({
          title: "Success",
          description: `Job marked as ${newStatus.toLowerCase()}`,
        })
      } else {
        let errorMessage = "Failed to update job status"
        try {
          const errorData = await response.json()
          if (typeof errorData === "object" && errorData.error) {
            errorMessage = errorData.error
          }
        } catch (parseError) {
          console.error("Error parsing error response:", parseError)
        }
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error updating job status:", error)
      toast({
        title: "Error",
        description: "Failed to update job status",
        variant: "destructive",
      })
    } finally {
      setUpdating(false)
      setShowPrintConfirmation(false)
    }
  }

  const handleUpdatePayment = async () => {
    if (!job || !paymentStatus) return

    setUpdating(true)
    try {
      const response = await apiClient.updateJobPayment(job.job_id, {
        payment_status: paymentStatus,
        payment_ref: paymentRef,
      })
      if (response.ok) {
        const updatedJob = await response.json()
        setJob(updatedJob)
        setShowPaymentModal(false)
        setPaymentStatus("")
        setPaymentRef("")
        toast({
          title: "Success",
          description: "Payment status updated successfully",
        })
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to update payment status")
      }
    } catch (error: any) {
      console.error("Error updating payment status:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to update payment status",
        variant: "destructive",
      })
    } finally {
      setUpdating(false)
    }
  }

  const formatCost = (cost: string | number | null | undefined): string => {
    if (cost === null || cost === undefined) return '0.00';
    const numCost = typeof cost === 'string' ? parseFloat(cost) : cost;
    return numCost.toFixed(2);
  };

  const formatDateTime = (dateString: string | null | undefined): string => {
    if (!dateString) return 'Not available';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid date';
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch (error) {
      return 'Invalid date';
    }
  };

  const canEditJob = (job: Job, user: User | null): boolean => {
    if (!user || !job) return false;
    
    // Job can't be edited if it's already printed
    if (job.status === "PRINTED") return false;
    
    // Superuser can edit any job that's not printed
    if (user.role === "SUPERUSER") return true;
    
    // Creator can edit their own jobs if not printed
    if (job.order_taken_by === user.full_name) return true;
    
    return false;
  };

  const canUpdateStatus = user?.role === "DESIGNER" || user?.role === "OPERATOR" || user?.role === "SUPERUSER"
  const canUpdatePayment = user?.role === "CLERK" || user?.role === "SUPERUSER"

  if (loading) {
    return (
      <DashboardLayout title="Job Details">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto"></div>
          <p className="mt-2 text-gray-500">Loading job details...</p>
        </div>
      </DashboardLayout>
    )
  }

  if (!job) {
    return (
      <DashboardLayout title="Job Details">
        <div className="text-center py-8 text-gray-500">Job not found</div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title={`Job ${job.docket_number}`}>
      <Toaster />
      <div className="space-y-6">
        {/* Job Header */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Job {job.docket_number}
              </h1>
              <div className="flex space-x-4">
                <span
                  className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                    job.status === "PENDING"
                      ? "bg-yellow-100 text-yellow-800"
                      : job.status === "PRINTED"
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {job.status}
                </span>
                <span
                  className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                    job.payment_status === "NOT_MARKED"
                      ? "bg-red-100 text-red-800"
                      : job.payment_status === "RECEIPTED"
                        ? "bg-green-100 text-green-800"
                        : job.payment_status === "INVOICED"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {job.payment_status.replace("_", " ")}
                </span>
              </div>
            </div>
            <div className="flex space-x-3">
              {canUpdateStatus && job.status === "PENDING" && (
                <button
                  onClick={() => setShowPrintConfirmation(true)}
                  disabled={updating}
                  className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  Mark as Printed
                </button>
              )}
              {canUpdatePayment && job.payment_status === "NOT_MARKED" && (
                <button
                  onClick={() => setShowPaymentModal(true)}
                  disabled={updating}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  Update Payment
                </button>
              )}
              {canEditJob(job, user) && (
                <Link 
                  href={`/jobs/${job.job_id}/edit`}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Edit Job
                </Link>
              )}
              <button
                onClick={() => router.back()}
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Back
              </button>
            </div>
          </div>
        </div>

        {/* Print Confirmation Dialog */}
        <AlertDialog open={showPrintConfirmation} onOpenChange={setShowPrintConfirmation}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Mark Job as Printed?</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to mark this job as printed? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => handleStatusUpdate("PRINTED")}
                className="bg-green-500 hover:bg-green-600"
              >
                Yes, Mark as Printed
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Payment Update Modal */}
        <AlertDialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Update Payment Status</AlertDialogTitle>
              <AlertDialogDescription>
                Update the payment status for job {job?.docket_number}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Status</label>
                <select
                  value={paymentStatus}
                  onChange={(e) => setPaymentStatus(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="">Select status</option>
                  <option value="RECEIPTED">Receipted</option>
                  <option value="INVOICED">Invoiced</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Reference</label>
                <input
                  type="text"
                  value={paymentRef}
                  onChange={(e) => setPaymentRef(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="Enter reference number"
                  required={paymentStatus !== ""}
                />
              </div>
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel
                onClick={() => {
                  setPaymentStatus("")
                  setPaymentRef("")
                }}
              >
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleUpdatePayment}
                disabled={!paymentStatus || (paymentStatus && !paymentRef) || updating}
                className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300"
              >
                {updating ? "Updating..." : "Update Payment"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Job Details Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Customer Information */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Customer Information</h2>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-500">Customer</label>
                <p className="text-gray-900">{job.customer}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Contact Person</label>
                <p className="text-gray-900">{job.contact_person}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Mobile Number</label>
                <p className="text-gray-900">{job.mobile_number}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Email</label>
                <p className="text-gray-900">{job.email_address}</p>
              </div>
            </div>
          </div>

          {/* Job Information */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Job Information</h2>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-500">Branch</label>
                <p className="text-gray-900">{job.branch}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Job Type</label>
                <p className="text-gray-900">{job.job_type}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Product Type</label>
                <p className="text-gray-900">{job.product_type?.name || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Paper Type</label>
                <p className="text-gray-900">{job.paper_type?.name || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Product Details */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Product Details</h2>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-500">Description</label>
                <p className="text-gray-900">{job.description}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Quantity</label>
                <p className="text-gray-900">{job.quantity}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Paper Weight</label>
                <p className="text-gray-900">{job.paper_weight?.gsm || 'N/A'} GSM</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Paper Size</label>
                <p className="text-gray-900">
                  {job.paper_size ? `${job.paper_size.name} (${job.paper_size.width_mm}mm × ${job.paper_size.height_mm}mm)` : 'N/A'}
                </p>
              </div>
            </div>
          </div>

          {/* Financial Information */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Financial Information</h2>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-500">Print Cost</label>
                <p className="text-gray-900">${formatCost(job.print_cost)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Design Cost</label>
                <p className="text-gray-900">${formatCost(job.design_cost)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Total Cost</label>
                <p className="text-xl font-bold text-primary-600">
                  ${formatCost(job.total_cost)}
                </p>
              </div>
              {job.payment_ref && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Payment Reference</label>
                  <p className="text-gray-900">{job.payment_ref}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Notes */}
        {job.notes && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Notes</h2>
            <p className="text-gray-900">{job.notes}</p>
          </div>
        )}

        {/* Personnel Information */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Personnel Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Created By</label>
              <p className="text-gray-900">{job.order_taken_by}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Sales Representative</label>
              <p className="text-gray-900">{job.sales_rep || "-"}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Printed By</label>
              <p className="text-gray-900">{job.printed_by || "-"}</p>
            </div>
          </div>
        </div>

        {/* Timestamps */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Timeline</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Created</label>
              <p className="text-gray-900">{formatDateTime(job.created_at)}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Last Updated</label>
              <p className="text-gray-900">{formatDateTime(job.updated_at)}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Printed Time</label>
              <p className="text-gray-900">{job.printed_at ? formatDateTime(job.printed_at) : "-"}</p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
