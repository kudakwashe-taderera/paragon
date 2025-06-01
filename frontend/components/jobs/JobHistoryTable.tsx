"use client"

import { useState, useEffect } from "react"
import { apiClient } from "@/lib/api"
import { useRouter } from "next/navigation"
import { formatDateTime } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

interface Job {
  job_id: number
  docket_number: string
  customer: string
  status: string
  created_at: string
  updated_at: string
  order_taken_by: string
  payment_status: string
  payment_ref: string
  total_cost: number
  branch: string
}

interface JobHistoryTableProps {
  filters: {
    search: string
    status: string
    paymentStatus: string
    branch: string
    sortBy: string
    sortOrder: string
    page: number
    pageSize: number
  }
  onTotalPagesChange: (pages: number) => void
  onTotalJobsChange: (total: number) => void
  loading: boolean
  setLoading: (loading: boolean) => void
}

export default function JobHistoryTable({
  filters,
  onTotalPagesChange,
  onTotalJobsChange,
  loading,
  setLoading
}: JobHistoryTableProps) {
  const [jobs, setJobs] = useState<Job[]>([])
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    fetchJobs()
  }, [filters])

  const fetchJobs = async () => {
    setLoading(true)
    try {
      // Construct query parameters
      const queryParams = new URLSearchParams({
        page: filters.page.toString(),
        page_size: filters.pageSize.toString(),
        ordering: `${filters.sortOrder === 'desc' ? '-' : ''}${filters.sortBy}`,
      })

      if (filters.search) {
        queryParams.append('search', filters.search)
      }
      
      if (filters.status && filters.status !== 'all') {
        queryParams.append('status', filters.status.toUpperCase())
      }
      
      if (filters.paymentStatus && filters.paymentStatus !== 'all') {
        queryParams.append('payment_status', filters.paymentStatus.toUpperCase())
      }
      
      if (filters.branch && filters.branch !== 'all') {
        queryParams.append('branch', filters.branch)
      }

      const response = await apiClient.getJobs(Object.fromEntries(queryParams))
      
      if (response.ok) {
        const data = await response.json()
        setJobs(data.results || [])
        onTotalPagesChange(Math.ceil((data.count || 0) / filters.pageSize))
        onTotalJobsChange(data.count || 0)
      } else {
        let errorMessage = "Failed to fetch jobs"
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
      console.error("Error fetching jobs:", error)
      toast({
        title: "Error",
        description: "Failed to load jobs",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleViewDetails = (jobId: number) => {
    router.push(`/jobs/${jobId}`)
  }

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-800"
      case "PRINTED":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getPaymentStatusBadgeClass = (status: string) => {
    switch (status) {
      case "RECEIPTED":
        return "bg-green-100 text-green-800"
      case "INVOICED":
        return "bg-blue-100 text-blue-800"
      case "NOT_MARKED":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto"></div>
        <p className="mt-2 text-gray-500">Loading jobs...</p>
      </div>
    )
  }

  if (jobs.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No jobs found matching your criteria
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Docket #</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Branch</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {jobs.map((job) => (
            <tr key={job.job_id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{job.docket_number}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{job.customer}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{job.branch}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {formatDateTime(job.created_at)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${getStatusBadgeClass(job.status)}`}>
                  {job.status}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${getPaymentStatusBadgeClass(job.payment_status)}`}>
                  {job.payment_status.replace("_", " ")}
                </span>
                {job.payment_ref && (
                  <span className="ml-2 text-xs text-gray-500">
                    ({job.payment_ref})
                  </span>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                ${typeof job.total_cost === 'number' ? job.total_cost.toFixed(2) : Number(job.total_cost).toFixed(2)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <button
                  onClick={() => handleViewDetails(job.job_id)}
                  className="text-primary-600 hover:text-primary-900"
                >
                  View Details
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
} 