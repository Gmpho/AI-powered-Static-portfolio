export const statusPageHtml = `
    <!doctype html>
    <html lang="en" class="fouc-hidden">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>API Status - AI-Powered Portfolio Worker</title>
        <style>
          :root {
            --color-primary: #4f46e5;
            --color-primary-hover: #4338ca;
            --color-primary-light: #eef2ff;
            --color-primary-disabled: #a5b4fc;
            --color-primary-rgb: 79, 70, 229; /* RGB for #4f46e5 */

            --color-bg: #f8fafc;
            --color-surface: #ffffff;
            --color-surface-rgb: 255, 255, 255; /* RGB for #ffffff */
            --color-surface-alt: #f1f5f9;
            --color-border: #e2e8f0;
            --color-shadow: rgba(0, 0, 0, 0.05);

            --color-text-primary: #1e293b;
            --color-text-secondary: #64748b;
            --color-text-on-primary: #ffffff;

            --color-danger: #ef4444;
            --color-danger-glow: rgba(239, 68, 68, 0.4);
          }

          [data-theme="dark"] {
            --color-primary: #6366f1;
            --color-primary-hover: #4f46e5;
            --color-primary-light: #3730a3;
            --color-primary-disabled: #4f46e5;
            --color-primary-rgb: 99, 102, 241; /* RGB for #6366f1 */

            --color-bg: #0f172a;
            --color-surface: #1e293b;
            --color-surface-rgb: 30, 41, 59; /* RGB for #1e293b */
            --color-surface-alt: #334155;
            --color-border: #475569;
            --color-shadow: rgba(0, 0, 0, 0.2);

            --color-text-primary: #f1f5f9;
            --color-text-secondary: #94a3b8;
            --color-text-on-primary: #ffffff;

            --color-danger: #f87171;
            --color-danger-glow: rgba(248, 113, 113, 0.4);
          }

          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }

          body {
            font-family: "Inter", sans-serif;
            background-color: var(--color-bg);
            color: var(--color-text-primary);
            line-height: 1.6;
            transition:
              background-color 0.3s ease,
              color 0.3s ease;
            display: grid;
            place-items: center;
            min-height: 100vh;
            text-align: center;
          }

          .container {
            max-width: 1100px;
            margin: 0 auto;
            padding: 0 2rem;
          }

          .status-card {
            background-color: var(--color-surface);
            border: 1px solid var(--color-border);
            border-radius: 0.75rem;
            padding: 3rem;
            box-shadow: 0 4px 6px -1px var(--color-shadow);
            max-width: 400px;
            margin: 2rem auto;
          }

          .status-card h1 {
            font-size: 2.5rem;
            font-weight: 800;
            margin-bottom: 1rem;
            color: var(--color-text-primary);
          }

          .status-card p {
            font-size: 1.1rem;
            color: var(--color-text-secondary);
            margin-bottom: 1.5rem;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="status-card">
            <h1>✅ AI-Powered Portfolio Worker is Running</h1>
            <p>This is the backend API for the AI Portfolio. It only responds to POST requests at the <code style="background-color: var(--color-surface-alt); padding: 0.2em 0.4em; border-radius: 0.25em; font-family: monospace;">/chat</code> endpoint.</p>
          </div>
        </div>
      </body>
    </html>
`;