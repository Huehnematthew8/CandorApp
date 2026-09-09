'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Industry, Company, IndustryWithCompanies } from '@/types/database'

interface IndustriesContextType {
  industries: IndustryWithCompanies[]
  loading: boolean
  error: string | null
  refetch: () => void
  addIndustry: (name: string, emoji: string) => Promise<void>
  updateIndustry: (id: string, updates: Partial<Industry>) => Promise<void>
  deleteIndustry: (id: string) => Promise<void>
  addCompany: (industryId: string, company: Omit<Company, 'id' | 'industry_id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<void>
  updateCompany: (id: string, updates: Partial<Company>) => Promise<void>
  deleteCompany: (id: string) => Promise<void>
}

const IndustriesContext = createContext<IndustriesContextType | undefined>(undefined)

export function IndustriesProvider({ children }: { children: React.ReactNode }) {
  const [industries, setIndustries] = useState<IndustryWithCompanies[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchIndustries = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Fetch industries
      const { data: industriesData, error: industriesError } = await supabase
        .from('industries')
        .select('*')
        .eq('user_id', user.id)
        .order('display_order')

      if (industriesError) throw industriesError

      // Fetch companies
      const { data: companiesData, error: companiesError } = await supabase
        .from('companies')
        .select('*')
        .eq('user_id', user.id)
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

  const addIndustry = async (name: string, emoji: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const maxOrder = Math.max(0, ...industries.map(i => i.display_order))
      const newIndustry: Industry = {
        id: crypto.randomUUID(), // Temporary ID
        user_id: user.id,
        name,
        emoji,
        display_order: maxOrder + 1,
        is_open: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      // Optimistic update
      setIndustries(prev => [...prev, { ...newIndustry, companies: [] }])

      const { data, error } = await supabase
        .from('industries')
        .insert({
          user_id: user.id,
          name,
          emoji,
          display_order: maxOrder + 1,
          is_open: true
        })
        .select()
        .single()

      if (error) throw error

      // Update with real ID
      setIndustries(prev => prev.map(i => i.id === newIndustry.id ? { ...data, companies: [] } : i))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add industry')
      fetchIndustries() // Refetch on error
    }
  }

  const updateIndustry = async (id: string, updates: Partial<Industry>) => {
    try {
      // Optimistic update
      setIndustries(prev => prev.map(i => i.id === id ? { ...i, ...updates } : i))

      const { error } = await supabase
        .from('industries')
        .update(updates)
        .eq('id', id)

      if (error) throw error
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update industry')
      fetchIndustries()
    }
  }

  const deleteIndustry = async (id: string) => {
    try {
      // Optimistic update
      setIndustries(prev => prev.filter(i => i.id !== id))

      const { error } = await supabase
        .from('industries')
        .delete()
        .eq('id', id)

      if (error) throw error
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete industry')
      fetchIndustries()
    }
  }

  const addCompany = async (industryId: string, companyData: Omit<Company, 'id' | 'industry_id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const newCompany: Company = {
        id: crypto.randomUUID(),
        industry_id: industryId,
        user_id: user.id,
        ...companyData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      // Optimistic update
      setIndustries(prev => prev.map(i => 
        i.id === industryId 
          ? { ...i, companies: [newCompany, ...i.companies] }
          : i
      ))

      const { data, error } = await supabase
        .from('companies')
        .insert({
          industry_id: industryId,
          user_id: user.id,
          ...companyData
        })
        .select()
        .single()

      if (error) throw error

      // Update with real data
      setIndustries(prev => prev.map(i => 
        i.id === industryId 
          ? { ...i, companies: i.companies.map(c => c.id === newCompany.id ? data : c) }
          : i
      ))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add company')
      fetchIndustries()
    }
  }

  const updateCompany = async (id: string, updates: Partial<Company>) => {
    try {
      // Optimistic update
      setIndustries(prev => prev.map(i => ({
        ...i,
        companies: i.companies.map(c => c.id === id ? { ...c, ...updates } : c)
      })))

      const { error } = await supabase
        .from('companies')
        .update(updates)
        .eq('id', id)

      if (error) throw error
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update company')
      fetchIndustries()
    }
  }

  const deleteCompany = async (id: string) => {
    try {
      // Optimistic update
      setIndustries(prev => prev.map(i => ({
        ...i,
        companies: i.companies.filter(c => c.id !== id)
      })))

      const { error } = await supabase
        .from('companies')
        .delete()
        .eq('id', id)

      if (error) throw error
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete company')
      fetchIndustries()
    }
  }

  const value: IndustriesContextType = {
    industries,
    loading,
    error,
    refetch: fetchIndustries,
    addIndustry,
    updateIndustry,
    deleteIndustry,
    addCompany,
    updateCompany,
    deleteCompany
  }

  return (
    <IndustriesContext.Provider value={value}>
      {children}
    </IndustriesContext.Provider>
  )
}

export function useIndustriesContext() {
  const context = useContext(IndustriesContext)
  if (context === undefined) {
    throw new Error('useIndustriesContext must be used within an IndustriesProvider')
  }
  return context
}