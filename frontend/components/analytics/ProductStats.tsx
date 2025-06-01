"use client"

import { useState, useEffect, useRef } from "react"
import { apiClient } from "@/lib/api"

interface ProductStats {
  product_type__name: string
  job_count: number
  total_revenue: number
}

export default function ProductStats() {
  const [stats, setStats] = useState<ProductStats[]>([])
  const [loading, setLoading] = useState(true)
  const chartRef = useRef<HTMLCanvasElement>(null)
  const [chart, setChart] = useState<any>(null)

  useEffect(() => {
    fetchStats()
  }, [])

  useEffect(() => {
    if (stats.length > 0 && typeof window !== 'undefined' && window.Chart) {
      // Destroy existing chart if it exists
      if (chart) {
        chart.destroy()
      }

      // Create new chart
      if (chartRef.current) {
        const ctx = chartRef.current.getContext('2d')
        if (ctx) {
          const newChart = new window.Chart(ctx, {
            type: 'bar',
            data: {
              labels: stats.map(item => item.product_type__name),
              datasets: [
                {
                  label: 'Job Count',
                  data: stats.map(item => item.job_count),
                  backgroundColor: 'rgba(53, 162, 235, 0.5)',
                  borderColor: 'rgb(53, 162, 235)',
                  borderWidth: 1,
                  yAxisID: 'y',
                },
                {
                  label: 'Revenue',
                  data: stats.map(item => item.total_revenue),
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
                  text: 'Product Performance Overview',
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
                    drawOnChartArea: false,
                  },
                  title: {
                    display: true,
                    text: 'Revenue ($)'
                  },
                  ticks: {
                    callback: function(value: number): string {
                      return '$' + value.toFixed(2)
                    }
                  }
                },
              },
            },
          })
          setChart(newChart)
        }
      }
    }
  }, [stats])

  const fetchStats = async () => {
    try {
      const response = await apiClient.getJobAnalytics()
      if (response.ok) {
        const data = await response.json()
        setStats(data.product_performance)
      }
    } catch (error) {
      console.error("Error fetching product stats:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto"></div>
        <p className="mt-2 text-gray-500">Loading product statistics...</p>
      </div>
    )
  }

  if (!stats.length) {
    return (
      <div className="text-center py-8 text-gray-500">
        No product statistics available
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Chart */}
      <div className="h-[400px]">
        <canvas ref={chartRef} />
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jobs</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg. Revenue/Job</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {stats.map((product, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {product.product_type__name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {product.job_count}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  ${product.total_revenue?.toFixed(2) || '0.00'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  ${((product.total_revenue || 0) / product.job_count).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
} 