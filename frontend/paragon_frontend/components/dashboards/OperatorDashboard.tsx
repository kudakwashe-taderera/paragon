"use client"

import { useState, useEffect } from "react"
import DashboardLayout from "@/components/layout/DashboardLayout"
import JobsReadyToPrint from "@/components/jobs/JobsReadyToPrint"
import PrintQueue from "@/components/jobs/PrintQueue"
import { apiClient } from "@/lib/api"

interface DashboardStats {
  jobsReadyToPrint: number
  jobsPrintedToday: number
  inProgress: number
}

export default function OperatorDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    jobsReadyToPrint: 0,
    jobsPrintedToday: 0,
    inProgress: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
    // Refresh stats every 2 minutes
    const interval = setInterval(fetchStats, 120000)
    return () => clearInterval(interval)
  }, [])

  const fetchStats = async () => {
    try {
      // Get pending jobs count
      const pendingResponse = await apiClient.getJobs({ status: "PENDING" })
      const printedTodayResponse = await apiClient.getJobs({ status: "PRINTED", created_today: "true" })
      
      const [pendingData, printedData] = await Promise.all([
        pendingResponse.ok ? pendingResponse.json() : { count: 0 },
        printedTodayResponse.ok ? printedTodayResponse.json() : { count: 0 }
      ])

      setStats({
        jobsReadyToPrint: pendingData.count || 0,
        jobsPrintedToday: printedData.count || 0,
        inProgress: 0 // We don't have an "in progress" status in the backend
      })
    } catch (error) {
      console.error("Error fetching stats:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <DashboardLayout title="Operator Dashboard">
      <div className="space-y-8">
        {/* Quick Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow">
            <div className="text-3xl font-bold mb-2">
              {loading ? "-" : stats.jobsReadyToPrint}
            </div>
            <div className="text-blue-100">Jobs Ready to Print</div>
          </div>
          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow">
            <div className="text-3xl font-bold mb-2">
              {loading ? "-" : stats.jobsPrintedToday}
            </div>
            <div className="text-green-100">Jobs Printed Today</div>
          </div>
          <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow">
            <div className="text-3xl font-bold mb-2">
              {loading ? "-" : stats.inProgress}
            </div>
            <div className="text-yellow-100">Cancelled Jobs</div>
          </div>
        </div>

        {/* Jobs Ready to Print Section */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-semibold mb-6 text-gray-800">Jobs Ready to Print</h2>
          <JobsReadyToPrint onJobStatusChange={fetchStats} />
        </div>

        {/* Print Queue Section */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-semibold mb-6 text-gray-800">Print Queue</h2>
          <PrintQueue />
        </div>
      </div>
    </DashboardLayout>
  )
}
