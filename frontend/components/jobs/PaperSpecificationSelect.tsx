"use client"

import { useState, useEffect } from "react"
import { apiClient } from "@/lib/api"

interface PaperType {
  id: string
  name: string
  description: string
}

interface PaperWeight {
  id: string
  gsm: number
}

interface PaperSize {
  id: string
  name: string
  series: string
  width_mm: number
  height_mm: number
  dimensions: string
}

interface PaperSpecificationSelectProps {
  productTypeId: string
  onSpecificationChange: (specs: {
    paperTypeId: string | null
    paperWeightId: string | null
    paperSizeId: string | null
  }) => void
  className?: string
}

export default function PaperSpecificationSelect({
  productTypeId,
  onSpecificationChange,
  className = ""
}: PaperSpecificationSelectProps) {
  const [paperTypes, setPaperTypes] = useState<PaperType[]>([])
  const [paperWeights, setPaperWeights] = useState<PaperWeight[]>([])
  const [paperSizes, setPaperSizes] = useState<PaperSize[]>([])
  
  const [selectedPaperType, setSelectedPaperType] = useState<string | null>(null)
  const [selectedWeight, setSelectedWeight] = useState<string | null>(null)
  const [selectedSize, setSelectedSize] = useState<string | null>(null)
  
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (productTypeId) {
      fetchProductSpecifications()
    }
  }, [productTypeId])

  useEffect(() => {
    if (selectedPaperType) {
      fetchCompatibleWeights()
    } else {
      setPaperWeights([])
      setSelectedWeight(null)
    }
  }, [selectedPaperType])

  useEffect(() => {
    if (selectedWeight) {
      fetchCompatibleSizes()
    } else {
      setPaperSizes([])
      setSelectedSize(null)
    }
  }, [selectedWeight])

  useEffect(() => {
    onSpecificationChange({
      paperTypeId: selectedPaperType,
      paperWeightId: selectedWeight,
      paperSizeId: selectedSize
    })
  }, [selectedPaperType, selectedWeight, selectedSize, onSpecificationChange])

  const fetchProductSpecifications = async () => {
    try {
      const response = await apiClient.getCompatiblePaperTypes(productTypeId)
      if (response.ok) {
        const data = await response.json()
        setPaperTypes(data.paper_types || [])
      }
    } catch (error) {
      console.error("Error fetching product specifications:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCompatibleWeights = async () => {
    if (!selectedPaperType) return
    
    try {
      const response = await apiClient.getCompatibleWeights(selectedPaperType)
      if (response.ok) {
        const data = await response.json()
        setPaperWeights(data)
      }
    } catch (error) {
      console.error("Error fetching weights:", error)
    }
  }

  const fetchCompatibleSizes = async () => {
    if (!selectedWeight) return
    
    try {
      const response = await apiClient.getCompatibleSizes(selectedWeight)
      if (response.ok) {
        const data = await response.json()
        setPaperSizes(data)
      }
    } catch (error) {
      console.error("Error fetching sizes:", error)
    }
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-10 bg-gray-200 rounded"></div>
        <div className="h-10 bg-gray-200 rounded"></div>
        <div className="h-10 bg-gray-200 rounded"></div>
      </div>
    )
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Paper Type Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Paper Type
        </label>
        <select
          className="form-select block w-full"
          value={selectedPaperType || ""}
          onChange={(e) => setSelectedPaperType(e.target.value || null)}
        >
          <option value="">Select Paper Type</option>
          {paperTypes.map((type) => (
            <option key={type.id} value={type.id}>
              {type.name}
            </option>
          ))}
        </select>
      </div>

      {/* Paper Weight Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Paper Weight
        </label>
        <select
          className="form-select block w-full"
          value={selectedWeight || ""}
          onChange={(e) => setSelectedWeight(e.target.value || null)}
          disabled={!selectedPaperType}
        >
          <option value="">Select Paper Weight</option>
          {paperWeights.map((weight) => (
            <option key={weight.id} value={weight.id}>
              {weight.gsm} GSM
            </option>
          ))}
        </select>
      </div>

      {/* Paper Size Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Paper Size
        </label>
        <select
          className="form-select block w-full"
          value={selectedSize || ""}
          onChange={(e) => setSelectedSize(e.target.value || null)}
          disabled={!selectedWeight}
        >
          <option value="">Select Paper Size</option>
          {paperSizes.map((size) => (
            <option key={size.id} value={size.id}>
              {size.name} ({size.dimensions})
            </option>
          ))}
        </select>
      </div>
    </div>
  )
} 