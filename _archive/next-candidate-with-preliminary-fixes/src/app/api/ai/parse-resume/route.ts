/** External processing is intentionally unavailable in this local workspace. */
export async function POST() {
  return Response.json(
    { error: 'AI and URL import are unavailable in this local workspace. Paste the source text and edit your application using your own evidence.', code: 'LOCAL_WORKSPACE_ONLY' },
    { status: 503, headers: { 'Cache-Control': 'no-store' } },
  );
}
