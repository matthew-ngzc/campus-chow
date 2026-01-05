import { Buffer } from 'buffer';

/**
 * Strip HTML tags and decode HTML entities
 * @param {string} html
 * @returns {string} Plain text
 */
function stripHtml(html) {
  // Remove script and style tags completely
  let text = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  text = text.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
  
  // Replace <br>, <p>, <div> with newlines
  text = text.replace(/<br\s*\/?>/gi, '\n');
  text = text.replace(/<\/p>/gi, '\n');
  text = text.replace(/<\/div>/gi, '\n');
  
  // Remove all other HTML tags
  text = text.replace(/<[^>]+>/g, ' ');
  
  // Decode common HTML entities
  text = text.replace(/&nbsp;/g, ' ');
  text = text.replace(/&amp;/g, '&');
  text = text.replace(/&lt;/g, '<');
  text = text.replace(/&gt;/g, '>');
  text = text.replace(/&quot;/g, '"');
  text = text.replace(/&#39;/g, "'");
  
  // Collapse multiple spaces/newlines
  text = text.replace(/ +/g, ' ');
  text = text.replace(/\n+/g, '\n');
  
  return text.trim();
}

/**
 * Parse email body from Gmail API response
 * @param {object} payload - Email payload from Gmail API
 * @returns {string} Decoded email body
 */
function getEmailBody(payload) {
  let body = '';
  let htmlBody = '';
  let plainBody = '';

  if (payload.body?.data) {
    const decoded = Buffer.from(payload.body.data, 'base64').toString('utf-8');
    if (payload.mimeType === 'text/html') {
      htmlBody = decoded;
    } else {
      plainBody = decoded;
    }
  } else if (payload.parts) {
    // Multi-part email - prefer text/plain, fall back to text/html
    for (const part of payload.parts) {
      if (part.mimeType === 'text/plain' && part.body?.data) {
        plainBody += Buffer.from(part.body.data, 'base64').toString('utf-8');
      } else if (part.mimeType === 'text/html' && part.body?.data) {
        htmlBody += Buffer.from(part.body.data, 'base64').toString('utf-8');
      }
      // Recursively check nested parts
      if (part.parts) {
        const nestedBody = getEmailBody(part);
        if (nestedBody) {
          body += nestedBody;
        }
      }
    }
  }

  // Prefer plain text, but if only HTML is available, strip tags
  if (plainBody) {
    return plainBody;
  } else if (htmlBody) {
    return stripHtml(htmlBody);
  } else if (body) {
    // Check if body looks like HTML
    if (body.includes('<html') || body.includes('<!DOCTYPE')) {
      return stripHtml(body);
    }
    return body;
  }

  return '';
}

/**
 * Extract transaction reference from email body
 * Example: "Transaction Ref: MSCB20251112SCP0120254C100452344164"
 * @param {string} emailBody
 * @returns {string|null}
 */
function extractTransactionRef(emailBody) {
  const refMatch = emailBody.match(/Transaction\s+Ref:\s*([A-Z0-9]+)/i);
  return refMatch ? refMatch[1].trim() : null;
}

/**
 * Extract amount in cents from email body
 * Example: "SGD 1.00" -> 100 cents
 * Example: "SGD 10.50" -> 1050 cents
 * @param {string} emailBody
 * @returns {number|null}
 */
function extractAmountCents(emailBody) {
  // Match patterns like "SGD 1.00", "SGD 10.50", etc.
  const amountMatch = emailBody.match(/SGD\s+([\d,]+\.\d{2})/i);
  if (!amountMatch) {
    return null;
  }

  const amountStr = amountMatch[1].replace(/,/g, ''); // Remove commas
  const amountDollars = parseFloat(amountStr);
  
  if (isNaN(amountDollars)) {
    return null;
  }

  // Convert to cents and round to avoid floating point issues
  return Math.round(amountDollars * 100);
}

/**
 * Extract date and time from email body
 * Example: "12 Nov 2025 13:43 SGT"
 * @param {string} emailBody
 * @returns {Date|null}
 */
function extractDateTime(emailBody) {
  // Match pattern: "DD Mon YYYY HH:MM SGT" - more flexible with whitespace
  const dateMatch = emailBody.match(/(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{4})\s+(\d{1,2}):(\d{2})\s*SGT/i);
  
  if (!dateMatch) {
    return null;
  }

  const [, day, month, year, hour, minute] = dateMatch;
  
  // Create date string in ISO format (SGT is UTC+8)
  const monthMap = {
    Jan: '01', Feb: '02', Mar: '03', Apr: '04', May: '05', Jun: '06',
    Jul: '07', Aug: '08', Sep: '09', Oct: '10', Nov: '11', Dec: '12'
  };
  
  const monthNum = monthMap[month];
  const dateStr = `${year}-${monthNum}-${day.padStart(2, '0')}T${hour.padStart(2, '0')}:${minute}:00+08:00`;
  
  return new Date(dateStr);
}

/**
 * Extract sender name from email body
 * Example: "From: NG ZHEN CONG MATTHEW"
 * @param {string} emailBody
 * @returns {string|null}
 */
function extractSender(emailBody) {
  const senderMatch = emailBody.match(/From:\s*([A-Z\s]+?)(?:\r|\n|To:)/i);
  if (!senderMatch) {
    return null;
  }
  
  // Clean up whitespace and newlines
  return senderMatch[1].trim().replace(/\s+/g, ' ');
}

/**
 * Extract receiver (account info) from email body
 * Example: "To: Your DBS/ POSB account ending 3440"
 * @param {string} emailBody
 * @returns {string|null}
 */
function extractReceiver(emailBody) {
  // Try multiple patterns
  // Pattern 1: "To: Your DBS/ POSB account ending 3440"
  let receiverMatch = emailBody.match(/To:\s*([^\n\r]+)/i);
  if (receiverMatch) {
    return receiverMatch[1].trim();
  }
  
  // Pattern 2: Just extract account ending number if pattern 1 fails
  receiverMatch = emailBody.match(/account\s+ending\s+(\d+)/i);
  if (receiverMatch) {
    return `DBS/POSB account ending ${receiverMatch[1]}`;
  }
  
  return null;
}

/**
 * Parse a DBS payment email and extract transaction details
 * @param {object} email - Gmail API email object
 * @returns {object|null} Transaction details or null if parsing fails
 */
export function parsePaymentEmail(email) {
  try {
    const emailBody = getEmailBody(email.payload);
    
    if (!emailBody) {
      console.warn(`⚠️  Email ${email.id} has no body`);
      return null;
    }

    // Debug: Log first 500 chars of email body
    console.log(`[DEBUG] Email ${email.id} body preview:`, emailBody.substring(0, 500));

    // Extract all required fields
    const transactionRef = extractTransactionRef(emailBody);
    const amountCents = extractAmountCents(emailBody);
    const dateTime = extractDateTime(emailBody);
    const sender = extractSender(emailBody);
    const receiver = extractReceiver(emailBody);

    // Validate all fields are present
    if (!transactionRef || !amountCents || !dateTime || !sender || !receiver) {
      console.warn(`⚠️  Email ${email.id} is missing required fields:`, {
        transactionRef: !!transactionRef,
        amountCents: !!amountCents,
        dateTime: !!dateTime,
        sender: !!sender,
        receiver: !!receiver,
      });
      return null;
    }

    const transaction = {
      emailId: email.id,
      transactionRef,
      amountCents,
      dateTime,
      sender,
      receiver,
    };

    console.log(`✅ Parsed transaction from email ${email.id}:`, {
      ...transaction,
      dateTime: dateTime.toISOString(),
    });

    return transaction;
  } catch (error) {
    console.error(`❌ Error parsing email ${email.id}:`, error.message);
    return null;
  }
}

/**
 * Parse multiple emails
 * @param {Array} emails - Array of Gmail API email objects
 * @returns {Array} Array of transaction details
 */
export function parsePaymentEmails(emails) {
  const transactions = [];
  
  for (const email of emails) {
    const transaction = parsePaymentEmail(email);
    if (transaction) {
      transactions.push(transaction);
    }
  }
  
  console.log(`📊 Successfully parsed ${transactions.length} out of ${emails.length} emails`);
  return transactions;
}