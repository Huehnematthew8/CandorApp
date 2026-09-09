import { aiComplete } from '@/lib/ai';

export async function POST(request: Request) {
  try {
    const { url } = await request.json();

    if (!url || typeof url !== 'string') {
      return Response.json({ error: 'No URL provided' }, { status: 400 });
    }

    let text = '';
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml',
        },
      });
      const html = await res.text();
      text = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, ' ')
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, ' ')
        .replace(/<[^>]*>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 6000);
    } catch {
      return Response.json({ error: 'Could not fetch that URL' }, { status: 422 });
    }

    if (!text || text.length < 50) {
      return Response.json({ error: 'Page content too short — may be blocked' }, { status: 422 });
    }

    const prompt = `Extract comprehensive job listing information from this text. Return ONLY valid JSON with these fields:
{
  "company": "<company name>",
  "role": "<exact job title>",
  "location": "<city, state/country + remote/hybrid/onsite if mentioned>",
  "salary": "<salary range if mentioned, null otherwise>",
  "description": "<one concise sentence summarising the core purpose of the role, 120 characters maximum — never exceed this limit>",
  "requirements": ["<key requirement 1>", "<key requirement 2>", "...up to 8 most important requirements"],
  "nice_to_have": ["<nice to have 1>", "...up to 5"],
  "benefits": ["<benefit 1>", "...up to 5 notable benefits"],
  "team": "<team or department name if mentioned>",
  "reports_to": "<reporting manager title if mentioned>",
  "job_type": "<full-time/part-time/contract/internship>",
  "experience_level": "<junior/mid/senior/lead/principal>",
  "deadline": "<application deadline if mentioned>",
  "company_about": "<brief company description, 1-2 sentences>",
  "culture_keywords": ["<culture/value keyword 1>", "...up to 5"],
  "tech_stack": ["<technology 1>", "...if relevant"]
}

Return null for any field you can't determine from the text. Be thorough — this data helps users write better applications.

Text:
${text}`;

    const result = await aiComplete([
      { role: 'system', content: 'You extract structured data from job listings. Return only valid JSON, no markdown fences.' },
      { role: 'user', content: prompt },
    ], { temperature: 0.1 });

    const cleaned = result.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleaned);

    return Response.json({
      company: parsed.company || null,
      role: parsed.role || null,
      location: parsed.location || null,
      salary: parsed.salary || null,
      description: parsed.description || null,
      requirements: parsed.requirements || [],
      nice_to_have: parsed.nice_to_have || [],
      benefits: parsed.benefits || [],
      team: parsed.team || null,
      reports_to: parsed.reports_to || null,
      job_type: parsed.job_type || null,
      experience_level: parsed.experience_level || null,
      deadline: parsed.deadline || null,
      company_about: parsed.company_about || null,
      culture_keywords: parsed.culture_keywords || [],
      tech_stack: parsed.tech_stack || [],
    });
  } catch {
    return Response.json({ error: 'Failed to parse job listing' }, { status: 500 });
  }
}
