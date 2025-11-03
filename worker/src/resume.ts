/**
 * worker/src/resume.ts
 * This file handles requests for the resume, providing a short summary and a signed URL
 * for secure download of the full PDF.
 */

import { Env } from './index';
import { jsonResponse, createErrorResponse } from './index'; // Assuming these are in index.ts
import { safeLog } from './security-utils';

// In a real application, you would generate a secure, time-limited signed URL
// for an R2 object or other storage. For this example, we'll simulate it.
async function generateSignedUrl(env: Env, resumeFileName: string): Promise<string> {
  // This is a placeholder. In a real Cloudflare Worker, you would use
  // R2.get('your-bucket').getSignedUrl('read', resumeFileName, { expiration: 3600 });
  // or similar logic for other storage solutions.
  
  // For demonstration, we'll just return a dummy URL.
  // In a production scenario, ensure RESUME_SIGNER_SECRET is a strong, random key.
  if (!env.RESUME_SIGNER_SECRET) {
    safeLog('RESUME_SIGNER_SECRET is not set. Cannot generate signed URL.', 'error');
    throw new Error('Missing resume signer secret');
  }

  // Simulate signing logic (e.g., HMAC-SHA256 with a secret key)
  // IMPORTANT: Replace 'https://example.com/your-r2-bucket/' with your actual Cloudflare R2 public URL where the resume PDF is hosted.
  const baseUrl = 'https://example.com/your-r2-bucket/'; // YOUR_R2_PUBLIC_URL_HERE
  const expiry = Math.floor(Date.now() / 1000) + 3600; // Valid for 1 hour
  const dataToSign = `${resumeFileName}-${expiry}-${env.RESUME_SIGNER_SECRET}`;
  // A real signing process would involve a cryptographic hash here.
  const signature = btoa(dataToSign).substring(0, 16); // Dummy signature

  return `${baseUrl}${resumeFileName}?expires=${expiry}&signature=${signature}`;
}

export async function handleResumeRequest(request: Request, env: Env, corsHeaders: HeadersInit, securityHeaders: HeadersInit): Promise<Response> {
  if (request.method !== 'GET') {
    return createErrorResponse('Method Not Allowed', 405, corsHeaders, securityHeaders);
  }

  try {
    const resumeFileName = 'Gift_Mpho_Resume.pdf'; // Or derive from request if multiple resumes

    // Simulate fetching a short summary (e.g., from KV or a static asset)
    const shortSummary = {
      title: 'Gift Mpho - Software Engineer',
      experience: '5+ years in full-stack development, AI integration, and cloud infrastructure.',
      skills: ['TypeScript', 'Node.js', 'React', 'Cloudflare Workers', 'Gemini API', 'Docker'],
    };

    const signedUrl = await generateSignedUrl(env, resumeFileName);

    return jsonResponse({
      summary: shortSummary,
      downloadUrl: signedUrl,
    }, 200, { ...corsHeaders, ...securityHeaders });

  } catch (error: any) {
    safeLog('Error handling resume request', 'error', { error: error.message, stack: error.stack });
    return createErrorResponse('Sorry, I’m having trouble retrieving the resume right now.', 500, corsHeaders, securityHeaders);
  }
}
