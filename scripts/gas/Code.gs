/**
 * Artcelerator Email Service - Google Apps Script
 * ============================================================================
 * Handles sending invitation emails and logging email activity.
 * Designed to be deployed as a Web App accessible by the Next.js backend.
 */

// ============================================================================
// CONFIGURATION
// ============================================================================

var CONFIG = {
  FROM_NAME: "Artcelerator Team",
  ENABLE_LOGGING: true,
  QUOTA_WARNING_THRESHOLD: 10,
  LOG_SPREADSHEET_NAME: "Artcelerator Email Logs",
  MAX_RETRIES: 3,
  RETRY_DELAY_MS: 1000
};

// ============================================================================
// MAIN ROUTER
// ============================================================================

/**
 * Main entry point for POST requests from Next.js.
 * @param {Object} e - Event object containing POST data.
 * @return {GoogleAppsScript.HTML.HtmlOutput} JSON response.
 */
function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return createErrorResponse("Invalid request format. Missing postData.", 400);
    }

    var request = JSON.parse(e.postData.contents);
    var action = request.action;
    var payload = request.payload;

    if (!action || !payload) {
      return createErrorResponse("Missing action or payload.", 400);
    }

    switch (action) {
      case "send_invitation":
        return handleSendInvitation(payload);
      case "check_quota":
        return handleCheckQuota();
      default:
        return createErrorResponse("Unknown action: " + action, 400);
    }
  } catch (error) {
    Logger.log("doPost Error: " + error.toString());
    return createErrorResponse("Internal server error: " + error.toString(), 500);
  }
}

// ============================================================================
// HANDLERS
// ============================================================================

/**
 * Handles the send_invitation action.
 * @param {Object} payload - The invitation details.
 * @return {GoogleAppsScript.HTML.HtmlOutput} JSON response.
 */
function handleSendInvitation(payload) {
  try {
    // 1. Validation
    var validationError = validateInvitationPayload(payload);
    if (validationError) {
      return createErrorResponse(validationError, 400);
    }

    // 2. Quota Check
    var quotaInfo = checkQuota();
    if (quotaInfo.remaining < 1) {
      return createErrorResponse("Daily email quota exceeded.", 429);
    }

    // 3. Batch processing (Handle array of recipients or single string)
    var recipients = [];
    if (Array.isArray(payload.to)) {
      recipients = payload.to;
    } else if (typeof payload.to === 'string') {
      recipients = payload.to.split(',').map(function(email) { return email.trim(); });
    }

    var results = [];
    var hasErrors = false;

    // Send to each recipient
    for (var i = 0; i < recipients.length; i++) {
      var recipient = recipients[i];
      if (!isValidEmail(recipient)) {
        results.push({ email: recipient, success: false, error: "Invalid email format" });
        hasErrors = true;
        continue;
      }

      // Build Template
      var subject = payload.inviterName + " mengundang Anda bergabung ke " + payload.workspaceName;
      var htmlBody = buildInvitationHtml(payload.inviterName, payload.workspaceName, payload.role, payload.inviteLink);

      // Send with Retry Logic
      var sendResult = sendEmailWithRetry(recipient, subject, htmlBody);
      
      // Log
      if (CONFIG.ENABLE_LOGGING) {
        logEmail(recipient, subject, sendResult.success ? "SUCCESS" : "FAILED", sendResult.error || "");
      }

      results.push({ email: recipient, success: sendResult.success, error: sendResult.error });
      if (!sendResult.success) hasErrors = true;
    }

    if (hasErrors) {
      return createSuccessResponse({
        message: "Invitation processing completed with some errors.",
        results: results,
        quotaRemaining: quotaInfo.remaining
      });
    }

    return createSuccessResponse({
      message: "Invitation email sent successfully",
      results: results,
      quotaRemaining: quotaInfo.remaining
    });

  } catch (error) {
    Logger.log("handleSendInvitation Error: " + error.toString());
    return createErrorResponse("Failed to process invitation: " + error.message, 500);
  }
}

/**
 * Handles the check_quota action.
 * @return {GoogleAppsScript.HTML.HtmlOutput} JSON response.
 */
function handleCheckQuota() {
  var info = checkQuota();
  return createSuccessResponse({
    remainingQuota: info.remaining,
    isWarning: info.isWarning
  });
}

// ============================================================================
// CORE FUNCTIONS
// ============================================================================

/**
 * Sends an email using GmailApp with retry logic.
 * @param {string} to - Recipient email.
 * @param {string} subject - Email subject.
 * @param {string} htmlBody - Email HTML body.
 * @return {Object} Result object with success and error properties.
 */
function sendEmailWithRetry(to, subject, htmlBody) {
  var attempts = 0;
  var success = false;
  var lastError = null;

  while (attempts < CONFIG.MAX_RETRIES && !success) {
    try {
      attempts++;
      GmailApp.sendEmail(to, subject, "", {
        htmlBody: htmlBody,
        name: CONFIG.FROM_NAME
      });
      success = true;
    } catch (e) {
      lastError = e.toString();
      Logger.log("Send attempt " + attempts + " failed for " + to + ": " + lastError);
      if (attempts < CONFIG.MAX_RETRIES) {
        Utilities.sleep(CONFIG.RETRY_DELAY_MS);
      }
    }
  }

  return {
    success: success,
    error: success ? null : lastError
  };
}

/**
 * Checks remaining daily quota.
 * @return {Object} Quota information.
 */
function checkQuota() {
  var remaining = MailApp.getRemainingDailyQuota();
  var isWarning = remaining <= CONFIG.QUOTA_WARNING_THRESHOLD;
  if (isWarning) {
    Logger.log("WARNING: Email quota is running low. Remaining: " + remaining);
  }
  return {
    remaining: remaining,
    isWarning: isWarning
  };
}

// ============================================================================
// TEMPLATING
// ============================================================================

/**
 * Builds the HTML body for the invitation email.
 * @param {string} inviterName - Name of the person inviting.
 * @param {string} workspaceName - Name of the workspace.
 * @param {string} role - Role assigned to the user.
 * @param {string} inviteLink - URL to accept the invitation.
 * @return {string} The formatted HTML string.
 */
function buildInvitationHtml(inviterName, workspaceName, role, inviteLink) {
  // Read template or generate inline
  var html = 
    "<div style=\"font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #18181b;\">" +
      "<div style=\"text-align: center; margin-bottom: 24px; background-color: #4285f4; padding: 20px; border-radius: 8px 8px 0 0;\">" +
        "<span style=\"font-size: 32px;\">🎨</span>" +
        "<h2 style=\"margin: 8px 0 0; color: #ffffff;\">Artcelerator Workspace</h2>" +
      "</div>" +
      
      "<div style=\"background-color: #ffffff; border: 1px solid #e4e4e7; border-top: none; border-radius: 0 0 8px 8px; padding: 32px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);\">" +
        "<p style=\"font-size: 16px; line-height: 1.5; margin-top: 0;\">Halo,</p>" +
        "<p style=\"font-size: 16px; line-height: 1.5;\">" +
          "<strong>" + inviterName + "</strong> mengundang Anda ke workspace <strong>" + workspaceName + "</strong> sebagai <strong>" + role + "</strong>." +
        "</p>" +
        
        "<div style=\"text-align: center; margin: 32px 0;\">" +
          "<a href=\"" + inviteLink + "\" style=\"display: inline-block; background-color: #18181b; color: #ffffff; font-weight: 600; font-size: 16px; text-decoration: none; padding: 12px 24px; border-radius: 8px;\">" +
            "Terima Undangan & Bergabung" +
          "</a>" +
        "</div>" +
        
        "<p style=\"font-size: 14px; color: #71717a; margin-bottom: 0;\">" +
          "Jika tombol tidak berfungsi, salin tautan berikut ke browser Anda:<br>" +
          "<a href=\"" + inviteLink + "\" style=\"color: #4285f4; word-break: break-all;\">" + inviteLink + "</a>" +
        "</p>" +
      "</div>" +
      
      "<div style=\"text-align: center; margin-top: 24px;\">" +
        "<p style=\"font-size: 12px; color: #a1a1aa;\">" +
          "Jika Anda tidak merasa meminta undangan ini, abaikan email ini.<br>" +
          "&copy; " + new Date().getFullYear() + " Artcelerator. Dikirim pada: " + new Date().toISOString() +
        "</p>" +
      "</div>" +
    "</div>";

  return html;
}

// ============================================================================
// LOGGING SYSTEM
// ============================================================================

/**
 * Logs email activity to a Google Spreadsheet.
 * @param {string} recipient - The email recipient.
 * @param {string} subject - The email subject.
 * @param {string} status - SUCCESS or FAILED.
 * @param {string} error - Error message if any.
 */
function logEmail(recipient, subject, status, error) {
  try {
    var ss;
    var files = DriveApp.getFilesByName(CONFIG.LOG_SPREADSHEET_NAME);
    
    if (files.hasNext()) {
      ss = SpreadsheetApp.open(files.next());
    } else {
      // Create new spreadsheet if not exists
      ss = SpreadsheetApp.create(CONFIG.LOG_SPREADSHEET_NAME);
      var sheet = ss.getActiveSheet();
      sheet.appendRow(["Timestamp", "Recipient", "Subject", "Status", "Error", "Sender"]);
      // Style header
      sheet.getRange(1, 1, 1, 6).setFontWeight("bold").setBackground("#f3f4f6");
      sheet.setFrozenRows(1);
    }

    var sheet = ss.getSheets()[0];
    sheet.appendRow([
      new Date().toISOString(),
      recipient,
      subject,
      status,
      error || "",
      CONFIG.FROM_NAME
    ]);
  } catch (e) {
    Logger.log("Failed to log email: " + e.toString());
  }
}

// ============================================================================
// HELPERS & VALIDATION
// ============================================================================

/**
 * Validates the payload for sending an invitation.
 * @param {Object} payload - The invitation payload.
 * @return {string|null} Error message if invalid, null if valid.
 */
function validateInvitationPayload(payload) {
  if (!payload.to) return "Missing 'to' field.";
  if (!payload.inviterName) return "Missing 'inviterName' field.";
  if (!payload.workspaceName) return "Missing 'workspaceName' field.";
  if (!payload.role) return "Missing 'role' field.";
  if (!payload.inviteLink) return "Missing 'inviteLink' field.";
  return null;
}

/**
 * Validates an email address format using regex.
 * @param {string} email - The email to validate.
 * @return {boolean} True if valid, false otherwise.
 */
function isValidEmail(email) {
  var regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

/**
 * Creates a success JSON response.
 * @param {Object} data - Data to include in the response.
 * @return {GoogleAppsScript.HTML.HtmlOutput} JSON output.
 */
function createSuccessResponse(data) {
  var response = {
    success: true,
    data: data,
    timestamp: new Date().toISOString()
  };
  return ContentService.createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Creates an error JSON response.
 * @param {string} errorMsg - Error message.
 * @param {number} statusCode - HTTP status code (logical).
 * @return {GoogleAppsScript.HTML.HtmlOutput} JSON output.
 */
function createErrorResponse(errorMsg, statusCode) {
  var response = {
    success: false,
    error: errorMsg,
    statusCode: statusCode,
    timestamp: new Date().toISOString()
  };
  return ContentService.createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON);
}

// ============================================================================
// TESTING FUNCTIONS
// ============================================================================

/**
 * Test function for sending an invitation.
 */
function testSendInvitation() {
  var testPayload = {
    to: "test@example.com", // Change to your email to test
    inviterName: "Test User",
    workspaceName: "Test Workspace",
    role: "CREATIVE_DIRECTOR",
    inviteLink: "https://example.com/invite"
  };
  
  var response = handleSendInvitation(testPayload);
  Logger.log(response.getContent());
}

/**
 * Test function for checking quota.
 */
function testQuotaCheck() {
  var info = checkQuota();
  Logger.log("Remaining Quota: " + info.remaining);
  Logger.log("Is Warning Level: " + info.isWarning);
}

/**
 * Test function for logging system.
 */
function testLogging() {
  logEmail("test@example.com", "Test Subject", "SUCCESS", "");
  Logger.log("Log entry created. Check your Google Drive for '" + CONFIG.LOG_SPREADSHEET_NAME + "'.");
}
