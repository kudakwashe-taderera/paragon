"use client"

import { useState, useEffect, useRef } from "react"
import { apiClient } from "@/lib/api"

interface AnalyticsData {
  user_performance: Array<{
    order_taken_by: string
    jobs_created: number
    jobs_printed: number
    jobs_paid: number
  }>
  branch_performance: Array<{
    branch: string
    job_count: number
    total_profit: number
  }>
  product_performance: Array<{
    product_type__name: string
    job_count: number
    total_revenue: number
  }>
  financial_stats: {
    total_receipted: number
    total_invoiced: number
    total_unpaid: number
  }
  daily_profits: Array<{
    created_date: string
    total_profit: number
  }>
  monthly_branch_profits: Array<{
    month: number
    branch: string
    total_profit: number
  }>
}

declare global {
  interface Window {
    Chart: any
  }
}

export default function AnalyticsCharts() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  
  // Chart refs
  const userChartRef = useRef<HTMLCanvasElement>(null)
  const branchChartRef = useRef<HTMLCanvasElement>(null)
  const productChartRef = useRef<HTMLCanvasElement>(null)
  const financialChartRef = useRef<HTMLCanvasElement>(null)
  const profitsChartRef = useRef<HTMLCanvasElement>(null)
  const monthlyProfitsChartRef = useRef<HTMLCanvasElement>(null)
  
  // Chart instances
  const [charts, setCharts] = useState<{[key: string]: any}>({})

  useEffect(() => {
    fetchAnalytics()
  }, [])

  useEffect(() => {
    if (analytics && typeof window !== 'undefined' && window.Chart) {
      // Destroy existing charts
      Object.values(charts).forEach(chart => chart?.destroy())
      
      // Create new charts
      const chartInstances: {[key: string]: any} = {}

      // Daily Profits Line Chart
      if (profitsChartRef.current) {
        const ctx = profitsChartRef.current.getContext('2d')
        if (ctx) {
          chartInstances.profits = new window.Chart(ctx, {
            type: 'line',
            data: {
              labels: analytics.daily_profits.map(item => new Date(item.created_date).toLocaleDateString()),
              datasets: [{
                label: 'Daily Profits',
                data: analytics.daily_profits.map(item => item.total_profit),
                borderColor: 'rgb(75, 192, 192)',
                backgroundColor: 'rgba(75, 192, 192, 0.1)',
                fill: true,
                tension: 0.4,
              }],
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  display: false,
                },
                title: {
                  display: true,
                  text: 'Daily Profits (Last 30 Days)',
                  padding: {
                    top: 10,
                    bottom: 20
                  }
                }
              },
              scales: {
                y: {
                  beginAtZero: true,
                  grid: {
                    drawBorder: false,
                  },
                  ticks: {
                    callback: function(value: number): string {
                      return '$' + value.toFixed(2)
                    }
                  }
                },
                x: {
                  grid: {
                    display: false,
                  },
                },
              },
            },
          })
        }
      }

      // Monthly Branch Profits Chart
      if (monthlyProfitsChartRef.current) {
        const ctx = monthlyProfitsChartRef.current.getContext('2d')
        if (ctx) {
          const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
          const branches = [...new Set(analytics.monthly_branch_profits.map(item => item.branch))]
          const datasets = branches.map((branch, index) => ({
            label: branch,
            data: Array(12).fill(0).map((_, month) => {
              const record = analytics.monthly_branch_profits.find(
                item => item.branch === branch && item.month === month + 1
              )
              return record ? record.total_profit : 0
            }),
            borderColor: `hsl(${index * (360 / branches.length)}, 70%, 50%)`,
            backgroundColor: `hsla(${index * (360 / branches.length)}, 70%, 50%, 0.1)`,
            fill: true,
            tension: 0.4,
          }))

          chartInstances.monthlyProfits = new window.Chart(ctx, {
            type: 'line',
            data: {
              labels: monthNames,
              datasets: datasets,
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  position: 'bottom',
                  labels: {
                    usePointStyle: true,
                  },
                },
                title: {
                  display: true,
                  text: 'Monthly Branch Profits',
                  padding: {
                    top: 10,
                    bottom: 20
                  }
                }
              },
              scales: {
                y: {
                  beginAtZero: true,
                  grid: {
                    drawBorder: false,
                  },
                  ticks: {
                    callback: function(value: number): string {
                      return '$' + value.toFixed(2)
                    }
                  }
                },
                x: {
                  grid: {
                    display: false,
                  },
                },
              },
            },
          })
        }
      }
      
      // User Performance Chart
      if (userChartRef.current) {
        const ctx = userChartRef.current.getContext('2d')
        if (ctx) {
          chartInstances.user = new window.Chart(ctx, {
            type: 'bar',
            data: {
              labels: analytics.user_performance.map(user => user.order_taken_by),
              datasets: [
                {
                  label: 'Jobs Created',
                  data: analytics.user_performance.map(user => user.jobs_created),
                  backgroundColor: 'rgba(53, 162, 235, 0.5)',
                  borderColor: 'rgb(53, 162, 235)',
                  borderWidth: 1,
                },
                {
                  label: 'Jobs Printed',
                  data: analytics.user_performance.map(user => user.jobs_printed),
                  backgroundColor: 'rgba(75, 192, 192, 0.5)',
                  borderColor: 'rgb(75, 192, 192)',
                  borderWidth: 1,
                },
                {
                  label: 'Jobs Paid',
                  data: analytics.user_performance.map(user => user.jobs_paid),
                  backgroundColor: 'rgba(255, 159, 64, 0.5)',
                  borderColor: 'rgb(255, 159, 64)',
                  borderWidth: 1,
                },
              ],
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  position: 'bottom',
                  labels: {
                    padding: 20,
                    usePointStyle: true,
                  },
                },
                title: {
                  display: true,
                  text: 'User Performance Overview',
                  padding: {
                    top: 10,
                    bottom: 20
                  }
                }
              },
              scales: {
                y: {
                  beginAtZero: true,
                  grid: {
                    drawBorder: false,
                  },
                },
                x: {
                  grid: {
                    display: false,
                  },
                },
              },
            },
          })
        }
      }

      // Branch Performance Chart
      if (branchChartRef.current) {
        const ctx = branchChartRef.current.getContext('2d')
        if (ctx) {
          chartInstances.branch = new window.Chart(ctx, {
            type: 'bar',
            data: {
              labels: analytics.branch_performance.map(branch => branch.branch),
              datasets: [
                {
                  label: 'Job Count',
                  data: analytics.branch_performance.map(branch => branch.job_count),
                  backgroundColor: 'rgba(53, 162, 235, 0.5)',
                  borderColor: 'rgb(53, 162, 235)',
                  borderWidth: 1,
                  yAxisID: 'y',
                },
                {
                  label: 'Total Profit',
                  data: analytics.branch_performance.map(branch => branch.total_profit),
                  backgroundColor: 'rgba(75, 192, 192, 0.5)',
                  borderColor: 'rgb(75, 192, 192)',
                  borderWidth: 1,
                  yAxisID: 'y1',
                }
              ],
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  position: 'bottom',
                  labels: {
                    usePointStyle: true,
                  },
                },
                title: {
                  display: true,
                  text: 'Branch Performance Overview',
                  padding: {
                    top: 10,
                    bottom: 20
                  }
                }
              },
              scales: {
                y: {
                  type: 'linear',
                  display: true,
                  position: 'left',
                  beginAtZero: true,
                  grid: {
                    drawBorder: false,
                  },
                  title: {
                    display: true,
                    text: 'Job Count'
                  }
                },
                y1: {
                  type: 'linear',
                  display: true,
                  position: 'right',
                  beginAtZero: true,
                  grid: {
                    drawBorder: false,
                  },
                  title: {
                    display: true,
                    text: 'Total Profit ($)'
                  },
                  ticks: {
                    callback: function(value: number): string {
                      return '$' + value.toFixed(2)
                    }
                  }
                },
                x: {
                  grid: {
                    display: false,
                  },
                },
              },
            },
          })
        }
      }

      // Product Performance Chart
      if (productChartRef.current) {
        const ctx = productChartRef.current.getContext('2d')
        if (ctx) {
          chartInstances.product = new window.Chart(ctx, {
            type: 'doughnut',
            data: {
              labels: analytics.product_performance.map(product => product.product_type__name),
              datasets: [{
                data: analytics.product_performance.map(product => product.job_count),
                backgroundColor: [
                  'rgba(255, 99, 132, 0.5)',
                  'rgba(54, 162, 235, 0.5)',
                  'rgba(255, 206, 86, 0.5)',
                  'rgba(75, 192, 192, 0.5)',
                  'rgba(153, 102, 255, 0.5)',
                ],
                borderColor: [
                  'rgba(255, 99, 132, 1)',
                  'rgba(54, 162, 235, 1)',
                  'rgba(255, 206, 86, 1)',
                  'rgba(75, 192, 192, 1)',
                  'rgba(153, 102, 255, 1)',
                ],
                borderWidth: 1,
              }],
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  position: 'right',
                  labels: {
                    usePointStyle: true,
                  },
                },
                title: {
                  display: true,
                  text: 'Product Distribution',
                  padding: {
                    top: 10,
                    bottom: 20
                  }
                }
              },
            },
          })
        }
      }

      // Financial Distribution Chart
      if (financialChartRef.current) {
        const ctx = financialChartRef.current.getContext('2d')
        if (ctx) {
          chartInstances.financial = new window.Chart(ctx, {
            type: 'doughnut',
            data: {
              labels: ['Receipted', 'Invoiced', 'Unpaid'],
              datasets: [{
                data: [
                  analytics.financial_stats.total_receipted,
                  analytics.financial_stats.total_invoiced,
                  analytics.financial_stats.total_unpaid,
                ],
                backgroundColor: [
                  'rgba(75, 192, 192, 0.5)',
                  'rgba(54, 162, 235, 0.5)',
                  'rgba(255, 99, 132, 0.5)',
                ],
                borderColor: [
                  'rgb(75, 192, 192)',
                  'rgb(54, 162, 235)',
                  'rgb(255, 99, 132)',
                ],
                borderWidth: 1,
              }],
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  position: 'right',
                  labels: {
                    usePointStyle: true,
                  },
                },
                title: {
                  display: true,
                  text: 'Financial Distribution',
                  padding: {
                    top: 10,
                    bottom: 20
                  }
                }
              },
            },
          })
        }
      }

      setCharts(chartInstances)
    }
  }, [analytics])

  const fetchAnalytics = async () => {
    try {
      const response = await apiClient.getJobAnalytics()
      if (response.ok) {
        const data = await response.json()
        setAnalytics(data)
      }
    } catch (error) {
      console.error("Error fetching analytics:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto"></div>
        <p className="mt-2 text-gray-500">Loading analytics...</p>
      </div>
    )
  }

  if (!analytics) {
    return <div className="text-center py-8 text-gray-500">Unable to load analytics data</div>
  }

  return (
    <div className="space-y-8 p-6">
      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 transform transition-all hover:scale-105">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Receipted Jobs</h3>
              <div className="text-3xl font-bold text-green-600">{analytics.financial_stats.total_receipted}</div>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 transform transition-all hover:scale-105">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Invoiced Jobs</h3>
              <div className="text-3xl font-bold text-blue-600">{analytics.financial_stats.total_invoiced}</div>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 transform transition-all hover:scale-105">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Unpaid Jobs</h3>
              <div className="text-3xl font-bold text-red-600">{analytics.financial_stats.total_unpaid}</div>
            </div>
            <div className="bg-red-100 p-3 rounded-full">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Profit Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Profits Line Chart */}
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
          <div className="h-[400px]">
            <canvas ref={profitsChartRef} />
          </div>
        </div>

        {/* Monthly Branch Profits Chart */}
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
          <div className="h-[400px]">
            <canvas ref={monthlyProfitsChartRef} />
          </div>
        </div>
      </div>

      {/* Performance Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Branch Performance Chart */}
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
          <div className="h-[400px]">
            <canvas ref={branchChartRef} />
          </div>
        </div>

        {/* User Performance Chart */}
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
          <div className="h-[400px]">
            <canvas ref={userChartRef} />
          </div>
        </div>
      </div>

      {/* Distribution Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Financial Distribution Chart */}
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
          <div className="h-[400px]">
            <canvas ref={financialChartRef} />
          </div>
        </div>

        {/* Product Performance Chart */}
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
          <div className="h-[400px]">
            <canvas ref={productChartRef} />
          </div>
          {/* Product Revenue Table */}
          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jobs</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {analytics.product_performance.map((product, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{product.product_type__name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.job_count}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      ${product.total_revenue?.toFixed(2) || '0.00'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* User Performance Table */}
      <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Detailed User Performance</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jobs Created</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jobs Printed</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jobs Paid</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Success Rate</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {analytics.user_performance.map((user, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.order_taken_by}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.jobs_created}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.jobs_printed}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.jobs_paid}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center">
                      <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full" 
                          style={{ width: `${((user.jobs_paid / user.jobs_created) * 100)}%` }}
                        />
                      </div>
                      {((user.jobs_paid / user.jobs_created) * 100).toFixed(1)}%
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
