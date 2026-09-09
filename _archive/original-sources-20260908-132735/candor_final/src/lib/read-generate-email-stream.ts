/**
 * Parses SSE from POST /api/ai/generate-email.
 * Each event is: data: {"choices":[{"delta":{"content":"..."}}]}
 */
export async function readGenerateEmailSseStream(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  onTextDelta: (delta: string) => void
): Promise<{ error?: string }> {
  const decoder = new TextDecoder();
  let carry = '';

  function processLine(line: string): string | undefined {
    if (!line.startsWith('data: ')) return undefined;
    const payload = line.slice(6).trim();
    if (payload === '[DONE]' || !payload) return undefined;
    try {
      const parsed = JSON.parse(payload) as {
        error?: string;
        choices?: { delta?: { content?: string | null } }[];
      };
      if (parsed.error) return parsed.error;
      const piece = parsed.choices?.[0]?.delta?.content;
      if (typeof piece === 'string' && piece.length > 0) onTextDelta(piece);
    } catch {
      /* ignore malformed line */
    }
    return undefined;
  }

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    carry += decoder.decode(value, { stream: true });

    let nl: number;
    while ((nl = carry.indexOf('\n')) !== -1) {
      let line = carry.slice(0, nl);
      carry = carry.slice(nl + 1);
      if (line.endsWith('\r')) line = line.slice(0, -1);
      const err = processLine(line);
      if (err) return { error: err };
    }
  }

  if (carry.trim()) {
    let line = carry;
    if (line.endsWith('\r')) line = line.slice(0, -1);
    const err = processLine(line);
    if (err) return { error: err };
  }

  return {};
}
