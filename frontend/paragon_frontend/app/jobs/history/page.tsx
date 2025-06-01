"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { AuthService } from "@/lib/auth"
import DashboardLayout from "@/components/layout/DashboardLayout"
import JobHistoryTable from "@/components/jobs/JobHistoryTable"
import { Input } from "@/components/ui/input"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { useDebounce } from "@/hooks/use-debounce"
import { apiClient } from "@/lib/api"

interface FilterState {
  search: string
  status: string
  paymentStatus: string
  branch: string
  sortBy: string
  sortOrder: string
  page: number
  pageSize: number
}

const INITIAL_FILTERS: FilterState = {
  search: "",
  status: "all",
  paymentStatus: "all",
  branch: "all",
  sortBy: "created_at",
  sortOrder: "desc",
  page: 1,
  pageSize: 10
}

const SORT_OPTIONS = [
  { value: "created_at", label: "Creation Date" },
  { value: "docket_number", label: "Docket Number" },
  { value: "customer", label: "Customer Name" },
  { value: "total_cost", label: "Total Cost" },
]

const STATUS_OPTIONS = [
  { value: "all", label: "All Statuses" },
  { value: "PENDING", label: "Pending" },
  { value: "PRINTED", label: "Printed" },
]

const PAYMENT_STATUS_OPTIONS = [
  { value: "all", label: "All Payment Statuses" },
  { value: "NOT_MARKED", label: "Not Marked" },
  { value: "RECEIPTED", label: "Receipted" },
  { value: "INVOICED", label: "Invoiced" },
]

function JobHistoryContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [filters, setFilters] = useState<FilterState>(INITIAL_FILTERS)
  const [totalPages, setTotalPages] = useState(1)
  const [totalJobs, setTotalJobs] = useState(0)
  const [loading, setLoading] = useState(true)
  const [branches, setBranches] = useState<Array<{ value: string, label: string }>>([
    { value: "all", label: "All Branches" }
  ])
  
  const debouncedSearch = useDebounce(filters.search, 300)

  // Handle URL parameters
  useEffect(() => {
    const status = searchParams.get("status")
    const paymentStatus = searchParams.get("payment_status")
    
    if (status || paymentStatus) {
      setFilters(prev => ({
        ...prev,
        status: status || "all",
        paymentStatus: paymentStatus || "all"
      }))
    }
  }, [searchParams])

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
    fetchBranches()
  }, [router])

  useEffect(() => {
    // Reset page when filters change
    if (filters.page !== 1) {
      setFilters(prev => ({ ...prev, page: 1 }))
    }
  }, [debouncedSearch, filters.status, filters.paymentStatus, filters.branch, filters.sortBy, filters.sortOrder])

  const fetchBranches = async () => {
    try {
      const response = await apiClient.getBranches()
      if (response.ok) {
        const data = await response.json()
        // Ensure data is in the correct format
        const branchOptions = Array.isArray(data) 
          ? data.map((branch: string) => ({
              value: branch,
              label: branch
            }))
          : Object.entries(data).map(([key, value]) => ({
              value: key,
              label: value as string
            }))
        
        setBranches([
          { value: "all", label: "All Branches" },
          ...branchOptions
        ])
      } else {
        console.error('Failed to fetch branches:', await response.text())
        toast({
          title: "Error",
          description: "Failed to load branches",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error fetching branches:', error)
      toast({
        title: "Error",
        description: "Failed to load branches",
        variant: "destructive",
      })
    }
  }

  const handleFilterChange = (key: keyof FilterState, value: string | number) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const handlePageChange = (newPage: number) => {
    setFilters(prev => ({ ...prev, page: newPage }))
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex flex-col space-y-4">
          {/* Search and Filters Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="lg:col-span-2">
              <Input
                placeholder="Search by docket number, customer, or description..."
                value={filters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
                className="w-full"
              />
            </div>
            
            <Select
              value={filters.status}
              onValueChange={(value) => handleFilterChange("status", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.paymentStatus}
              onValueChange={(value) => handleFilterChange("paymentStatus", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Payment Status" />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.branch}
              onValueChange={(value) => handleFilterChange("branch", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Branch" />
              </SelectTrigger>
              <SelectContent>
                {branches.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Sort Options Row */}
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-500">Sort by:</div>
            <Select
              value={filters.sortBy}
              onValueChange={(value) => handleFilterChange("sortBy", value)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.sortOrder}
              onValueChange={(value) => handleFilterChange("sortOrder", value)}
            >
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Order" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="asc">Ascending</SelectItem>
                <SelectItem value="desc">Descending</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Results Info */}
          <div className="text-sm text-gray-500">
            Showing {Math.min((filters.page - 1) * filters.pageSize + 1, totalJobs)} - {Math.min(filters.page * filters.pageSize, totalJobs)} of {totalJobs} jobs
          </div>
        </div>

        {/* Job History Table */}
        <div className="mt-6">
          <JobHistoryTable
            filters={filters}
            onTotalPagesChange={setTotalPages}
            onTotalJobsChange={setTotalJobs}
            loading={loading}
            setLoading={setLoading}
          />
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <Select
                value={filters.pageSize.toString()}
                onValueChange={(value) => handleFilterChange("pageSize", parseInt(value))}
              >
                <SelectTrigger className="w-[100px]">
                  <SelectValue placeholder="Page size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 / page</SelectItem>
                  <SelectItem value="25">25 / page</SelectItem>
                  <SelectItem value="50">50 / page</SelectItem>
                  <SelectItem value="100">100 / page</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => handlePageChange(1)}
                disabled={filters.page === 1}
                className="px-3 py-1 rounded-md border disabled:opacity-50 hover:bg-gray-50"
              >
                First
              </button>
              <button
                onClick={() => handlePageChange(filters.page - 1)}
                disabled={filters.page === 1}
                className="px-3 py-1 rounded-md border disabled:opacity-50 hover:bg-gray-50"
              >
                Previous
              </button>
              
              <span className="px-4 py-1">
                Page {filters.page} of {totalPages}
              </span>

              <button
                onClick={() => handlePageChange(filters.page + 1)}
                disabled={filters.page === totalPages}
                className="px-3 py-1 rounded-md border disabled:opacity-50 hover:bg-gray-50"
              >
                Next
              </button>
              <button
                onClick={() => handlePageChange(totalPages)}
                disabled={filters.page === totalPages}
                className="px-3 py-1 rounded-md border disabled:opacity-50 hover:bg-gray-50"
              >
                Last
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function JobHistoryPage() {
  return (
    <Suspense fallback={
      <DashboardLayout title="Job History">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto"></div>
          <p className="mt-2 text-gray-500">Loading job history...</p>
        </div>
      </DashboardLayout>
    }>
      <JobHistoryContent />
    </Suspense>
  )
} 