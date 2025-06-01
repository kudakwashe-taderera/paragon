"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { AuthService } from "@/lib/auth"
import DashboardLayout from "@/components/layout/DashboardLayout"
import AnalyticsCharts from "@/components/analytics/AnalyticsCharts"

export default function ReportsPage() {
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      if (!AuthService.isAuthenticated()) {
        router.push("/login")
        return
      }

      const user = await AuthService.getCurrentUser()
      if (!user || user.role !== "SUPERUSER") {
        router.push("/dashboard")
      }
    }

    checkAuth()
  }, [router])

  return (
    <DashboardLayout title="Reports & Analytics">
      <div className="space-y-8">
        <div className="card">
          <h2 className="text-2xl font-semibold mb-6">System Analytics</h2>
          <AnalyticsCharts />
        </div>
      </div>
    </DashboardLayout>
  )
}
