export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const HOP_BY_HOP_HEADERS = [
  'connection',
  'content-length',
  'host',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade'
];

async function proxyToApi(request: Request): Promise<Response> {
  const serviceUrl = process.env.API_SERVICE_URL;
  if (!serviceUrl) return Response.json({ message: 'The API service binding is not configured.' }, { status: 503 });

  const incomingUrl = new URL(request.url);
  const targetUrl = new URL(serviceUrl);
  targetUrl.pathname = `${targetUrl.pathname.replace(/\/$/, '')}${incomingUrl.pathname}`;
  targetUrl.search = incomingUrl.search;
  targetUrl.hash = '';

  const headers = new Headers(request.headers);
  HOP_BY_HOP_HEADERS.forEach((name) => headers.delete(name));

  try {
    const upstream = await fetch(targetUrl, {
      method: request.method,
      headers,
      body: request.method === 'GET' || request.method === 'HEAD' ? undefined : await request.arrayBuffer(),
      cache: 'no-store',
      redirect: 'manual'
    });
    const responseHeaders = new Headers(upstream.headers);
    HOP_BY_HOP_HEADERS.forEach((name) => responseHeaders.delete(name));
    return new Response(upstream.body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: responseHeaders
    });
  } catch {
    return Response.json({ message: 'The API service is unavailable.' }, { status: 502 });
  }
}

export const GET = proxyToApi;
export const POST = proxyToApi;
export const PUT = proxyToApi;
export const DELETE = proxyToApi;
