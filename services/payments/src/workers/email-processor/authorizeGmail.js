#!/usr/bin/env node

/**
 * Gmail OAuth2 Authorization Script
 * 
 * This script helps you authorize your application to access Gmail
 * for personal Gmail accounts (not Google Workspace).
 * 
 * Usage:
 *   node src/workers/email-processor/authorizeGmail.js
 * 
 * This only needs to be run ONCE to get the initial token.
 * The token will be saved and automatically refreshed.
 */

import 'dotenv/config';

import { gmailService } from './emailService.js';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function authorize() {
  console.log('\n🔐 Gmail Authorization Setup\n');
  console.log('This script will help you authorize your application to access Gmail.');
  console.log('You only need to run this ONCE.\n');

  // Check if env vars are set
  if (!process.env.GMAIL_CLIENT_ID || !process.env.GMAIL_CLIENT_SECRET) {
    console.error('❌ Error: Missing required environment variables:');
    console.error('   - GMAIL_CLIENT_ID');
    console.error('   - GMAIL_CLIENT_SECRET');
    console.error('\nPlease add these to your .env file first.');
    console.error('See GMAIL_SETUP_OAUTH2.md for instructions.\n');
    process.exit(1);
  }

  try {
    // Generate auth URL
    const authUrl = gmailService.getAuthUrl();

    console.log('📋 Step 1: Visit this URL to authorize the application:\n');
    console.log(authUrl);
    console.log('\n');

    console.log('📋 Step 2: After authorizing, you will be redirected to a URL.');
    console.log('Copy the ENTIRE redirect URL (including the code parameter).\n');

    const redirectUrl = await question('Paste the redirect URL here: ');

    // Extract code from URL
    let code;
    try {
      const url = new URL(redirectUrl);
      code = url.searchParams.get('code');
      if (!code) {
        throw new Error('No code parameter found in URL');
      }
    } catch (error) {
      // Maybe they just pasted the code directly
      code = redirectUrl.trim();
      console.log(error);
    }

    console.log('\n⏳ Exchanging code for token...');

    // Exchange code for token
    await gmailService.getTokenFromCode(code);

    console.log('\n✅ Authorization successful!');
    console.log('✅ Token saved to gmail-token.json');
    console.log('\n🎉 You can now start the email worker!');
    console.log('The token will be automatically refreshed when needed.\n');

    // Test the connection
    console.log('🧪 Testing connection...');
    await gmailService.initialize();
    const labels = await gmailService.listLabels();
    console.log(`✅ Connected! Found ${labels.length} labels.`);
    console.log('\n🚀 Setup complete! You can now start your server.\n');

  } catch (error) {
    console.error('\n❌ Error during authorization:', error.message);
    console.error('\nPlease try again or check GMAIL_SETUP_OAUTH2.md for help.\n');
    process.exit(1);
  } finally {
    rl.close();
  }
}

authorize();
