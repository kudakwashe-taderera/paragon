import DashboardLayout from "@/components/layout/DashboardLayout"

export default function LoadingPage() {
  return (
    <DashboardLayout title="Loading...">
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto"></div>
        <p className="mt-2 text-gray-500">Loading job details...</p>
      </div>
    </DashboardLayout>
  )
} 