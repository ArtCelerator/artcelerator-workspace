import { sendInvitationEmail } from './src/lib/email-gas';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  try {
    await sendInvitationEmail({
      to: 'dasyam8@gmail.com',
      inviterName: 'System Test',
      workspaceName: 'Test Workspace',
      role: 'ADMIN',
      inviteLink: 'http://localhost:3000/register'
    });
    console.log("Success calling sendInvitationEmail");
  } catch (err) {
    console.error("Error calling sendInvitationEmail:", err);
  }
}
run();
