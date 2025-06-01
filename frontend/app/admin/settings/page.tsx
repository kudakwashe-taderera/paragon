"use client"

import React, { useState, useEffect, ChangeEvent } from "react"
import { useRouter } from "next/navigation"
import { AuthService } from "@/lib/auth"
import { apiClient, type SystemSettings, type Branch } from "@/lib/api"
import DashboardLayout from "@/components/layout/DashboardLayout"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface DashboardLayoutProps {
  title: string;
  children: React.ReactNode;
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<SystemSettings>({
    id: "",
    company_name: "",
    default_branch: "",
    branch_set: [],
    auto_approve_users: false,
    email_notifications: true,
    system_maintenance: false,
    maintenance_message: "",
    job_number_prefix: "",
    job_number_suffix: "",
    tax_rate: 15,
    currency: "USD",
    business_hours: {
      start: "08:00",
      end: "17:00"
    },
    contact_info: {
      phone: "",
      email: "",
      address: ""
    },
    updated_at: new Date().toISOString()
  })

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState("general")
  const [newBranch, setNewBranch] = useState<Omit<Branch, "id">>({
    name: "",
    code: "",
    is_active: true
  })
  
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    const checkAuthAndLoadSettings = async () => {
      try {
        if (!AuthService.isAuthenticated()) {
          router.push("/login")
          return
        }

        const user = await AuthService.getCurrentUser()
        if (!user || user.role !== "SUPERUSER") {
          toast({
            title: "Access Denied",
            description: "You don't have permission to access this page",
            variant: "destructive",
          })
          router.push("/dashboard")
          return
        }

        try {
          const data = await apiClient.getSystemSettings()
          console.log('Settings data:', data)
          if (!data.branch_set) {
            data.branch_set = []
          }
          setSettings(data)
        } catch (error) {
          throw new Error("Failed to load settings")
        }
      } catch (error) {
        console.error("Error loading settings:", error)
        toast({
          title: "Error",
          description: "Failed to load system settings",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    checkAuthAndLoadSettings()
  }, [router, toast])

  const handleSaveSettings = async () => {
    setSaving(true)
    try {
      const response = await apiClient.updateSystemSettings(settings)
      if (!response.ok) {
        throw new Error("Failed to save settings")
      }

      const updatedSettings = await response.json()
      setSettings(updatedSettings)
      
      toast({
        title: "Success",
        description: "Settings saved successfully",
      })
    } catch (error) {
      console.error("Error saving settings:", error)
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleToggleSetting = (key: keyof SystemSettings) => {
    if (typeof settings[key] === 'boolean') {
      setSettings({
        ...settings,
        [key]: !settings[key],
        updated_at: new Date().toISOString()
      })
    }
  }

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>, field: string) => {
    setSettings({
      ...settings,
      [field]: e.target.value,
      updated_at: new Date().toISOString()
    })
  }

  const handleBranchInputChange = (e: ChangeEvent<HTMLInputElement>, field: keyof Omit<Branch, "id">) => {
    setNewBranch({
      ...newBranch,
      [field]: e.target.value
    })
  }

  const handleAddBranch = async () => {
    try {
      const response = await apiClient.createBranch(newBranch)
      if (!response.ok) {
        throw new Error("Failed to create branch")
      }

      const branch = await response.json()
      setSettings({
        ...settings,
        branch_set: [...settings.branch_set, branch],
        updated_at: new Date().toISOString()
      })
      setNewBranch({ name: "", code: "", is_active: true })
      
      toast({
        title: "Success",
        description: "Branch added successfully",
      })
    } catch (error) {
      console.error("Error adding branch:", error)
      toast({
        title: "Error",
        description: "Failed to add branch",
        variant: "destructive",
      })
    }
  }

  const handleUpdateBranch = async (id: string, updates: Partial<Branch>) => {
    try {
      const response = await apiClient.updateBranch(id, updates)
      if (!response.ok) {
        throw new Error("Failed to update branch")
      }

      const updatedBranch = await response.json()
      setSettings({
        ...settings,
        branch_set: settings.branch_set.map((branch: Branch) => 
          branch.id === id ? updatedBranch : branch
        ),
        updated_at: new Date().toISOString()
      })
      
      toast({
        title: "Success",
        description: "Branch updated successfully",
      })
    } catch (error) {
      console.error("Error updating branch:", error)
      toast({
        title: "Error",
        description: "Failed to update branch",
        variant: "destructive",
      })
    }
  }

  const handleDeleteBranch = async (id: string) => {
    if (!confirm("Are you sure you want to delete this branch?")) return

    try {
      const response = await apiClient.deleteBranch(id)
      if (!response.ok) {
        throw new Error("Failed to delete branch")
      }

      setSettings({
        ...settings,
        branch_set: settings.branch_set.filter((branch: Branch) => branch.id !== id),
        updated_at: new Date().toISOString()
      })
      
      toast({
        title: "Success",
        description: "Branch deleted successfully",
      })
    } catch (error) {
      console.error("Error deleting branch:", error)
      toast({
        title: "Error",
        description: "Failed to delete branch",
        variant: "destructive",
      })
    }
  }

  // Add a check for branch_set
  const branches = settings?.branch_set || []

  if (loading) {
    return (
      <DashboardLayout title="System Settings">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="System Settings">
      <Toaster />
      <div className="space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 lg:w-1/2">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="branches">Branches</TabsTrigger>
            <TabsTrigger value="business">Business</TabsTrigger>
            <TabsTrigger value="system">System</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-6">General Settings</h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Company Name</label>
                  <input
                    type="text"
                    value={settings.company_name}
                    onChange={(e) => handleInputChange(e, 'company_name')}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Enter company name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Default Branch</label>
                  <select
                    value={settings.default_branch}
                    onChange={(e) => handleInputChange(e, 'default_branch')}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">Select default branch</option>
                    {Array.from(branches).map((branch) => (
                      <option key={branch.id} value={branch.id}>{branch.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Job Number Format</label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <input
                        type="text"
                        value={settings.job_number_prefix}
                        onChange={(e) => handleInputChange(e, 'job_number_prefix')}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="Prefix (e.g., JOB-)"
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        value={settings.job_number_suffix}
                        onChange={(e) => handleInputChange(e, 'job_number_suffix')}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="Suffix (e.g., -2024)"
                      />
                    </div>
                  </div>
                  <p className="mt-2 text-sm text-gray-500">Example: {settings.job_number_prefix}001{settings.job_number_suffix}</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Currency & Tax</label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <select
                        value={settings.currency}
                        onChange={(e) => handleInputChange(e, 'currency')}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      >
                        <option value="USD">USD ($)</option>
                        <option value="EUR">EUR (€)</option>
                        <option value="GBP">GBP (£)</option>
                        <option value="ZWL">ZWL (ZW$)</option>
                      </select>
                    </div>
                    <div>
                      <input
                        type="number"
                        value={settings.tax_rate}
                        onChange={(e) => handleInputChange(e, 'tax_rate')}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="Tax rate %"
                        min="0"
                        max="100"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="branches" className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-6">Branch Management</h2>
              
              {/* Add New Branch */}
              <div className="mb-8 p-4 border border-gray-200 rounded-lg">
                <h3 className="text-lg font-medium mb-4">Add New Branch</h3>
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    value={newBranch.name}
                    onChange={(e) => setNewBranch({ ...newBranch, name: e.target.value })}
                    className="px-4 py-2 border border-gray-300 rounded-lg"
                    placeholder="Branch Name"
                  />
                  <input
                    type="text"
                    value={newBranch.code}
                    onChange={(e) => setNewBranch({ ...newBranch, code: e.target.value })}
                    className="px-4 py-2 border border-gray-300 rounded-lg"
                    placeholder="Branch Code"
                  />
                </div>
                <button
                  onClick={handleAddBranch}
                  className="mt-4 bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600"
                >
                  Add Branch
                </button>
              </div>

              {/* Branch List */}
              <div className="space-y-4">
                {branches.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No branches added yet</p>
                ) : (
                  <>
                    {Array.from(branches).map((branch) => (
                      <div key={branch.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                        <div>
                          <h4 className="font-medium">{branch.name}</h4>
                          <p className="text-sm text-gray-500">Code: {branch.code}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleUpdateBranch(branch.id, { is_active: !branch.is_active })}
                            className={`px-3 py-1 rounded-lg text-sm ${
                              branch.is_active 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {branch.is_active ? 'Active' : 'Inactive'}
                          </button>
                          <button
                            onClick={() => handleDeleteBranch(branch.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="business" className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-6">Business Information</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Business Hours</label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Opening Time</label>
                      <input
                        type="time"
                        value={settings.business_hours.start}
                        onChange={(e) => handleInputChange(e, 'business_hours.start')}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Closing Time</label>
                      <input
                        type="time"
                        value={settings.business_hours.end}
                        onChange={(e) => handleInputChange(e, 'business_hours.end')}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Contact Information</label>
                  <div className="space-y-4">
                    <input
                      type="tel"
                      value={settings.contact_info.phone}
                      onChange={(e) => handleInputChange(e, 'contact_info.phone')}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Phone Number"
                    />
                    <input
                      type="email"
                      value={settings.contact_info.email}
                      onChange={(e) => handleInputChange(e, 'contact_info.email')}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Email Address"
                    />
                    <textarea
                      value={settings.contact_info.address}
                      onChange={(e) => handleInputChange(e, 'contact_info.address')}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Business Address"
                      rows={3}
                    />
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="system" className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-6">System Settings</h2>
              
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900">Auto-approve new users</h3>
                    <p className="text-sm text-gray-500">Automatically approve new user registrations</p>
                  </div>
                  <button
                    onClick={() => handleToggleSetting('auto_approve_users')}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      settings.auto_approve_users ? "bg-primary-500" : "bg-gray-200"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        settings.auto_approve_users ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900">Email notifications</h3>
                    <p className="text-sm text-gray-500">Send email notifications for important events</p>
                  </div>
                  <button
                    onClick={() => handleToggleSetting('email_notifications')}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      settings.email_notifications ? "bg-primary-500" : "bg-gray-200"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        settings.email_notifications ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900">Maintenance mode</h3>
                    <p className="text-sm text-gray-500">Put the system in maintenance mode</p>
                  </div>
                  <button
                    onClick={() => handleToggleSetting('system_maintenance')}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      settings.system_maintenance ? "bg-red-500" : "bg-gray-200"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        settings.system_maintenance ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>

                {settings.system_maintenance && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Maintenance Message</label>
                    <textarea
                      value={settings.maintenance_message}
                      onChange={(e) => handleInputChange(e, 'maintenance_message')}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Enter maintenance message to display to users"
                      rows={3}
                    />
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Save Button */}
        <div className="flex justify-end space-x-4">
          <div className="text-sm text-gray-500 self-center">
            Last updated: {new Date(settings.updated_at).toLocaleString()}
          </div>
          <button
            onClick={handleSaveSettings}
            disabled={saving}
            className="bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white font-semibold px-8 py-3 rounded-xl transition-all duration-200 disabled:opacity-50 shadow-lg hover:shadow-xl"
          >
            {saving ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Saving...</span>
              </div>
            ) : (
              "Save Settings"
            )}
          </button>
        </div>
      </div>
    </DashboardLayout>
  )
}
