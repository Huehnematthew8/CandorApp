import { aiComplete } from '@/lib/ai';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { jobDescription, company, role, userSkills } = body as {
      jobDescription: string;
      company: string;
      role: string;
      userSkills?: string[];
    };

    const prompt = `Analyse this job description for the role of "${role}" at "${company}".

Job Description:
${jobDescription.slice(0, 4000)}

${userSkills?.length ? `Candidate skills: ${userSkills.join(', ')}` : 'Candidate is an experienced professional.'}

Return ONLY valid JSON (no markdown, no preamble, no explanation) with this exact structure:
{
  "fitScore": <number 0-100>,
  "matched": [<array of keywords found in both JD and candidate profile>],
  "gaps": [<array of keywords in JD not in candidate profile>],
  "angle": "<suggested application angle, 1-2 sentences>"
}`;

    const result = await aiComplete([
      { role: 'system', content: 'You are a job application analyst. Return only valid JSON.' },
      { role: 'user', content: prompt },
    ]);

    const cleaned = result.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleaned);

    return Response.json({
      fitScore: Math.min(100, Math.max(0, parsed.fitScore || 0)),
      matched: parsed.matched || [],
      gaps: parsed.gaps || [],
      angle: parsed.angle || '',
    });
  } catch (err) {
    return Response.json(
      { error: 'Analysis failed', details: (err as Error).message },
      { status: 500 }
    );
  }
}
