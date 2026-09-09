import { JobStatus } from '@/types/database'

export const STATUS_ORDER: JobStatus[] = ['draft', 'applied', 'interviewing', 'offer', 'rejected']

export const STATUS_LABELS: Record<JobStatus, string> = {
  draft: 'Draft',
  applied: 'Applied',
  interviewing: 'Interviewing',
  offer: 'Offer',
  rejected: 'Rejected'
}

export const STATUS_COLORS: Record<JobStatus, { dot: string, pillBg: string, pillText: string }> = {
  draft: { dot: '#5C5C58', pillBg: 'rgba(92,92,88,0.12)', pillText: '#E8E8E4' },
  applied: { dot: '#5B8DEF', pillBg: 'rgba(91,141,239,0.12)', pillText: '#E8E8E4' },
  interviewing: { dot: '#D9853B', pillBg: 'rgba(217,133,59,0.12)', pillText: '#E8E8E4' },
  offer: { dot: '#4DA34D', pillBg: 'rgba(77,163,77,0.12)', pillText: '#E8E8E4' },
  rejected: { dot: '#C9515B', pillBg: 'rgba(201,81,91,0.12)', pillText: '#E8E8E4' }
}

export const STATUS_CHANGE_MESSAGES: Record<JobStatus, string> = {
  draft: '', // No message for draft
  applied: "Application sent. You're in the game.",
  interviewing: "Nice. They want to talk. You've got this.",
  offer: "Congratulations. All that work paid off.",
  rejected: "Onward. Every no gets you closer to the right yes."
}