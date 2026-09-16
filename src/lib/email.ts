import { Resend } from 'resend';

const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;

interface SendTeamInviteEmailParams {
  toEmail: string;
  inviterName: string;
  workspaceName: string;
  roleName: string;
  inviteLink: string;
}

export async function sendTeamInviteEmail({
  toEmail,
  inviterName,
  workspaceName,
  roleName,
  inviteLink,
}: SendTeamInviteEmailParams) {
  if (!resend) {
    console.warn('RESEND_API_KEY is not set. Skipping email send for:', toEmail);
    return;
  }

  try {
    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1c2430;">
        <div style="text-align: center; margin-bottom: 24px;">
          <span style="font-size: 32px;">📋</span>
          <h2 style="margin: 8px 0 0; color: #1c2430;">Artcelerator Workspace</h2>
        </div>
        
        <div style="background-color: #ffffff; border: 1px solid #e4e4e7; border-radius: 12px; padding: 32px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
          <p style="font-size: 16px; line-height: 1.5; margin-top: 0;">Halo,</p>
          <p style="font-size: 16px; line-height: 1.5;">
            <strong>${inviterName}</strong> mengundang Anda untuk bergabung ke workspace <strong>${workspaceName}</strong> sebagai <strong>${roleName}</strong>.
          </p>
          
          <div style="text-align: center; margin: 32px 0;">
            <a href="${inviteLink}" style="display: inline-block; background-color: #18181b; color: #ffffff; font-weight: 600; font-size: 16px; text-decoration: none; padding: 12px 24px; border-radius: 8px;">
              Terima Undangan & Bergabung
            </a>
          </div>
          
          <p style="font-size: 14px; color: #71717a; margin-bottom: 0;">
            Jika tombol tidak berfungsi, salin tautan berikut ke browser Anda:<br>
            <a href="${inviteLink}" style="color: #2563eb; word-break: break-all;">${inviteLink}</a>
          </p>
        </div>
        
        <div style="text-align: center; margin-top: 24px;">
          <p style="font-size: 12px; color: #a1a1aa;">
            Jika Anda tidak merasa meminta undangan ini, abaikan email ini.
          </p>
        </div>
      </div>
    `;

    const response = await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: toEmail,
      subject: `${inviterName} mengundang Anda bergabung ke ${workspaceName}`,
      html: htmlBody,
    });

    if (response.error) {
      console.error('Resend API returned an error:', response.error);
    } else {
      console.log(`Team invite email sent successfully to ${toEmail}. Response:`, response.data);
    }
  } catch (error) {
    console.error('Failed to send team invite email. Exception details:', error);
  }
}
