import { aiComplete } from '@/lib/ai';

// pdf-parse tries to read a test file at import time — lazy-load to avoid build errors
async function parsePdf(buf: Buffer): Promise<{ text: string }> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pdfParse = require('pdf-parse') as (b: Buffer) => Promise<{ text: string }>;
  return pdfParse(buf);
}

const PROMPT_TEMPLATE = (resumeText: string) => `Extract structured profile information from this resume. Return ONLY valid JSON (no markdown, no preamble) with this exact structure:

{
  "name": "<full name>",
  "title": "<current or most recent job title>",
  "location": "<city, country or region>",
  "narrative": "<2-3 sentence professional summary in first person, written naturally — not corporate-speak>",
  "lookingFor": "<1-2 sentences about what they'd likely be looking for based on their trajectory>",
  "timeline": [
    { "year": "<start year>", "role": "<job title>", "company": "<company name>", "detail": "<key achievement or responsibility, 1 sentence>" }
  ],
  "skills": [
    { "name": "<skill name>", "level": <proficiency 50-95 based on evidence in resume> }
  ],
  "strengths": [
    { "title": "<strength name, 2-3 words>", "desc": "<why this is a strength based on resume evidence, 1 sentence>" }
  ],
  "observations": [
    "<actionable career observation or interview tip based on the resume, 1 sentence>"
  ]
}

Rules:
- Timeline: most recent first, max 6 entries
- Skills: max 8, only skills with clear evidence
- Strengths: exactly 3
- Observations: 2-4 items
- Write narrative and lookingFor in first person
- Be specific, reference actual companies and achievements from the resume

Resume:
${resumeText.slice(0, 8000)}`;

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get('content-type') || '';
    let resumeText = '';

    if (contentType.includes('multipart/form-data')) {
      // PDF or other binary file upload
      const formData = await request.formData();
      const file = formData.get('file') as File | null;
      if (!file) {
        return Response.json({ error: 'No file provided' }, { status: 400 });
      }
      const buffer = Buffer.from(await file.arrayBuffer());
      const parsed = await parsePdf(buffer);
      resumeText = parsed.text;
    } else {
      // Plain text (existing behaviour)
      const body = await request.json();
      resumeText = (body as { resumeText: string }).resumeText;
    }

    if (!resumeText?.trim()) {
      return Response.json({ error: 'No resume text could be extracted' }, { status: 400 });
    }

    const result = await aiComplete([
      { role: 'system', content: 'You are a resume analyst. Extract structured data and return only valid JSON.' },
      { role: 'user', content: PROMPT_TEMPLATE(resumeText) },
    ], { maxTokens: 4000 });

    const cleaned = result.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsedResult = JSON.parse(cleaned);

    return Response.json(parsedResult);
  } catch (err) {
    return Response.json(
      { error: 'Resume parsing failed', details: (err as Error).message },
      { status: 500 }
    );
  }
}
