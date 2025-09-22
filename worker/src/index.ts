interface Env {
    GEMINI_API_KEY: string;
    ALLOWED_ORIGINS?: string;
}

export default {
    async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
        const origin = request.headers.get('Origin') || '';
        const allowedOrigins = (env.ALLOWED_ORIGINS || 'http://localhost:5173,http://127.0.0.1:5173').split(',');

        let corsHeaders = {};
        if (allowedOrigins.includes(origin)) {
            corsHeaders = {
                'Access-Control-Allow-Origin': origin,
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
            };
        }

        if (request.method === 'OPTIONS') {
            return new Response(null, { headers: corsHeaders });
        }

        const url = new URL(request.url);
        if (url.pathname !== '/chat') {
            return new Response('Not Found', { status: 404 });
        }

        if (request.method !== 'POST') {
            return new Response('Expected POST request', { status: 405, headers: corsHeaders });
        }

        if (!env.GEMINI_API_KEY) {
            return new Response('Missing server configuration. Please check your .dev.vars file.', { status: 500, headers: corsHeaders });
        }

        try {
            const requestBody: { prompt?: string } = await request.json();
            const prompt = requestBody.prompt;

            if (!prompt) {
                return new Response('Missing prompt in request body', { status: 400, headers: corsHeaders });
            }

            const model = 'gemini-1.5-flash';

            const googleApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

            const geminiRequest = {
                contents: [
                    {
                        parts: [{ text: prompt }],
                    },
                ],
            };

            const geminiResponse = await fetch(googleApiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-goog-api-key': env.GEMINI_API_KEY,
                },
                body: JSON.stringify(geminiRequest),
            });

            if (!geminiResponse.ok) {
                const errorText = await geminiResponse.text();
                return new Response(`Error from AI service: ${errorText}`, { status: geminiResponse.status, headers: corsHeaders });
            }

            const geminiData = await geminiResponse.json();

            return new Response(JSON.stringify(geminiData), {
                headers: { 'Content-Type': 'application/json', ...corsHeaders },
            });

        } catch (error) {
            return new Response('Internal Server Error', { status: 500, headers: corsHeaders });
        }
    },
} satisfies ExportedHandler<Env>;