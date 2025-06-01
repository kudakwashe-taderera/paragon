"use client"

import { useState, useEffect } from "react"
import DashboardLayout from "@/components/layout/DashboardLayout"
import UserApprovalTable from "@/components/admin/UserApprovalTable"
import PendingJobsTable from "@/components/jobs/PendingJobsTable"
import AnalyticsCharts from "@/components/analytics/AnalyticsCharts"
import ProductStats from "@/components/analytics/ProductStats"
import { apiClient } from "@/lib/api"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"

export default function SuperuserDashboard() {
  const { toast } = useToast()
  const [stats, setStats] = useState({
    pending_users: 0,
    pending_jobs: 0,
    total_jobs: 0,
    unpaid_jobs: 0,
  })

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await apiClient.getAdminStats()
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch dashboard stats",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error fetching stats:", error)
      toast({
        title: "Error",
        description: "Failed to fetch dashboard stats",
        variant: "destructive",
      })
    }
  }

  return (
    <DashboardLayout title="Superuser Dashboard">
      <div className="space-y-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Pending Users"
            value={stats.pending_users}
            icon="👥"
            color="bg-yellow-500"
            href="/admin/users"
            filterParams="?status=pending"
          />
          <StatCard
            title="Pending Jobs"
            value={stats.pending_jobs}
            icon="📋"
            color="bg-blue-500"
            href="/jobs/history"
            filterParams="?status=PENDING"
          />
          <StatCard 
            title="Total Jobs" 
            value={stats.total_jobs} 
            icon="📊" 
            color="bg-green-500" 
            href="/jobs/history"
          />
          <StatCard
            title="Unpaid Jobs"
            value={stats.unpaid_jobs}
            icon="💰"
            color="bg-red-500"
            href="/jobs/history"
            filterParams="?payment_status=NOT_MARKED"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-4">
          <Link href="/jobs/new" className="btn-primary">
            Add New Job
          </Link>
          <Link href="/jobs/history" className="btn-primary">
            Job History
          </Link>
          <Link href="/reports" className="btn-secondary">
            View Reports
          </Link>
          <Link href="/admin/product-types" className="btn-outline">
            Manage Product Types
          </Link>
          <Link href="/admin/paper-types" className="btn-outline">
            Manage Paper Types
          </Link>
        </div>

        {/* Pending User Approvals Section */}
        <div className="card">
          <h2 className="text-2xl font-semibold mb-6">Pending User Approvals</h2>
          <UserApprovalTable onUserApproved={fetchStats} />
        </div>

        {/* Pending Jobs Section */}
        <div className="card">
          <h2 className="text-2xl font-semibold mb-6">Pending Jobs</h2>
          <PendingJobsTable />
        </div>

        {/* Performance Reports Section */}
        <div className="card">
          <h2 className="text-2xl font-semibold mb-6">Performance Reports</h2>
          <AnalyticsCharts />
        </div>

        {/* Popular Product Stats Section */}
        <div className="card">
          <h2 className="text-2xl font-semibold mb-6">Popular Product Stats</h2>
          <ProductStats />
        </div>
      </div>
    </DashboardLayout>
  )
}

interface StatCardProps {
  title: string
  value: number
  icon: string
  color: string
  href: string
  filterParams?: string
}

function StatCard({ title, value, icon, color, href, filterParams = "" }: StatCardProps) {
  return (
    <Link 
      href={`${href}${filterParams}`}
      className="card hover:shadow-lg transition-shadow cursor-pointer transform hover:-translate-y-1 duration-200"
    >
      <div className="flex items-center">
        <div className={`${color} rounded-lg p-3 mr-4`}>
          <span className="text-2xl">{icon}</span>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
    </Link>
  )
}
