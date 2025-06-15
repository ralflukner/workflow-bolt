/**
 * Email Service for sending emails through Google Workspace using Service Account with Domain-Wide Delegation
 * This is a production-grade approach recommended for HIPAA environments
 */

const nodemailer = require('nodemailer');
const { google } = require('googleapis');
const { JWT } = require('google-auth-library');

// Configuration
const EMAIL_FROM = 'lukner@luknerclinic.com';
const GMAIL_SCOPES = ['https://mail.google.com/'];

/**
 * Creates a Gmail transporter using Service Account with Domain-Wide Delegation
 * @returns {Promise<nodemailer.Transporter>} The configured transporter
 */
async function createTransporter() {
  try {
    // Get service account credentials from environment variables
    const serviceAccountEmail = process.env.GMAIL_SERVICE_ACCOUNT_EMAIL;
    const serviceAccountPrivateKey = process.env.GMAIL_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, '\n');
    const userToImpersonate = EMAIL_FROM;

    if (!serviceAccountEmail || !serviceAccountPrivateKey) {
      throw new Error('Missing service account credentials in environment variables');
    }

    // Create JWT client for authentication
    const jwtClient = new JWT({
      email: serviceAccountEmail,
      key: serviceAccountPrivateKey,
      scopes: GMAIL_SCOPES,
      subject: userToImpersonate // This enables domain-wide delegation
    });

    // Authorize the client
    await jwtClient.authorize();

    // Create Gmail API client
    const gmail = google.gmail({
      version: 'v1',
      auth: jwtClient
    });

    // Create transporter using Gmail API
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user: userToImpersonate,
        serviceClient: jwtClient.gtoken.access_token,
        accessToken: jwtClient.credentials.access_token
      }
    });

    return transporter;
  } catch (error) {
    console.error('Error creating Gmail transporter with service account:', error);
    throw error;
  }
}

/**
 * Sends an email using Gmail with Service Account authentication
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email address
 * @param {string} options.subject - Email subject
 * @param {string} options.html - Email HTML content
 * @returns {Promise<Object>} The result of the email sending operation
 */
async function sendEmail({ to, subject, html }) {
  try {
    console.log(`Sending email to ${to} with subject: ${subject} using service account`);
    
    const transporter = await createTransporter();
    
    const mailOptions = {
      from: EMAIL_FROM,
      to,
      subject,
      html
    };
    
    const result = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully with service account:', result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Failed to send email with service account:', error);
    return { success: false, error: error.message };
  }
}

module.exports = {
  sendEmail
};