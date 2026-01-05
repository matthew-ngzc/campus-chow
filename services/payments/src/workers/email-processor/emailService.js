import { google } from 'googleapis';
import fs from 'fs/promises';
//import path from 'path';

/**
 * Gmail Service using OAuth2 for personal Gmail accounts
 * This approach works for regular Gmail accounts (not Workspace)
 */
class GmailServiceOAuth {
  constructor() {
    this.gmail = null;
    this.oauth2Client = null;
    this.isInitialized = false;
    this.tokenPath = process.env.GMAIL_TOKEN_PATH || './gmail-token.json';
  }

  /**
   * Initialize Gmail API with OAuth2
   */
  async initialize() {
    if (this.isInitialized) {
      return;
    }

    try {
      // Create OAuth2 client
      this.oauth2Client = new google.auth.OAuth2(
        process.env.GMAIL_CLIENT_ID,
        process.env.GMAIL_CLIENT_SECRET,
        process.env.GMAIL_REDIRECT_URI || 'http://localhost:3000/oauth2callback'
      );

      // Load saved token if exists
      try {
        const tokenData = await fs.readFile(this.tokenPath, 'utf-8');
        const tokens = JSON.parse(tokenData);
        this.oauth2Client.setCredentials(tokens);
        
        // Set up automatic token refresh
        this.oauth2Client.on('tokens', async (tokens) => {
          if (tokens.refresh_token) {
            // Save new refresh token
            await this.saveToken(tokens);
          }
        });
        
        console.log('✅ Gmail OAuth2 initialized with saved token');
      } catch (error) {
        console.log('⚠️  No saved token found. You need to authorize first.');
        console.log('👉 Run the authorization script: node src/workers/email-processor/authorizeGmail.js');
        throw new Error('Gmail authorization required. Run authorization script first.', error);
      }

      this.gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });
      this.isInitialized = true;
    } catch (error) {
      console.error('❌ Failed to initialize Gmail API:', error.message);
      throw error;
    }
  }

  /**
   * Save token to file
   */
  async saveToken(tokens) {
    try {
      await fs.writeFile(this.tokenPath, JSON.stringify(tokens, null, 2));
      console.log('✅ Token saved to', this.tokenPath);
    } catch (error) {
      console.error('❌ Error saving token:', error.message);
    }
  }

  /**
   * Generate authorization URL for first-time setup
   * @returns {string} Authorization URL
   */
  getAuthUrl() {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GMAIL_CLIENT_ID,
      process.env.GMAIL_CLIENT_SECRET,
      process.env.GMAIL_REDIRECT_URI || 'http://localhost:3000/oauth2callback'
    );

    const authUrl = this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: [
        'https://www.googleapis.com/auth/gmail.readonly',
        'https://www.googleapis.com/auth/gmail.modify',
      ],
      prompt: 'consent', // Force consent screen to get refresh token
    });

    return authUrl;
  }

  /**
   * Exchange authorization code for tokens
   * @param {string} code - Authorization code from OAuth callback
   */
  async getTokenFromCode(code) {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GMAIL_CLIENT_ID,
      process.env.GMAIL_CLIENT_SECRET,
      process.env.GMAIL_REDIRECT_URI || 'http://localhost:3000/oauth2callback'
    );

    const { tokens } = await this.oauth2Client.getToken(code);
    await this.saveToken(tokens);
    console.log('✅ Authorization successful! Token saved.');
    return tokens;
  }

  /**
   * Fetch unread emails from digibank alerts
   * @returns {Promise<Array>} Array of email objects
   */
  async fetchUnreadPaymentEmails() {
    await this.initialize();

    try {
      // Search for unread emails from digibank with subject containing "received a transfer"
      const response = await this.gmail.users.messages.list({
        userId: 'me',
        q: 'from:ibanking.alert@dbs.com subject:"received a transfer" is:unread',
        maxResults: 50,
      });

      const messages = response.data.messages || [];
      console.log(`📧 Found ${messages.length} unread payment emails`);

      if (messages.length === 0) {
        return [];
      }

      // Fetch full email details for each message
      const emailPromises = messages.map((message) =>
        this.gmail.users.messages.get({
          userId: 'me',
          id: message.id,
          format: 'full',
        })
      );

      const emails = await Promise.all(emailPromises);
      return emails.map((email) => email.data);
    } catch (error) {
      console.error('❌ Error fetching emails:', error.message);
      
      // Check if token expired or invalid
      if (error.message.includes('invalid_grant') || error.message.includes('Token has been expired')) {
        console.error('🔑 Token expired or invalid. Please re-authorize:');
        console.error('👉 Run: node src/workers/email-processor/authorizeGmail.js');
      }
      
      throw error;
    }
  }

  /**
   * Mark an email as read
   * @param {string} messageId - The email message ID
   */
  async markAsRead(messageId) {
    await this.initialize();

    try {
      await this.gmail.users.messages.modify({
        userId: 'me',
        id: messageId,
        requestBody: {
          removeLabelIds: ['UNREAD'],
        },
      });
      console.log(`✅ Marked email ${messageId} as read`);
    } catch (error) {
      console.error(`❌ Error marking email ${messageId} as read:`, error.message);
    }
  }

  /**
   * List all labels (useful for debugging)
   * @returns {Promise<Array>} Array of labels
   */
  async listLabels() {
    await this.initialize();

    try {
      const response = await this.gmail.users.labels.list({
        userId: 'me',
      });
      return response.data.labels || [];
    } catch (error) {
      console.error('❌ Error listing labels:', error.message);
      throw error;
    }
  }
}

// Export singleton instance
export const gmailService = new GmailServiceOAuth();