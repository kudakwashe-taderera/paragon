"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import DashboardLayout from "@/components/layout/DashboardLayout"
import Link from "next/link"
import { apiClient } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { format } from "date-fns"

interface Job {
  job_id: number
  customer: string
  description: string
  status: string
  total_cost: number
  created_at: string
  docket_number: string
}

interface JobsResponse {
  results: Job[]
}

interface PerformanceStats {
  jobsThisMonth: number
  completedJobs: number
  pendingJobs: number
  recentJobs: Job[]
}

export default function SalesRepDashboard() {
  const [stats, setStats] = useState<PerformanceStats>({
    jobsThisMonth: 0,
    completedJobs: 0,
    pendingJobs: 0,
    recentJobs: []
  })
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const fetchStats = useCallback(async () => {
    try {
      const response = await apiClient.getJobs()
      if (response.ok) {
        const data: JobsResponse = await response.json()
        const jobs = data.results || []

        // Get the start of the current month
        const now = new Date()
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

        const stats = {
          jobsThisMonth: jobs.filter(job => new Date(job.created_at) >= monthStart).length,
          completedJobs: jobs.filter(job => job.status === "PRINTED").length,
          pendingJobs: jobs.filter(job => job.status === "PENDING").length,
          recentJobs: jobs
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            .slice(0, 10)
        }

        setStats(stats)
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to load jobs data")
      }
    } catch (error: any) {
      console.error("Error fetching jobs:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to load jobs data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStats()

    // Set up refresh interval
    intervalRef.current = setInterval(fetchStats, 5000)

    // Cleanup interval on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [fetchStats])

  return (
    <DashboardLayout title="Sales Representative Dashboard">
      <Toaster />
      <div className="space-y-8">
        {/* Add New Job Section */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-semibold mb-6">Add New Job</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-gray-600 mb-4">
                Create new print jobs for your customers. Track orders and manage customer relationships.
              </p>
              <Link 
                href="/jobs/new" 
                className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg inline-flex items-center transition-colors"
              >
                Create New Job
              </Link>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Quick Tips</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Ensure all customer details are accurate</li>
                <li>• Double-check quantities and specifications</li>
                <li>• Add detailed job descriptions</li>
                <li>• Include any special requirements in notes</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Performance Overview */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-semibold mb-6">Performance Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-6 rounded-xl text-center">
              <div className="text-3xl font-bold text-blue-600">
                {loading ? "-" : stats.jobsThisMonth}
              </div>
              <div className="text-sm text-gray-600 mt-1">Jobs This Month</div>
            </div>
            <div className="bg-green-50 p-6 rounded-xl text-center">
              <div className="text-3xl font-bold text-green-600">
                {loading ? "-" : stats.completedJobs}
              </div>
              <div className="text-sm text-gray-600 mt-1">Completed Jobs</div>
            </div>
            <div className="bg-yellow-50 p-6 rounded-xl text-center">
              <div className="text-3xl font-bold text-yellow-600">
                {loading ? "-" : stats.pendingJobs}
              </div>
              <div className="text-sm text-gray-600 mt-1">Pending Jobs</div>
            </div>
          </div>
        </div>

        {/* My Jobs Section */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-semibold mb-6">My Recent Jobs</h2>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto"></div>
              <p className="mt-2 text-gray-500">Loading jobs...</p>
            </div>
          ) : stats.recentJobs.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-gray-600">Docket #</th>
                    <th className="text-left py-3 px-4 text-gray-600">Customer</th>
                    <th className="text-left py-3 px-4 text-gray-600">Description</th>
                    <th className="text-left py-3 px-4 text-gray-600">Status</th>
                    <th className="text-right py-3 px-4 text-gray-600">Amount</th>
                    <th className="text-right py-3 px-4 text-gray-600">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentJobs.map((job) => (
                    <tr key={job.job_id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">{job.docket_number}</td>
                      <td className="py-3 px-4">{job.customer}</td>
                      <td className="py-3 px-4 max-w-xs truncate">{job.description}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                          job.status === "PENDING"
                            ? "bg-yellow-100 text-yellow-800"
                            : job.status === "PRINTED"
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                        }`}>
                          {job.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        ${typeof job.total_cost === 'number' ? job.total_cost.toFixed(2) : '0.00'}
                      </td>
                      <td className="py-3 px-4 text-right text-gray-500">
                        {format(new Date(job.created_at), "MMM d, yyyy")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-gray-500 text-center py-8">No jobs found</div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
