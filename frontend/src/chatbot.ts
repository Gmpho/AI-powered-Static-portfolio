import { stateService } from '../stateService';
import { getTranslation as t } from './i18n';

const MAX_DEPTH = 5;

import env from './env';

function getWorkerURL(endpoint: string): string {
	const url = env.VITE_WORKER_URL;
	if (!url) {
		console.error(t('missingWorkerUrl'));
		throw new Error(t('missingWorkerUrl'));
	}
	return `${url}${endpoint}`;
}

export async function sendPrompt(
	prompt: string,
	onChunk: (chunk: any) => void,
	onComplete: () => void,
	onError: (error: string) => void,
	onLoading: (isLoading: boolean) => void,
	_depth = 0
): Promise<void> {
	onLoading(true);

	if (_depth > MAX_DEPTH) {
		onError(t('tooMuchRecursion'));
		onLoading(false);
		return;
	}

	try {
		const rawHistory = stateService.getState().chatHistory;
		const history = rawHistory.map(msg => ({
			role: msg.sender === 'user' ? 'user' : 'model',
			parts: [{ text: msg.text }],
		}));

		// Ensure conversation always starts with a user message
		if (history.length === 0 || history[0].role !== 'user') {
			history.unshift({ role: 'user', parts: [{ text: prompt }] });
		}

		const response = await fetch(getWorkerURL('/chat'), {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ prompt, history }),
		});

		if (!response.ok) {
			const errorText = await response.text();
			throw new Error(
				`HTTP error! status: ${response.status} - ${errorText}`
			);
		}

		const reader = response.body?.getReader();
		if (!reader) {
			throw new Error(t('noReadableStream'));
		}
				const decoder = new TextDecoder();
				let buffer = '';
				let isCompletionEventReceived = false;
		
				while (true) {
					const { done, value } = await reader.read();
					if (value) {
						buffer += decoder.decode(value, { stream: true });
					}
		
					// Process all complete lines in the buffer
					let lines = buffer.split('\n');
					buffer = lines.pop() || ''; // Keep the last (potentially incomplete) line
		
					for (const line of lines) {
						if (line.startsWith('data: ')) {
							const content = line.slice('data: '.length);
							if (content === '[DONE]') {
								isCompletionEventReceived = true;
								continue; // This marks the end of content, but stream might still have event: completion
							}
							try {
								const parsed = JSON.parse(content);
								if (parsed.response) {
									onChunk(parsed.response);
								} else if (parsed.toolCall) {
									document.dispatchEvent(new CustomEvent('display-contact-form'));
								}
							} catch (e) {
								console.error(t('errorParsingSse'), content, e);
							}
						} else if (line.startsWith('event: ')) {
							const eventType = line.slice('event: '.length);
							if (eventType === 'completion') {
								isCompletionEventReceived = true;
							}
						}
					}
		
					if (done && buffer.trim() === '') {
						// If stream is done and buffer is empty, and completion event was received or implied
						if (isCompletionEventReceived) {
							onComplete();
						}
						break;
					}
				}
			} catch (error) {
				console.error('Fetch error:', error);
				const errorMessage =
					error instanceof Error ? error.message : t('unknownError');
				onError(`${t('failedToConnect')} ${errorMessage}`);
			} finally {
				onLoading(false);
			}
		}
