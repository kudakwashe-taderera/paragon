"use client"

import { useState, useEffect } from "react"
import { apiClient } from "@/lib/api"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { useToast } from "@/hooks/use-toast"

interface Job {
  job_id: number
  docket_number: string
  customer: string
  description: string
  quantity: number
  product_type: {
    name: string
  }
  paper_size: {
    name: string
  }
  created_at: string
  branch: string
  print_cost: number
}

interface Props {
  onJobStatusChange?: () => void
}

export default function JobsReadyToPrint({ onJobStatusChange }: Props) {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedJobs, setSelectedJobs] = useState<number[]>([])
  const [sortField, setSortField] = useState<string>("created_at")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [branchFilter, setBranchFilter] = useState<string>("all")
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    fetchJobsReadyToPrint()
    // Refresh every 30 seconds
    const interval = setInterval(fetchJobsReadyToPrint, 30000)
    return () => clearInterval(interval)
  }, [sortField, sortOrder, branchFilter])

  const fetchJobsReadyToPrint = async () => {
    try {
      const response = await apiClient.getJobs({ 
        status: "PENDING",
        ordering: `${sortOrder === "desc" ? "-" : ""}${sortField}`,
        ...(branchFilter !== "all" ? { branch: branchFilter } : {})
      })
      if (response.ok) {
        const data = await response.json()
        setJobs(data.results || data)
      }
    } catch (error) {
      console.error("Error fetching jobs ready to print:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAsPrinted = async (jobId: number) => {
    try {
      const response = await apiClient.updateJobStatus(jobId, "PRINTED")
      if (response.ok) {
        toast({
          title: "Success",
          description: "Job marked as printed",
          variant: "default",
        })
        fetchJobsReadyToPrint()
        if (onJobStatusChange) {
          onJobStatusChange()
        }
      }
    } catch (error) {
      console.error("Error updating job status:", error)
      toast({
        title: "Error",
        description: "Failed to update job status",
        variant: "destructive",
      })
    }
  }

  const handleMarkSelectedAsPrinted = async () => {
    try {
      await Promise.all(
        selectedJobs.map(jobId => apiClient.updateJobStatus(jobId, "PRINTED"))
      )
      toast({
        title: "Success",
        description: `${selectedJobs.length} jobs marked as printed`,
        variant: "default",
      })
      setSelectedJobs([])
      fetchJobsReadyToPrint()
      if (onJobStatusChange) {
        onJobStatusChange()
      }
    } catch (error) {
      console.error("Error updating job statuses:", error)
      toast({
        title: "Error",
        description: "Failed to update some job statuses",
        variant: "destructive",
      })
    }
  }

  const handleViewDetails = (jobId: number) => {
    router.push(`/jobs/${jobId}`)
  }

  const handleSort = (field: string) => {
    if (field === sortField) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortOrder("asc")
    }
  }

  const toggleSelectAll = () => {
    if (selectedJobs.length === jobs.length) {
      setSelectedJobs([])
    } else {
      setSelectedJobs(jobs.map(job => job.job_id))
    }
  }

  const toggleSelectJob = (jobId: number) => {
    if (selectedJobs.includes(jobId)) {
      setSelectedJobs(selectedJobs.filter(id => id !== jobId))
    } else {
      setSelectedJobs([...selectedJobs, jobId])
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
    return <div className="text-center py-8 text-gray-500">No jobs ready to print</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <select
            value={branchFilter}
            onChange={(e) => setBranchFilter(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">All Branches</option>
            <option value="BORROWDALE">Borrowdale</option>
            <option value="EASTLEA">Eastlea</option>
            <option value="BELGRAVIA">Belgravia</option>
            <option value="AVONDALE">Avondale</option>
            <option value="MSASA">Msasa</option>
            <option value="CHITUNGWIZA">Chitungwiza</option>
          </select>
          
          {selectedJobs.length > 0 && (
            <button
              onClick={handleMarkSelectedAsPrinted}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Mark Selected as Printed ({selectedJobs.length})
            </button>
          )}
        </div>
        
        <div className="text-sm text-gray-600">
          Total Jobs: {jobs.length} | Selected: {selectedJobs.length}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500">
                <input
                  type="checkbox"
                  checked={selectedJobs.length === jobs.length}
                  onChange={toggleSelectAll}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
              </th>
              <th 
                scope="col" 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort("docket_number")}
              >
                Job Details {sortField === "docket_number" && (sortOrder === "asc" ? "↑" : "↓")}
              </th>
              <th 
                scope="col" 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort("product_type__name")}
              >
                Product Info {sortField === "product_type__name" && (sortOrder === "asc" ? "↑" : "↓")}
              </th>
              <th 
                scope="col" 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort("created_at")}
              >
                Date {sortField === "created_at" && (sortOrder === "asc" ? "↑" : "↓")}
              </th>
              <th 
                scope="col" 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort("print_cost")}
              >
                Cost {sortField === "print_cost" && (sortOrder === "asc" ? "↑" : "↓")}
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {jobs.map((job) => (
              <tr key={job.job_id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <input
                    type="checkbox"
                    checked={selectedJobs.includes(job.job_id)}
                    onChange={() => toggleSelectJob(job.job_id)}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{job.docket_number}</div>
                      <div className="text-sm text-gray-500">{job.customer}</div>
                      <div className="text-xs text-gray-400 mt-1">{job.description}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{job.product_type.name}</div>
                  <div className="text-sm text-gray-500">
                    Qty: {job.quantity} | Size: {job.paper_size.name}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">{job.branch}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {format(new Date(job.created_at), "MMM d, yyyy HH:mm")}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  ${typeof job.print_cost === 'number' ? job.print_cost.toFixed(2) : '0.00'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                  <button
                    onClick={() => handleMarkAsPrinted(job.job_id)}
                    className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    Mark Printed
                  </button>
                  <button
                    onClick={() => handleViewDetails(job.job_id)}
                    className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
