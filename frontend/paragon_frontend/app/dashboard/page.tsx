"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AuthService, type User } from "@/lib/auth"
import SuperuserDashboard from "@/components/dashboards/SuperuserDashboard"
import DesignerDashboard from "@/components/dashboards/DesignerDashboard"
import SalesRepDashboard from "@/components/dashboards/SalesRepDashboard"
import OperatorDashboard from "@/components/dashboards/OperatorDashboard"
import ClerkDashboard from "@/components/dashboards/ClerkDashboard"
import LoadingSpinner from "@/components/ui/LoadingSpinner"

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      if (!AuthService.isAuthenticated()) {
        router.push("/login")
        return
      }

      try {
        const currentUser = await AuthService.getCurrentUser()
        if (currentUser) {
          setUser(currentUser)
        } else {
          router.push("/login")
        }
      } catch (error) {
        console.error("Auth check failed:", error)
        router.push("/login")
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [router])

  if (loading) {
    return <LoadingSpinner />
  }

  if (!user?.role) {
    return <LoadingSpinner />
  }

  const renderDashboard = () => {
    switch (user.role) {
      case "SUPERUSER":
        return <SuperuserDashboard />
      case "DESIGNER":
        return <DesignerDashboard />
      case "SALES_REPRESENTATIVE":
        return <SalesRepDashboard />
      case "OPERATOR":
        return <OperatorDashboard />
      case "CLERK":
        return <ClerkDashboard />
      default:
        return <div>Invalid role</div>
    }
  }

  return renderDashboard()
}
