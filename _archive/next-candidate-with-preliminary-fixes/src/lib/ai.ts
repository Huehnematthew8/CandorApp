/**
 * Multi-provider AI client.
 *
 * Supports three backends via env vars:
 *   1. Ollama   (local dev)    — AI_PROVIDER=openai, AI_BASE_URL=http://localhost:11434/v1
 *   2. Gemini   (free prod)    — AI_PROVIDER=gemini  (uses Google's OpenAI-compat endpoint)
 *   3. Anthropic (paid prod)   — AI_PROVIDER=anthropic
 *
 * Default: falls back to Ollama-style OpenAI-compatible endpoint.
 */

const AI_PROVIDER = (process.env.AI_PROVIDER || 'openai').toLowerCase();
const AI_BASE_URL = process.env.AI_BASE_URL || 'http://localhost:11434/v1';
const AI_MODEL = process.env.AI_MODEL || 'llama3.1:8b';
const AI_API_KEY = process.env.AI_API_KEY || 'ollama';

interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface AIOptions {
  temperature?: number;
  maxTokens?: number;
}

/* ────────────────────────────────────────────────────────────
   Anthropic (/messages endpoint)
   ──────────────────────────────────────────────────────────── */

async function anthropicComplete(messages: Message[], options: AIOptions): Promise<string> {
  const system = messages.filter((m) => m.role === 'system').map((m) => m.content).join('\n\n');
  const turns = messages.filter((m) => m.role !== 'system');

  const response = await fetch(`${AI_BASE_URL}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': AI_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: AI_MODEL,
      system: system || undefined,
      messages: turns.map((m) => ({ role: m.role, content: m.content })),
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 1024,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Anthropic request failed: ${error}`);
  }

  const data = await response.json();
  return data.content?.[0]?.text ?? '';
}

async function anthropicStream(
  messages: Message[],
  onChunk: (text: string) => void,
  options: AIOptions,
): Promise<void> {
  const system = messages.filter((m) => m.role === 'system').map((m) => m.content).join('\n\n');
  const turns = messages.filter((m) => m.role !== 'system');

  const response = await fetch(`${AI_BASE_URL}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': AI_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: AI_MODEL,
      system: system || undefined,
      messages: turns.map((m) => ({ role: m.role, content: m.content })),
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 1024,
      stream: true,
    }),
  });

  if (!response.ok) throw new Error('Anthropic stream failed');

  const reader = response.body?.getReader();
  const decoder = new TextDecoder();
  if (!reader) return;

  let buffer = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const data = line.slice(6).trim();
      if (data === '[DONE]') return;
      try {
        const parsed = JSON.parse(data);
        if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
          onChunk(parsed.delta.text);
        }
      } catch {
        // ignore malformed chunks
      }
    }
  }
}

/* ────────────────────────────────────────────────────────────
   Google Gemini (OpenAI-compatible endpoint)
   ──────────────────────────────────────────────────────────── */

function geminiBaseUrl(): string {
  return 'https://generativelanguage.googleapis.com/v1beta/openai';
}

function geminiModel(): string {
  return AI_MODEL || 'gemini-2.0-flash';
}

/* ────────────────────────────────────────────────────────────
   OpenAI-compatible (Ollama, Gemini, OpenRouter, etc.)
   ──────────────────────────────────────────────────────────── */

async function openaiComplete(baseUrl: string, model: string, apiKey: string, messages: Message[], options: AIOptions): Promise<string> {
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 1024,
      stream: false,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`AI request failed: ${error}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

async function openaiStream(
  baseUrl: string,
  model: string,
  apiKey: string,
  messages: Message[],
  onChunk: (text: string) => void,
  options: AIOptions,
): Promise<void> {
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 1024,
      stream: true,
    }),
  });

  if (!response.ok) throw new Error('AI stream failed');

  const reader = response.body?.getReader();
  const decoder = new TextDecoder();
  if (!reader) return;

  let buffer = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const data = line.slice(6).trim();
      if (data === '[DONE]') return;
      try {
        const parsed = JSON.parse(data);
        const text = parsed.choices?.[0]?.delta?.content;
        if (text) onChunk(text);
      } catch {
        // ignore malformed chunks
      }
    }
  }
}

/* ────────────────────────────────────────────────────────────
   Public API — delegates to the correct provider
   ──────────────────────────────────────────────────────────── */

export async function aiComplete(
  messages: Message[],
  options: AIOptions = {},
): Promise<string> {
  if (AI_PROVIDER === 'anthropic') {
    return anthropicComplete(messages, options);
  }
  if (AI_PROVIDER === 'gemini') {
    return openaiComplete(geminiBaseUrl(), geminiModel(), AI_API_KEY, messages, options);
  }
  // Default: OpenAI-compatible (Ollama, OpenRouter, etc.)
  return openaiComplete(AI_BASE_URL, AI_MODEL, AI_API_KEY, messages, options);
}

export async function aiStream(
  messages: Message[],
  onChunk: (text: string) => void,
  options: AIOptions = {},
): Promise<void> {
  if (AI_PROVIDER === 'anthropic') {
    return anthropicStream(messages, onChunk, options);
  }
  if (AI_PROVIDER === 'gemini') {
    return openaiStream(geminiBaseUrl(), geminiModel(), AI_API_KEY, messages, onChunk, options);
  }
  return openaiStream(AI_BASE_URL, AI_MODEL, AI_API_KEY, messages, onChunk, options);
}
