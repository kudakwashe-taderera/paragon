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
  quantity: number
  product_type: {
    name: string
  }
  paper_size: {
    name: string
  }
  created_at: string
  estimated_time?: number // in minutes
  priority: "HIGH" | "MEDIUM" | "LOW"
  status: "PENDING" | "PRINTING" | "PAUSED"
}

export default function PrintQueue() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [activeJob, setActiveJob] = useState<number | null>(null)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    fetchPrintQueue()
    // Refresh every minute
    const interval = setInterval(fetchPrintQueue, 60000)
    return () => clearInterval(interval)
  }, [])

  const fetchPrintQueue = async () => {
    try {
      const response = await apiClient.getJobs({ 
        status: "PENDING",
        ordering: "-priority,created_at"
      })
      if (response.ok) {
        const data = await response.json()
        // Add estimated time and default priority/status
        const jobsWithMeta = (data.results || data).map((job: Job) => ({
          ...job,
          estimated_time: estimatePrintTime(job.quantity, job.product_type.name),
          priority: job.priority || "MEDIUM",
          status: job.status || "PENDING"
        }))
        setJobs(jobsWithMeta)
      }
    } catch (error) {
      console.error("Error fetching print queue:", error)
    } finally {
      setLoading(false)
    }
  }

  const estimatePrintTime = (quantity: number, productType: string): number => {
    const baseTimePerUnit = {
      "Business Cards": 0.01, // 1 minute per 100 cards
      "Flyers": 0.05, // 3 seconds per flyer
      "Booklets": 2, // 2 minutes per booklet
      "Posters": 5, // 5 minutes per poster
      // Add more product types as needed
    }
    const baseTime = baseTimePerUnit[productType as keyof typeof baseTimePerUnit] || 0.1
    return Math.ceil(quantity * baseTime)
  }

  const formatEstimatedTime = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes}m`
    }
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`
  }

  const handleViewDetails = (jobId: number) => {
    router.push(`/jobs/${jobId}`)
  }

  const handleStartJob = async (jobId: number) => {
    if (activeJob && activeJob !== jobId) {
      toast({
        title: "Warning",
        description: "Please finish or pause the current job first",
        variant: "destructive",
      })
      return
    }

    setActiveJob(jobId)
    const updatedJobs = jobs.map(job => 
      job.job_id === jobId ? { ...job, status: "PRINTING" as const } : job
    )
    setJobs(updatedJobs)
  }

  const handlePauseJob = (jobId: number) => {
    setActiveJob(null)
    const updatedJobs = jobs.map(job => 
      job.job_id === jobId ? { ...job, status: "PAUSED" as const } : job
    )
    setJobs(updatedJobs)
  }

  const handlePriorityChange = (jobId: number, priority: Job["priority"]) => {
    const updatedJobs = jobs.map(job => 
      job.job_id === jobId ? { ...job, priority } : job
    )
    setJobs(updatedJobs)
  }

  const getPriorityColor = (priority: Job["priority"]) => {
    switch (priority) {
      case "HIGH":
        return "bg-red-100 text-red-800"
      case "MEDIUM":
        return "bg-yellow-100 text-yellow-800"
      case "LOW":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto"></div>
        <p className="mt-2 text-gray-500">Loading print queue...</p>
      </div>
    )
  }

  if (jobs.length === 0) {
    return <div className="text-center py-8 text-gray-500">No jobs in the print queue</div>
  }

  const totalEstimatedTime = jobs.reduce((total, job) => total + (job.estimated_time || 0), 0)

  return (
    <div className="space-y-4">
      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="text-sm text-gray-600">
          Estimated total time: <span className="font-semibold">{formatEstimatedTime(totalEstimatedTime)}</span>
        </div>
      </div>
      
      <div className="space-y-2">
        {jobs.map((job, index) => (
          <div
            key={job.job_id}
            className={`bg-white rounded-lg border ${job.status === "PRINTING" ? "border-blue-500" : "border-gray-200"} p-4 hover:shadow-md transition-shadow`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  <div className="text-sm font-medium text-gray-900">#{index + 1}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900">{job.docket_number}</div>
                  <div className="text-sm text-gray-500">{job.customer}</div>
                  <div className="text-sm text-gray-500">
                    {job.product_type.name} - Qty: {job.quantity} | Size: {job.paper_size.name}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <select
                    value={job.priority}
                    onChange={(e) => handlePriorityChange(job.job_id, e.target.value as Job["priority"])}
                    className={`text-xs font-medium px-2.5 py-0.5 rounded ${getPriorityColor(job.priority)}`}
                  >
                    <option value="HIGH">High Priority</option>
                    <option value="MEDIUM">Medium Priority</option>
                    <option value="LOW">Low Priority</option>
                  </select>
                  {job.status === "PAUSED" && (
                    <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded">
                      Paused
                    </span>
                  )}
                  {job.status === "PRINTING" && (
                    <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
                      Printing
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-sm text-gray-500">
                  Est. Time: {formatEstimatedTime(job.estimated_time || 0)}
                </div>
                <div className="flex items-center space-x-2">
                  {job.status !== "PRINTING" ? (
                    <button
                      onClick={() => handleStartJob(job.job_id)}
                      className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Start
                    </button>
                  ) : (
                    <button
                      onClick={() => handlePauseJob(job.job_id)}
                      className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                    >
                      Pause
                    </button>
                  )}
                  <button
                    onClick={() => handleViewDetails(job.job_id)}
                    className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    View
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
} 