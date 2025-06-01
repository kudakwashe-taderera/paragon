"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { AuthService, type User } from "@/lib/auth"
import { apiClient } from "@/lib/api"
import DashboardLayout from "@/components/layout/DashboardLayout"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"

interface Job {
  job_id: number
  branch: string
  job_type: string
  docket_number: string
  sales_rep: string
  order_taken_by: string
  customer: string
  contact_person: string
  mobile_number: string
  email_address: string
  quantity: number
  description: string
  product_type: {
    id: string
    name: string
  }
  paper_type: {
    id: string
    name: string
  }
  paper_weight: {
    id: string
    gsm: number
  }
  paper_size: {
    id: string
    name: string
    width_mm: number
    height_mm: number
  }
  notes: string
  print_cost: number
  design_cost: number
  status: string
  payment_status: string
  payment_ref?: string
  created_at: string
  updated_at: string
}

export default function JobsPage() {
  const [user, setUser] = useState<User | null>(null)
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    const checkAuth = async () => {
      if (!AuthService.isAuthenticated()) {
        router.push("/login")
        return
      }

      const currentUser = await AuthService.getCurrentUser()
      setUser(currentUser)
    }

    checkAuth()
  }, [router])

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const response = await apiClient.getJobs()
        if (response.ok) {
          const data = await response.json()
          setJobs(data.results || data)
        }
      } catch (error) {
        console.error("Error fetching jobs:", error)
        toast({
          title: "Error",
          description: "Failed to load jobs",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    if (user) {
      fetchJobs()
    }
  }, [user])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-800"
      case "PRINTED":
        return "bg-green-100 text-green-800"
      case "CANCELLED":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case "NOT_MARKED":
        return "bg-gray-100 text-gray-800"
      case "RECEIPTED":
        return "bg-green-100 text-green-800"
      case "INVOICED":
        return "bg-blue-100 text-blue-800"
      case "PAYMENT_PENDING":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (loading) {
    return (
      <DashboardLayout title="Jobs">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto"></div>
          <p className="mt-2 text-gray-500">Loading jobs...</p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="Jobs">
      <Toaster />
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Jobs</h1>
              <p className="text-gray-600">Manage your print jobs</p>
            </div>
            <Link
              href="/jobs/new"
              className="bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white font-semibold px-6 py-3 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Create New Job
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">
                    Docket Number
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">
                    Customer
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">
                    Product
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">
                    Paper Specs
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">
                    Quantity
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">
                    Payment
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {jobs.map((job) => (
                  <tr
                    key={job.job_id}
                    className="hover:bg-gray-50 transition-colors duration-150"
                  >
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {job.docket_number}
                      </div>
                      <div className="text-sm text-gray-500">{job.branch}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {job.customer}
                      </div>
                      <div className="text-sm text-gray-500">
                        {job.contact_person}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {job.product_type.name}
                      </div>
                      <div className="text-sm text-gray-500 line-clamp-1">
                        {job.description}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {job.paper_type?.name || 'N/A'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {job.paper_weight?.gsm || 'N/A'} GSM, {job.paper_size?.name || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {job.quantity.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-500">
                        ${((Number(job.print_cost) || 0) + (Number(job.design_cost) || 0)).toFixed(2)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                          job.status
                        )}`}
                      >
                        {job.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPaymentStatusColor(
                          job.payment_status
                        )}`}
                      >
                        {job.payment_status}
                      </span>
                      {job.payment_ref && (
                        <div className="text-xs text-gray-500 mt-1">
                          {job.payment_ref}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex space-x-2">
                        <Link
                          href={`/jobs/${job.job_id}`}
                          className="text-primary-600 hover:text-primary-800 font-medium text-sm"
                        >
                          View
                        </Link>
                        {job.status === "PENDING" &&
                          (user?.role === "SUPERUSER" ||
                            job.order_taken_by === user?.full_name) && (
                            <Link
                              href={`/jobs/${job.job_id}/edit`}
                              className="text-primary-600 hover:text-primary-800 font-medium text-sm"
                            >
                              Edit
                            </Link>
                          )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
