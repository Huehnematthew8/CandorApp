'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Company, Email, Note, Contact, InterviewPrep, ActivityLog } from '@/types/database'

export function useCompany(id: string | null) {
  const [company, setCompany] = useState<Company | null>(null)
  const [emails, setEmails] = useState<Email[]>([])
  const [notes, setNotes] = useState<Note[]>([])
  const [contacts, setContacts] = useState<Contact[]>([])
  const [interviewPrep, setInterviewPrep] = useState<InterviewPrep | null>(null)
  const [activities, setActivities] = useState<ActivityLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCompany = async () => {
    if (!id) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Fetch company
      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .select('*')
        .eq('id', id)
        .single()

      if (companyError) throw companyError
      setCompany(companyData)

      // Fetch related data in parallel
      const [emailsRes, notesRes, contactsRes, prepRes, activitiesRes] = await Promise.all([
        supabase.from('emails').select('*').eq('company_id', id).order('created_at', { ascending: false }),
        supabase.from('notes').select('*').eq('company_id', id).order('created_at', { ascending: false }),
        supabase.from('contacts').select('*').eq('company_id', id).order('created_at', { ascending: false }),
        supabase.from('interview_prep').select('*').eq('company_id', id).single(),
        supabase.from('activity_log').select('*').eq('company_id', id).order('created_at', { ascending: false })
      ])

      if (emailsRes.error) throw emailsRes.error
      if (notesRes.error) throw notesRes.error
      if (contactsRes.error) throw contactsRes.error
      if (prepRes.error && prepRes.error.code !== 'PGRST116') throw prepRes.error // PGRST116 is not found
      if (activitiesRes.error) throw activitiesRes.error

      setEmails(emailsRes.data || [])
      setNotes(notesRes.data || [])
      setContacts(contactsRes.data || [])
      setInterviewPrep(prepRes.data)
      setActivities(activitiesRes.data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCompany()
  }, [id])

  const refetch = () => {
    fetchCompany()
  }

  return { company, emails, notes, contacts, interviewPrep, activities, loading, error, refetch }
}