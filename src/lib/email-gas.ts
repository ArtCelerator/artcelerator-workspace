export interface SendInvitationEmailParams {
  to: string;
  inviterName: string;
  workspaceName: string;
  role: string;
  inviteLink: string;
}

export interface GASEmailResponse {
  success: boolean;
  data?: {
    message: string;
    recipient: string;
    timestamp: string;
  };
  error?: string;
  statusCode?: number;
  timestamp: string;
}

/**
 * Executes a fetch request with a timeout.
 */
async function fetchWithTimeout(resource: string, options: RequestInit & { timeout?: number }): Promise<Response> {
  const { timeout = 30000 } = options;
  
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  
  const response = await fetch(resource, {
    ...options,
    signal: controller.signal
  });
  clearTimeout(id);
  
  return response;
}

/**
 * Sends an invitation email via the Google Apps Script webhook with retry logic.
 * @param params Details of the invitation (recipient, role, link, etc.)
 */
export async function sendInvitationEmail(params: SendInvitationEmailParams): Promise<void> {
  const webhookUrl = process.env.GAS_EMAIL_WEBHOOK_URL;
  if (!webhookUrl) {
    throw new Error('Environment variable GAS_EMAIL_WEBHOOK_URL is not set.');
  }

  const payload = {
    action: 'send_invitation',
    payload: params
  };

  const maxRetries = 3;
  const baseDelay = 1000;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetchWithTimeout(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        timeout: 30000 // 30 seconds max
      });

      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json() as GASEmailResponse;

      if (!result.success) {
        throw new Error(`GAS API Error: ${result.error || 'Unknown error'} (Status: ${result.statusCode})`);
      }

      console.log(`[Email-GAS] Successfully sent invitation to ${params.to} on attempt ${attempt}`);
      return;
    } catch (error: any) {
      const isLastAttempt = attempt === maxRetries;
      
      console.warn(`[Email-GAS] Attempt ${attempt} failed:`, error.message);
      
      if (isLastAttempt) {
        console.error(`[Email-GAS] All ${maxRetries} attempts failed for ${params.to}.`);
        throw new Error(`Failed to send email after ${maxRetries} attempts: ${error.message}`);
      }
      
      // Exponential backoff
      const delay = baseDelay * Math.pow(2, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}
