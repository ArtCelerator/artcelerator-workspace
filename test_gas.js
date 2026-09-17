const webhookUrl = "https://script.google.com/macros/s/AKfycbwndDLzMAOqBbGgCfXlFEga-vQ74E5DpiWmIamNM9wPqzscBvD_WTi82QMFgNizfmoM/exec";

async function test() {
  const payload = {
    action: 'send_invitation',
    payload: {
      to: 'dasyam8@gmail.com', // user's email from earlier
      inviterName: 'Test Admin',
      workspaceName: 'Test Workspace',
      role: 'ADMIN',
      inviteLink: 'http://localhost:3000/register'
    }
  };

  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    console.log("Status:", res.status);
    const text = await res.text();
    console.log("Response Body:", text);
  } catch (err) {
    console.error("Error:", err);
  }
}
test();
