#!/usr/bin/env node

/**
 * get-gmail-refresh-token.js
 * -------------------------------------------------
 * Interactive helper script to generate a Gmail OAuth2 refresh token.
 *
 * Steps it performs:
 *   1. Opens (prints) a consent URL in your default browser.
 *   2. You log in and copy the returned code from Google.
 *   3. Paste the code back here; the script prints an access+refresh token.
 *
 * Prerequisites:
 *   • `npm i googleapis`
 *   • An OAuth 2.0 client (Desktop or Web) with Gmail API enabled.
 *
 * Note: keep the credentials below in a safer place for real usage; hard-coding
 * them here is fine only for quick local utility.
 */

import { google } from 'googleapis';
import readline from 'node:readline/promises';
// You can optionally install the `open` package to automatically launch the
// consent URL in the browser. We just print the URL to avoid extra deps.

// OAuth credentials are now read from environment variables to avoid hard-coding secrets
const { GMAIL_OAUTH_CLIENT_ID: CLIENT_ID, GMAIL_OAUTH_CLIENT_SECRET: CLIENT_SECRET } = process.env;

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('❌ Environment variables GMAIL_OAUTH_CLIENT_ID and/or GMAIL_OAUTH_CLIENT_SECRET are not set.');
  process.exit(1);
}

const REDIRECT_URI = 'http://localhost';

const oauth2 = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
const SCOPES = ['https://mail.google.com/'];

(async () => {
  const authUrl = oauth2.generateAuthUrl({ access_type: 'offline', scope: SCOPES });
  console.log('\n1. Copy-paste this URL into your browser to authorise:');
  console.log(authUrl, '\n');

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const code = await rl.question('2. Paste the authorization code here: ');
  rl.close();

  const { tokens } = await oauth2.getToken(code.trim());
  console.log('\nSuccess! Store these in Google Secret Manager:');
  console.log('GMAIL_OAUTH_CLIENT_ID     =', CLIENT_ID);
  console.log('GMAIL_OAUTH_CLIENT_SECRET =', CLIENT_SECRET);
  console.log('GMAIL_REFRESH_TOKEN       =', tokens.refresh_token);
})();