export function extractBearerToken(request: Request): string | null {
  const header = request.headers.get('authorization') ?? '';
  if (header.toLowerCase().startsWith('bearer ')) {
    return header.slice(7).trim();
  }
  return null;
}
