"use client"

import { useState, useEffect } from "react"
import DashboardLayout from "@/components/layout/DashboardLayout"
import PendingJobsTable from "@/components/jobs/PendingJobsTable"
import Link from "next/link"
import { apiClient } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

interface DesignerStats {
  jobs_today: number
  pending_jobs: number
  completed_today: number
}

export default function DesignerDashboard() {
  const [stats, setStats] = useState<DesignerStats>({
    jobs_today: 0,
    pending_jobs: 0,
    completed_today: 0
  })
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      console.log("Fetching designer stats...")
      const response = await apiClient.getDesignerStats()
      console.log("Designer stats response:", response)
      
      if (response.ok) {
        const data = await response.json()
        console.log("Designer stats data:", data)
        setStats(data)
      } else {
        const errorData = await response.json()
        console.error("Error response:", errorData)
        toast({
          title: "Error",
          description: "Failed to fetch dashboard stats",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error fetching designer stats:", error)
      toast({
        title: "Error",
        description: "Failed to fetch dashboard stats",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <DashboardLayout title="Designer Dashboard">
      <div className="space-y-8">
        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card">
            <h2 className="text-2xl font-semibold mb-4">Add New Job</h2>
            <p className="text-gray-600 mb-6">Create a new print job for customers</p>
            <Link href="/jobs/new" className="btn-primary">
              Create New Job
            </Link>
          </div>

          <div className="card">
            <h2 className="text-2xl font-semibold mb-4">Quick Stats</h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Jobs Today:</span>
                <span className="font-semibold">
                  {loading ? (
                    <div className="animate-pulse bg-gray-200 h-6 w-8 rounded"></div>
                  ) : (
                    stats.jobs_today
                  )}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Pending Jobs:</span>
                <span className="font-semibold">
                  {loading ? (
                    <div className="animate-pulse bg-gray-200 h-6 w-8 rounded"></div>
                  ) : (
                    stats.pending_jobs
                  )}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Completed Today:</span>
                <span className="font-semibold">
                  {loading ? (
                    <div className="animate-pulse bg-gray-200 h-6 w-8 rounded"></div>
                  ) : (
                    stats.completed_today
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Pending Jobs Section */}
        <div className="card">
          <h2 className="text-2xl font-semibold mb-6">Pending Jobs</h2>
          <PendingJobsTable onJobStatusChange={fetchStats} />
        </div>
      </div>
    </DashboardLayout>
  )
}
