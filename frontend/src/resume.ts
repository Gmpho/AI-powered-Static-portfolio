/**
 * frontend/src/resume.ts
 * This file handles fetching the resume summary and signed download URL from the worker,
 * and can be extended to display a PDF embed.
 */

import env from './env';

interface ResumeSummary {
  title: string;
  experience: string;
  skills: string[];
}

interface ResumeData {
  summary: ResumeSummary;
  downloadUrl: string;
}

export async function fetchResumeData(): Promise<ResumeData | null> {
  const workerUrl = env.VITE_WORKER_URL?.replace(/\/$/, '');

  if (!workerUrl) {
    console.error("Configuration error: VITE_WORKER_URL is not set.");
    return null;
  }

  try {
    const response = await fetch(`${workerUrl}/resume`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Failed to fetch resume data: ${response.status} - ${errorText}`);
      return null;
    }

    const data: ResumeData = await response.json();
    return data;
  } catch (error) {
    console.error("An error occurred while fetching resume data:", error);
    return null;
  }
}

/**
 * Function to display the PDF embed. This would typically be called by a UI component.
 * @param downloadUrl The signed URL to the PDF.
 * @param containerId The ID of the HTML element where the PDF should be embedded.
 */
export function displayPdfEmbed(downloadUrl: string, containerId: string): void {
  const container = document.getElementById(containerId);
  if (container) {
    container.innerHTML = `
      <iframe
        src="${downloadUrl}"
        width="100%"
        height="600px"
        class="resume-iframe"
        title="Resume PDF"
      ></iframe>
    `;
  } else {
    console.error(`Container with ID '${containerId}' not found for PDF embed.`);
  }
}
