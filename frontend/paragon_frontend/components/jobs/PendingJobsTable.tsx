"use client"

import { useState, useEffect } from "react"
import { apiClient } from "@/lib/api"
import { useRouter } from "next/navigation"

interface Job {
  job_id: number
  customer: string
  description: string
  quantity: number
  total_cost: number
  created_at: string
  status: string
  branch: string
  product_type_name: string
}

interface PendingJobsTableProps {
  onJobStatusChange?: () => void
}

export default function PendingJobsTable({ onJobStatusChange }: PendingJobsTableProps) {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetchPendingJobs()
  }, [])

  const fetchPendingJobs = async () => {
    try {
      const response = await apiClient.getPendingJobs()
      if (response.ok) {
        const data = await response.json()
        setJobs(data)
      }
    } catch (error) {
      console.error("Error fetching pending jobs:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAsPrinted = async (jobId: number) => {
    try {
      const response = await apiClient.updateJobStatus(jobId, "PRINTED")
      if (response.ok) {
        fetchPendingJobs() // Refresh the list
        if (onJobStatusChange) {
          onJobStatusChange() // Notify parent to refresh stats
        }
      }
    } catch (error) {
      console.error("Error updating job status:", error)
    }
  }

  const handleViewDetails = (jobId: number) => {
    router.push(`/jobs/${jobId}`)
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto"></div>
        <p className="mt-2 text-gray-500">Loading pending jobs...</p>
      </div>
    )
  }

  if (jobs.length === 0) {
    return <div className="text-center py-8 text-gray-500">No pending jobs found</div>
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Job ID</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Description
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Total Cost
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Branch</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {jobs.map((job) => (
            <tr key={job.job_id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">#{job.job_id}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{job.customer}</td>
              <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">{job.description}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{job.quantity}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${job.total_cost}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{job.branch}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <button
                  onClick={() => handleMarkAsPrinted(job.job_id)}
                  className="text-green-600 hover:text-green-900 mr-3"
                >
                  Mark as Printed
                </button>
                <button 
                  onClick={() => handleViewDetails(job.job_id)}
                  className="text-blue-600 hover:text-blue-900"
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
