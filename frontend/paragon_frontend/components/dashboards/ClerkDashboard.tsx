"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import DashboardLayout from "@/components/layout/DashboardLayout"
import JobsAwaitingPayment from "@/components/jobs/JobsAwaitingPayment"
import { apiClient } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { format } from "date-fns"

interface PaymentStats {
  awaiting_payment: number
  receipted_today: number
  invoiced_today: number
  total_revenue: number
}

interface Job {
  job_id: number
  status: string
  payment_status: string
  print_cost: number
  design_cost: number
  total_cost: number
  created_at: string
  updated_at: string
  customer: string
  docket_number: string
}

interface JobsResponse {
  results: Job[]
}

export default function ClerkDashboard() {
  const [stats, setStats] = useState<PaymentStats>({
    awaiting_payment: 0,
    receipted_today: 0,
    invoiced_today: 0,
    total_revenue: 0
  })
  const [recentTransactions, setRecentTransactions] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const fetchStats = useCallback(async () => {
    try {
      const response = await apiClient.getJobs()
      if (response.ok) {
        const data: JobsResponse = await response.json()
        const jobs = data.results || []

        // Get today's date range in the local timezone
        const now = new Date()
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        const todayEnd = new Date(todayStart)
        todayEnd.setDate(todayEnd.getDate() + 1)

        // Calculate statistics
        const stats = {
          awaiting_payment: jobs.filter(job => job.payment_status === "NOT_MARKED").length,
          receipted_today: jobs.filter(job => {
            const updatedAt = new Date(job.updated_at)
            return job.payment_status === "RECEIPTED" && 
                   updatedAt >= todayStart && updatedAt < todayEnd
          }).length,
          invoiced_today: jobs.filter(job => {
            const updatedAt = new Date(job.updated_at)
            return job.payment_status === "INVOICED" && 
                   updatedAt >= todayStart && updatedAt < todayEnd
          }).length,
          total_revenue: jobs.reduce((total, job) => {
            const updatedAt = new Date(job.updated_at)
            if ((job.payment_status === "RECEIPTED" || job.payment_status === "INVOICED") &&
                updatedAt >= todayStart && updatedAt < todayEnd) {
              return total + (Number(job.total_cost) || 0)
            }
            return total
          }, 0)
        }

        // Get recent transactions (receipted or invoiced jobs)
        const transactions = jobs
          .filter(job => ["RECEIPTED", "INVOICED"].includes(job.payment_status))
          .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
          .slice(0, 5)

        setStats(stats)
        setRecentTransactions(transactions)
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
  }, []) // Remove toast from dependencies since it's stable

  // Initial fetch
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
    <DashboardLayout title="Clerk Dashboard">
      <Toaster />
      <div className="space-y-8">
        {/* Payment Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow">
            <div className="text-3xl font-bold mb-2">
              {loading ? "-" : stats.awaiting_payment}
            </div>
            <div className="text-red-100">Awaiting Payment</div>
          </div>
          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow">
            <div className="text-3xl font-bold mb-2">
              {loading ? "-" : stats.receipted_today}
            </div>
            <div className="text-green-100">Receipted Today</div>
          </div>
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow">
            <div className="text-3xl font-bold mb-2">
              {loading ? "-" : stats.invoiced_today}
            </div>
            <div className="text-blue-100">Invoiced Today</div>
          </div>
          <div className="bg-gradient-to-r from-gray-600 to-gray-700 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow">
            <div className="text-3xl font-bold mb-2">
              ${loading ? "-" : stats.total_revenue.toFixed(2)}
            </div>
            <div className="text-gray-100">Total Revenue</div>
          </div>
        </div>

        {/* Jobs Awaiting Payment Status Section */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-semibold mb-6 text-gray-800">Jobs Awaiting Payment Status</h2>
          <JobsAwaitingPayment />
        </div>

        {/* Recent Transactions Section */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-semibold mb-6 text-gray-800">Recent Transactions</h2>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto"></div>
              <p className="mt-2 text-gray-500">Loading transactions...</p>
            </div>
          ) : recentTransactions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-gray-600">Docket #</th>
                    <th className="text-left py-3 px-4 text-gray-600">Customer</th>
                    <th className="text-left py-3 px-4 text-gray-600">Status</th>
                    <th className="text-right py-3 px-4 text-gray-600">Amount</th>
                    <th className="text-right py-3 px-4 text-gray-600">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTransactions.map((transaction) => (
                    <tr key={transaction.job_id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">{transaction.docket_number}</td>
                      <td className="py-3 px-4">{transaction.customer}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                          transaction.payment_status === "RECEIPTED" 
                            ? "bg-green-100 text-green-800" 
                            : "bg-blue-100 text-blue-800"
                        }`}>
                          {transaction.payment_status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">${typeof transaction.total_cost === 'number' ? transaction.total_cost.toFixed(2) : '0.00'}</td>
                      <td className="py-3 px-4 text-right text-gray-500">
                        {format(new Date(transaction.updated_at), "MMM d, yyyy")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-gray-500 text-center py-8">No recent transactions found</div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
