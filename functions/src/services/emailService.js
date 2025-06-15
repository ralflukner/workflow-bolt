/**
 * Email Service for sending emails through Google Workspace
 * This service uses Nodemailer with Gmail transport to send emails
 */

const nodemailer = require('nodemailer');
const { google } = require('googleapis');
const OAuth2 = google.auth.OAuth2;

// Configuration
const EMAIL_FROM = 'lukner@luknerclinic.com';

/**
 * Creates a Gmail transporter using OAuth2
 * @returns {Promise<nodemailer.Transporter>} The configured transporter
 */
async function createTransporter() {
  // Get credentials from environment variables
  const clientId = process.env.GMAIL_CLIENT_ID;
  const clientSecret = process.env.GMAIL_CLIENT_SECRET;
  const refreshToken = process.env.GMAIL_REFRESH_TOKEN;
  const email = EMAIL_FROM;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error('Missing Gmail OAuth2 credentials in environment variables');
  }

  // Create OAuth2 client
  const oauth2Client = new OAuth2(
    clientId,
    clientSecret,
    'https://developers.google.com/oauthplayground'
  );

  oauth2Client.setCredentials({
    refresh_token: refreshToken
  });

  try {
    // Get access token
    const accessToken = await new Promise((resolve, reject) => {
      oauth2Client.getAccessToken((err, token) => {
        if (err) {
          console.error('Failed to get access token', err);
          reject(err);
        }
        resolve(token);
      });
    });

    // Create transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user: email,
        clientId,
        clientSecret,
        refreshToken,
        accessToken
      }
    });

    return transporter;
  } catch (error) {
    console.error('Error creating Gmail transporter:', error);
    throw error;
  }
}

/**
 * Sends an email using Gmail
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email address
 * @param {string} options.subject - Email subject
 * @param {string} options.html - Email HTML content
 * @returns {Promise<Object>} The result of the email sending operation
 */
async function sendEmail({ to, subject, html }) {
  try {
    console.log(`Sending email to ${to} with subject: ${subject}`);
    
    const transporter = await createTransporter();
    
    const mailOptions = {
      from: EMAIL_FROM,
      to,
      subject,
      html
    };
    
    const result = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Failed to send email:', error);
    return { success: false, error: error.message };
  }
}

module.exports = {
  sendEmail
};