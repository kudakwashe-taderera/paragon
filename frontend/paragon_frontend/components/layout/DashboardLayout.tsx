"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { AuthService, type User } from "@/lib/auth"
import Link from "next/link"

interface DashboardLayoutProps {
  children: React.ReactNode
  title: string
}

export default function DashboardLayout({ children, title }: DashboardLayoutProps) {
  const [user, setUser] = useState<User | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    const getCurrentUser = async () => {
      const currentUser = await AuthService.getCurrentUser()
      setUser(currentUser)
    }
    getCurrentUser()
  }, [])

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: "🏠" },
    // Only show Add New Job for Designer and Sales Representative
    ...(user?.role === "DESIGNER" || user?.role === "SALES_REPRESENTATIVE"
      ? [{ name: "Add New Job", href: "/jobs/new", icon: "➕" }]
      : []),
    { name: "Jobs", href: "/jobs", icon: "📋" },
    ...(user?.role === "SUPERUSER"
      ? [
          { name: "User Management", href: "/admin/users", icon: "👥" },
          { name: "Reports", href: "/reports", icon: "📊" },
          { name: "Product Types", href: "/admin/product-types", icon: "📦" },
          { name: "Paper Types", href: "/admin/paper-types", icon: "📄" },
          { name: "Settings", href: "/admin/settings", icon: "⚙️" },
        ]
      : []),
  ]

  const handleSignOut = () => {
    AuthService.logout()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-40 lg:hidden ${sidebarOpen ? "block" : "hidden"}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        <div className="relative flex w-full max-w-xs flex-1 flex-col bg-white">
          <div className="absolute top-0 right-0 -mr-12 pt-2">
            <button
              type="button"
              className="ml-1 flex h-10 w-10 items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              onClick={() => setSidebarOpen(false)}
            >
              <span className="sr-only">Close sidebar</span>
              <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <SidebarContent navigation={navigation} />
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <SidebarContent navigation={navigation} />
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <div className="sticky top-0 z-10 bg-white shadow-sm border-b border-gray-200">
          <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
            <button type="button" className="lg:hidden" onClick={() => setSidebarOpen(true)}>
              <span className="sr-only">Open sidebar</span>
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <h1 className="text-xl font-semibold text-gray-900">{title}</h1>

            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                {user?.full_name} ({user?.role?.replace("_", " ")})
              </span>
              <button onClick={handleSignOut} className="btn-outline text-sm">
                Sign Out
              </button>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  )
}

function SidebarContent({ navigation }: { navigation: any[] }) {
  return (
    <div className="flex flex-1 flex-col bg-gradient-to-b from-primary-500 to-primary-600 shadow-xl">
      <div className="flex flex-1 flex-col overflow-y-auto pt-5 pb-4">
        <div className="flex flex-shrink-0 items-center px-4">
          <h2 className="text-xl font-bold text-white">Paragon JMS</h2>
        </div>
        <nav className="mt-8 flex-1 space-y-2 px-3">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="group flex items-center px-3 py-3 text-sm font-medium rounded-lg text-white hover:bg-white hover:bg-opacity-10 transition-all duration-200 hover:shadow-md"
            >
              <span className="mr-3 text-lg">{item.icon}</span>
              {item.name}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  )
}
