'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Industry, Company } from '@/types/database'

export interface IndustryWithCompanies extends Industry {
  companies: Company[]
}

export function useIndustries() {
  const [industries, setIndustries] = useState<IndustryWithCompanies[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchIndustries = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch industries
      const { data: industriesData, error: industriesError } = await supabase
        .from('industries')
        .select('*')
        .order('display_order')

      if (industriesError) throw industriesError

      // Fetch companies for all industries
      const { data: companiesData, error: companiesError } = await supabase
        .from('companies')
        .select('*')
        .order('created_at', { ascending: false })

      if (companiesError) throw companiesError

      // Group companies by industry
      const industriesWithCompanies: IndustryWithCompanies[] = industriesData.map(industry => ({
        ...industry,
        companies: companiesData.filter(company => company.industry_id === industry.id)
      }))

      setIndustries(industriesWithCompanies)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchIndustries()
  }, [])

  const refetch = () => {
    fetchIndustries()
  }

  return { industries, loading, error, refetch }
}