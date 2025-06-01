const API_BASE_URL = "https://paragon-talu.onrender.com/api"



export interface SystemSettings {
  id: string
  company_name: string
  default_branch: string
  branch_set: Branch[]
  auto_approve_users: boolean
  email_notifications: boolean
  system_maintenance: boolean
  maintenance_message: string
  job_number_prefix: string
  job_number_suffix: string
  tax_rate: number
  currency: string
  business_hours: {
    start: string
    end: string
  }
  contact_info: {
    phone: string
    email: string
    address: string
  }
  updated_at: string
}

export interface Branch {
  id: string
  name: string
  code: string
  is_active: boolean
}

class ApiClient {
  private baseURL: string
  private token: string | null = null

  constructor() {
    this.baseURL = API_BASE_URL
    if (typeof window !== "undefined") {
      this.token = localStorage.getItem("access_token")
    }
  }

  setToken(token: string) {
    this.token = token
    if (typeof window !== "undefined") {
      localStorage.setItem("access_token", token)
    }
  }

  clearToken() {
    this.token = null
    if (typeof window !== "undefined") {
      localStorage.removeItem("access_token")
      localStorage.removeItem("refresh_token")
    }
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseURL}${endpoint}`

    // Normalize headers to a plain object
    let baseHeaders: Record<string, string> = {
      "Content-Type": "application/json",
    }

    if (options.headers) {
      if (options.headers instanceof Headers) {
        options.headers.forEach((value, key) => {
          baseHeaders[key] = value
        })
      } else if (Array.isArray(options.headers)) {
        options.headers.forEach(([key, value]) => {
          baseHeaders[key] = value
        })
      } else {
        baseHeaders = { ...baseHeaders, ...options.headers as Record<string, string> }
      }
    }

    const currentToken = this.token || (typeof window !== "undefined" ? localStorage.getItem("access_token") : null)
    if (currentToken) {
      baseHeaders.Authorization = `Bearer ${currentToken}`
    }

    const response = await fetch(url, {
      ...options,
      headers: baseHeaders,
    })

    if (response.status === 401) {
      await this.refreshToken()
      const newToken = this.token || (typeof window !== "undefined" ? localStorage.getItem("access_token") : null)
      if (newToken) {
        baseHeaders.Authorization = `Bearer ${newToken}`
        return fetch(url, { ...options, headers: baseHeaders })
      }
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || errorData.message || errorData.detail || 'Request failed')
    }

    return response
  }

  private async refreshToken() {
    const refreshToken = typeof window !== "undefined" ? localStorage.getItem("refresh_token") : null
    if (!refreshToken) {
      this.clearToken()
      return false
    }

    try {
      const response = await fetch(`${this.baseURL}/auth/token/refresh/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh: refreshToken }),
      })

      if (response.ok) {
        const data = await response.json()
        this.setToken(data.access)
        return true
      } else {
        this.clearToken()
        return false
      }
    } catch (error) {
      this.clearToken()
      return false
    }
  }

  // Auth endpoints
  async login(email: string, password: string) {
      console.log("Login Request Payload:", { email, password });  // Debug log
      const response = await this.request("/auth/login/", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      })
      return response
  }

  async register(userData: { full_name: string; email: string; password: string; confirm_password: string }) {
    const response = await this.request("/auth/register/", {
      method: "POST",
      body: JSON.stringify(userData),
    })
    return response
  }

  async getProfile() {
    const response = await this.request("/auth/profile/")
    return response
  }

  // Admin endpoints
  async getAdminStats() {
    const response = await this.request("/auth/admin/stats/")
    return response
  }

  async getUsers() {
    const response = await this.request("/auth/users/")
    return response
  }

  async getPendingUsers() {
    const response = await this.request("/auth/pending-users/")
    return response
  }

  async approveUser(userId: number, role: string) {
    const response = await this.request("/auth/approve-user/", {
      method: "POST",
      body: JSON.stringify({ user_id: userId, role, action: "approve" }),
    })
    return response
  }

  async declineUser(userId: number) {
    const response = await this.request("/auth/approve-user/", {
      method: "POST",
      body: JSON.stringify({ user_id: userId, action: "decline" }),
    })
    return response
  }

  // Job endpoints
  async getJobs(params?: Record<string, string>) {
    const queryString = params ? "?" + new URLSearchParams(params).toString() : ""
    const response = await this.request(`/jobs/${queryString}`)
    return response
  }

  async createJob(jobData: any) {
    const response = await this.request("/jobs/", {
      method: "POST",
      body: JSON.stringify(jobData),
    })
    return response
  }

  async getJob(jobId: number) {
    const response = await this.request(`/jobs/${jobId}/`)
    return response
  }

  async updateJob(jobId: number, jobData: any) {
    const response = await this.request(`/jobs/${jobId}/`, {
      method: "PUT",
      body: JSON.stringify(jobData),
    })
    return response
  }

  async updateJobStatus(jobId: number, status: string) {
    const response = await this.request(`/jobs/${jobId}/status/`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    })
    return response
  }

  async updateJobPayment(jobId: number, paymentData: { payment_status: string; payment_ref?: string }) {
    const response = await this.request(`/jobs/${jobId}/payment/`, {
      method: "PATCH",
      body: JSON.stringify(paymentData),
    })
    return response
  }

  async getPendingJobs() {
    const response = await this.request("/jobs/pending/")
    return response
  }

  async getDocketCounter(type = "LOCAL") {
    const response = await this.request(`/jobs/docket-counter/?type=${type}`)
    return response
  }

  async getJobAnalytics() {
    const response = await this.request("/jobs/analytics/")
    return response
  }

  async getDesignerStats() {
    const response = await this.request("/jobs/designer-stats/")
    return response
  }

  // Payment Statistics Methods
  async getPaymentStats() {
    return this.request('/jobs/payment-stats/')
  }

  async getRecentTransactions() {
    return this.request('/jobs/recent-transactions/')
  }

  // Product endpoints
  async getProductTypes() {
    const response = await this.request("/products/product-types/")
    return response
  }

  async getPaperTypes() {
    const response = await this.request("/products/paper-types/")
    return response
  }

  async createProductType(name: string) {
    const response = await this.request("/products/product-types/", {
      method: "POST",
      body: JSON.stringify({ name }),
    })
    return response
  }

  async createPaperType(name: string) {
    const response = await this.request("/products/paper-types/", {
      method: "POST",
      body: JSON.stringify({ name }),
    })
    return response
  }

  async getBranches() {
    return this.request("/jobs/branches/")
  }

  // Paper Specification Methods
  async getCompatiblePaperTypes(productTypeId: string) {
    return this.request(`/products/product-types/${productTypeId}/specifications/`)
  }

  async getPaperWeights() {
    return this.request('/products/paper-weights/')
  }

  async getCompatibleWeights(paperTypeId: string) {
    return this.request(`/products/paper-types/weights/?paper_type_id=${paperTypeId}`)
  }

  async getCompatibleSizes(weightId: string) {
    return this.request(`/products/paper-weights/sizes/?weight_id=${weightId}`)
  }

  async createCustomSize(data: {
    name: string;
    width_mm: number;
    height_mm: number;
    weight_id: string;
  }) {
    return this.request('/products/paper-sizes/custom/', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  // Settings endpoints
  async getSystemSettings() {
    return this.request('/settings/')
  }

  async updateSystemSettings(settings: Partial<SystemSettings>) {
    return this.request('/settings/', {
      method: 'PUT',
      body: JSON.stringify(settings)
    })
  }

  // Branch management
  async createBranch(branch: Omit<Branch, 'id'>) {
    return this.request('/settings/branches/', {
      method: 'POST',
      body: JSON.stringify(branch)
    })
  }

  async updateBranch(id: string, branch: Partial<Branch>) {
    return this.request(`/settings/branches/${id}/`, {
      method: 'PUT',
      body: JSON.stringify(branch)
    })
  }

  async deleteBranch(id: string) {
    return this.request(`/settings/branches/${id}/`, {
      method: 'DELETE'
    })
  }
}

export const apiClient = new ApiClient()
