"use client"

import { useState, useEffect } from "react"
import { apiClient } from "@/lib/api"

interface Job {
  job_id: number
  customer: string
  description: string
  total_cost: number
  status: string
  payment_status: string
  created_at: string
}

export default function JobsAwaitingPayment() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [paymentStatus, setPaymentStatus] = useState("")
  const [paymentRef, setPaymentRef] = useState("")

  useEffect(() => {
    fetchJobsAwaitingPayment()
  }, [])

  const fetchJobsAwaitingPayment = async () => {
    try {
      const response = await apiClient.getJobs({
        payment_status: "NOT_MARKED",
      })
      if (response.ok) {
        const data = await response.json()
        setJobs(data.results || data)
      }
    } catch (error) {
      console.error("Error fetching jobs awaiting payment:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdatePayment = async () => {
    if (!selectedJob || !paymentStatus) return

    try {
      const response = await apiClient.updateJobPayment(selectedJob.job_id, {
        payment_status: paymentStatus,
        payment_ref: paymentRef,
      })
      if (response.ok) {
        setSelectedJob(null)
        setPaymentStatus("")
        setPaymentRef("")
        fetchJobsAwaitingPayment() // Refresh the list
      }
    } catch (error) {
      console.error("Error updating payment status:", error)
    }
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto"></div>
        <p className="mt-2 text-gray-500">Loading jobs...</p>
      </div>
    )
  }

  if (jobs.length === 0) {
    return <div className="text-center py-8 text-gray-500">No jobs awaiting payment status</div>
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Job ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Customer
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Description
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total Cost
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {jobs.map((job) => (
              <tr key={job.job_id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">#{job.job_id}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{job.customer}</td>
                <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">{job.description}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                    job.status === "PENDING"
                      ? "bg-yellow-100 text-yellow-800"
                      : job.status === "PRINTED"
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                  }`}>
                    {job.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${job.total_cost}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button onClick={() => setSelectedJob(job)} className="text-blue-600 hover:text-blue-900">
                    Update Payment
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Payment Update Modal */}
      {selectedJob && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Update Payment Status - Job #{selectedJob.job_id}</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Status</label>
                <select
                  value={paymentStatus}
                  onChange={(e) => setPaymentStatus(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="">Select status</option>
                  <option value="RECEIPTED">Receipted</option>
                  <option value="INVOICED">Invoiced</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Reference</label>
                <input
                  type="text"
                  value={paymentRef}
                  onChange={(e) => setPaymentRef(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="Enter reference number"
                  required={paymentStatus !== ""}
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setSelectedJob(null)
                  setPaymentStatus("")
                  setPaymentRef("")
                }}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdatePayment}
                disabled={!paymentStatus || (paymentStatus !== "" && !paymentRef)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                Update
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
