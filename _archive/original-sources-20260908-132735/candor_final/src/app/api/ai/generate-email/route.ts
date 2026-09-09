import { aiStream } from '@/lib/ai';
import type { JobStatus, Tone } from '@/types';

const STAGE_LABELS: Record<JobStatus, string> = {
  saved: 'Cover Letter',
  applied: 'Follow-up',
  screening: 'Pre-screen note',
  interview: 'Thank You',
  round1: 'Thank You — Round 1',
  round2: 'Thank You — Round 2',
  offer: 'Negotiation',
  rejected: 'Keep the door open',
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { company, role, stage, tone, why, narrative, refinement, jd_summary } = body as {
      company: string;
      role: string;
      stage: JobStatus;
      tone: Tone;
      why: string;
      narrative?: string;
      refinement?: string;
      jd_summary?: string;
    };

    const isCoverLetter =
      typeof refinement === 'string' &&
      /FORMAL COVER LETTER|cover letter/i.test(refinement);

    const systemPrompt = isCoverLetter
      ? `You are a professional writing assistant drafting cover letters. Sound human and specific—never generic. Avoid filler ("I am excited to apply", "I am passionate about", "leverage", "synergy", "great fit"). Write in first person. Use real details from the job description and the candidate's background when provided. Do not use bracket placeholders like [platform], [your industry], or [mention X]—write concrete sentences or omit if information is missing. A short professional sign-off is fine; use a single line like "Sincerely" plus a newline for the applicant to type their name—do not write "[Your Name]".`
      : `You are a professional writing assistant helping job seekers write authentic, personalised job application emails. Write emails that sound human and specific, never generic. Never use phrases like "I am excited to apply", "I am passionate about", "leverage", "synergy", or "I would be a great fit". Always write in first person. Keep emails under 200 words. End with a clear next step. Do not use bracket-style template placeholders—write concrete text from the context given.`;

    let userPrompt = `Write a ${STAGE_LABELS[stage] || 'Cover Letter'} for this application.

Company: ${company}
Role: ${role}
Tone: ${tone}
Why this role matters: ${why || 'Not specified'}
My background: ${narrative || 'Experienced professional'}
${jd_summary ? `\nJob description context:\n${jd_summary.slice(0, 2000)}` : ''}

Write only the body text. No subject line.`;

    if (refinement) {
      userPrompt += `\n\nAdditional instruction: ${refinement}`;
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          await aiStream(
            [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt },
            ],
            (text) => {
              const data = JSON.stringify({ choices: [{ delta: { content: text } }] });
              controller.enqueue(encoder.encode(`data: ${data}\n\n`));
            },
            { maxTokens: isCoverLetter ? 2500 : 1200 }
          );
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: 'Generation failed' })}\n\n`));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch {
    return Response.json({ error: 'Invalid request' }, { status: 400 });
  }
}
