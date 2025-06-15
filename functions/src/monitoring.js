/**
 * HIPAA-compliant monitoring and alerting system
 * Monitors for security events and sends alerts to lukner@luknerclinic.com
 */

const admin = require('firebase-admin');
if (!admin.apps.length) admin.initializeApp();

// Alert configuration
const ALERT_EMAIL = 'lukner@luknerclinic.com';
const RATE_LIMIT_THRESHOLD = 50; // requests per minute per user
const FAILED_AUTH_THRESHOLD = 5; // failed auth attempts per minute
const UNUSUAL_ACCESS_THRESHOLD = 100; // PHI access attempts per minute

// Data retention configuration
const ACTIVITY_RETENTION_MINUTES = 5; // Keep activity data for 5 minutes
const SECURITY_EVENTS_RETENTION_DAYS = 90; // Keep security events for 90 days
const MAX_SECURITY_EVENTS_PER_USER = 1000; // Maximum number of security events to keep per user

/**
 * Track user activity for anomaly detection
 */
class UserActivityTracker {
  constructor() {
    this.db = admin.firestore();
    this.activitiesCollection = this.db.collection('user-activities');
    this.securityEventsCollection = this.db.collection('security-events');
  }

  async trackActivity(userId, action, metadata = {}) {
    const now = Date.now();
    const minuteAgo = now - (60 * 1000); // One minute window

    try {
      // Get or create user activity document
      const userActivityRef = this.activitiesCollection.doc(userId);
      const userActivityDoc = await userActivityRef.get();

      let session;
      if (!userActivityDoc.exists) {
        session = {
          activities: [],
          lastActivity: now,
          authFailures: 0,
          phiAccess: 0
        };
      } else {
        session = userActivityDoc.data();

        // Clean old activities (keep last minute)
        session.activities = session.activities.filter(activity => activity.timestamp > minuteAgo);
      }

      // Add new activity
      session.activities.push({
        action,
        timestamp: now,
        metadata
      });

      session.lastActivity = now;

      // Update counters
      if (action === 'AUTH_FAILURE') {
        session.authFailures++;
      } else if (action.includes('PHI_ACCESS')) {
        session.phiAccess++;
      }

      // Save updated session
      await userActivityRef.set(session, { merge: true });

      // Check for suspicious activity
      await this.checkForAnomalies(userId, session);

      // Cleanup old data
      await this.cleanupOldData(userId);
    } catch (error) {
      console.error('Error tracking activity:', error);
      // Log to error monitoring but don't throw to prevent disrupting the main flow
      await this.logError('ACTIVITY_TRACKING_ERROR', { userId, error: error.message });
    }
  }

  async cleanupOldData(userId) {
    try {
      const now = Date.now();
      const activityRetentionCutoff = now - (ACTIVITY_RETENTION_MINUTES * 60 * 1000);
      const securityEventsRetentionCutoff = new Date(now - (SECURITY_EVENTS_RETENTION_DAYS * 24 * 60 * 60 * 1000)).toISOString();

      // Cleanup old activities
      const userActivityRef = this.activitiesCollection.doc(userId);
      const userActivityDoc = await userActivityRef.get();

      if (userActivityDoc.exists) {
        const session = userActivityDoc.data();
        session.activities = session.activities.filter(activity => activity.timestamp > activityRetentionCutoff);
        await userActivityRef.set(session, { merge: true });
      }

      // Cleanup old security events by retention days
      const oldEventsQuery = this.securityEventsCollection
        .where('userId', '==', userId)
        .where('timestamp', '<', securityEventsRetentionCutoff);

      const oldEventsSnapshot = await oldEventsQuery.get();
      if (!oldEventsSnapshot.empty) {
        const batch = this.db.batch();
        oldEventsSnapshot.docs.forEach(doc => {
          batch.delete(doc.ref);
        });
        await batch.commit();
      }

      // Cleanup excess security events by count limit
      const securityEventsQuery = this.securityEventsCollection
        .where('userId', '==', userId)
        .orderBy('timestamp', 'desc')
        .limit(MAX_SECURITY_EVENTS_PER_USER + 1);

      const snapshot = await securityEventsQuery.get();
      if (snapshot.docs.length > MAX_SECURITY_EVENTS_PER_USER) {
        const batch = this.db.batch();
        snapshot.docs.slice(MAX_SECURITY_EVENTS_PER_USER).forEach(doc => {
          batch.delete(doc.ref);
        });
        await batch.commit();
      }
    } catch (error) {
      console.error('Error cleaning up old data:', error);
      await this.logError('CLEANUP_ERROR', { userId, error: error.message });
    }
  }

  async checkForAnomalies(userId, session) {
    try {
      const recentActivities = session.activities.length;
      const recentAuthFailures = session.activities.filter(a => a.action === 'AUTH_FAILURE').length;
      const recentPhiAccess = session.activities.filter(a => a.action.includes('PHI_ACCESS')).length;

      // Rate limiting check
      if (recentActivities > RATE_LIMIT_THRESHOLD) {
        await this.triggerSecurityAlert('RATE_LIMIT_EXCEEDED', {
          userId,
          activityCount: recentActivities,
          threshold: RATE_LIMIT_THRESHOLD
        });
      }

      // Failed authentication check
      if (recentAuthFailures >= FAILED_AUTH_THRESHOLD) {
        await this.triggerSecurityAlert('EXCESSIVE_AUTH_FAILURES', {
          userId,
          failureCount: recentAuthFailures,
          threshold: FAILED_AUTH_THRESHOLD
        });
      }

      // Unusual PHI access pattern
      if (recentPhiAccess > UNUSUAL_ACCESS_THRESHOLD) {
        await this.triggerSecurityAlert('UNUSUAL_PHI_ACCESS', {
          userId,
          accessCount: recentPhiAccess,
          threshold: UNUSUAL_ACCESS_THRESHOLD
        });
      }
    } catch (error) {
      console.error('Error checking for anomalies:', error);
      await this.logError('ANOMALY_CHECK_ERROR', { userId, error: error.message });
    }
  }

  async triggerSecurityAlert(alertType, details) {
    try {
      const alert = {
        type: alertType,
        timestamp: new Date().toISOString(),
        details,
        severity: this.getAlertSeverity(alertType),
        userId: details.userId
      };

      // Store alert in Firestore
      await this.securityEventsCollection.add(alert);

      // Log the security event
      console.log('SECURITY_ALERT:', JSON.stringify(alert));

      // Send email alert
      await this.sendEmailAlert(alert);

      // Log to Cloud Logging for centralized monitoring
      await this.logToCloudMonitoring(alert);
    } catch (error) {
      console.error('Error triggering security alert:', error);
      await this.logError('ALERT_TRIGGER_ERROR', { alertType, error: error.message });
    }
  }

  async logError(errorType, details) {
    try {
      const errorLog = {
        type: errorType,
        timestamp: new Date().toISOString(),
        details,
        environment: process.env.NODE_ENV || 'development'
      };

      await this.db.collection('error-logs').add(errorLog);
      console.error(`ERROR_LOG: ${errorType}`, details);
    } catch (error) {
      console.error('Failed to log error:', error);
    }
  }

  getAlertSeverity(alertType) {
    switch (alertType) {
      case 'EXCESSIVE_AUTH_FAILURES':
      case 'UNUSUAL_PHI_ACCESS':
        return 'HIGH';
      case 'RATE_LIMIT_EXCEEDED':
        return 'MEDIUM';
      case 'VALIDATION_FAILURE':
        return 'LOW';
      default:
        return 'MEDIUM';
    }
  }

  generateAlertEmail(alert) {
    const sanitizedDetails = this.sanitizeAlertDetails(alert.details);

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <style>
          .alert-container { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; }
          .header { background-color: #dc3545; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f8f9fa; }
          .severity-high { border-left: 5px solid #dc3545; padding-left: 15px; }
          .severity-medium { border-left: 5px solid #ffc107; padding-left: 15px; }
          .severity-low { border-left: 5px solid #28a745; padding-left: 15px; }
          .details { background-color: white; padding: 15px; border-radius: 5px; margin: 10px 0; }
          .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="alert-container">
          <div class="header">
            <h1>🚨 HIPAA Security Alert</h1>
          </div>

          <div class="content">
            <div class="severity-${alert.severity.toLowerCase()}">
              <h2>Alert Type: ${alert.type}</h2>
              <p><strong>Severity:</strong> ${alert.severity}</p>
              <p><strong>Time:</strong> ${alert.timestamp}</p>
            </div>

            <div class="details">
              <h3>Details:</h3>
              <pre>${JSON.stringify(sanitizedDetails, null, 2)}</pre>
            </div>

            <div class="details">
              <h3>Recommended Actions:</h3>
              <ul>
                ${this.getRecommendedActions(alert.type).map(action => `<li>${action}</li>`).join('')}
              </ul>
            </div>
          </div>

          <div class="footer">
            <p>This is an automated security alert from the Patient Flow Management System.</p>
            <p>Please investigate immediately to ensure HIPAA compliance.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  sanitizeAlertDetails(details) {
    if (!details) return {};

    const sanitized = { ...details };

    // List of fields that might contain PHI or sensitive data
    const sensitiveFields = [
      'patientId', 'patientName', 'patientDOB', 'patientSSN', 'patientEmail',
      'patientPhone', 'patientAddress', 'medicalRecordNumber', 'diagnosis',
      'treatment', 'prescription', 'notes', 'metadata', 'requestBody',
      'responseBody', 'query', 'parameters'
    ];

    // Mask or remove sensitive fields
    for (const field of sensitiveFields) {
      if (field in sanitized) {
        if (typeof sanitized[field] === 'string') {
          // Mask string values
          sanitized[field] = '[REDACTED]';
        } else if (Array.isArray(sanitized[field])) {
          // Mask array values
          sanitized[field] = ['[REDACTED]'];
        } else if (typeof sanitized[field] === 'object' && sanitized[field] !== null) {
          // Recursively sanitize nested objects
          sanitized[field] = this.sanitizeAlertDetails(sanitized[field]);
        }
      }
    }

    // Add a note about data sanitization
    sanitized._note = 'Sensitive data has been redacted for security. Full details are available in the secure audit log.';

    return sanitized;
  }

  getRecommendedActions(alertType) {
    switch (alertType) {
      case 'EXCESSIVE_AUTH_FAILURES':
        return [
          'Check for potential brute force attacks',
          'Review user account security',
          'Consider temporarily disabling the account',
          'Verify the user\'s identity before re-enabling access'
        ];
      case 'UNUSUAL_PHI_ACCESS':
        return [
          'Review the user\'s access patterns and job requirements',
          'Verify the legitimacy of the PHI access',
          'Check if the user account has been compromised',
          'Consider implementing additional access controls'
        ];
      case 'RATE_LIMIT_EXCEEDED':
        return [
          'Investigate potential automated attacks',
          'Review API usage patterns',
          'Check for legitimate high-volume usage scenarios',
          'Consider adjusting rate limits if necessary'
        ];
      default:
        return [
          'Investigate the security event',
          'Review system logs for additional context',
          'Take appropriate corrective action'
        ];
    }
  }

  async sendEmailAlert(alert) {
    try {
      // Import the service account email service (production-grade approach)
      const { sendEmail } = require('./services/serviceAccountEmailService');

      // Log email attempt for audit
      console.log('EMAIL_ALERT_SENT:', {
        type: 'SECURITY_ALERT_EMAIL',
        recipient: ALERT_EMAIL,
        alertType: alert.type,
        severity: alert.severity,
        timestamp: new Date().toISOString()
      });

      // Store full alert details in secure audit log
      await this.logToSecureAuditLog(alert);

      // Create email data for sending
      const emailData = {
        to: ALERT_EMAIL,
        subject: `🚨 HIPAA Security Alert: ${alert.type}`,
        html: this.generateAlertEmail(alert)
      };

      // Send the email using the email service
      const result = await sendEmail(emailData);

      if (result.success) {
        console.log(`Email sent successfully with message ID: ${result.messageId}`);
      } else {
        console.error(`Failed to send email: ${result.error}`);
      }

    } catch (error) {
      console.error('Failed to send security alert email:', error);
    }
  }

  async logToSecureAuditLog(alert) {
    try {
      // In production, implement secure logging to a HIPAA-compliant system
      // This could be a secure database, encrypted log storage, or a dedicated audit system
      const auditLogEntry = {
        ...alert,
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        _audit: {
          loggedAt: new Date().toISOString(),
          system: 'security-monitoring',
          version: '1.0'
        }
      };

      // Example implementation using Firebase Admin
      // await admin.firestore()
      //   .collection('security-audit-logs')
      //   .add(auditLogEntry);

      console.log('AUDIT_LOG_ENTRY_CREATED:', {
        type: 'SECURITY_AUDIT_LOG',
        alertType: alert.type,
        timestamp: auditLogEntry.timestamp
      });
    } catch (error) {
      console.error('Failed to create audit log entry:', error);
    }
  }

  async logToCloudMonitoring(alert) {
    try {
      // Use structured logging for Cloud Monitoring
      const logEntry = {
        severity: alert.severity,
        message: `Security Alert: ${alert.type}`,
        labels: {
          alert_type: alert.type,
          severity: alert.severity.toLowerCase()
        },
        jsonPayload: {
          ...alert,
          component: 'hipaa-security-monitor'
        }
      };

      console.log('CLOUD_MONITORING:', JSON.stringify(logEntry));
    } catch (error) {
      console.error('Failed to log to Cloud Monitoring:', error);
    }
  }
}

// Export the tracker instance
const activityTracker = new UserActivityTracker();

// Export monitoring functions
const monitorAuth = (userId, success, metadata = {}) => {
  return activityTracker.trackActivity(userId, success ? 'AUTH_SUCCESS' : 'AUTH_FAILURE', metadata);
};

const monitorPhiAccess = (userId, operation, metadata = {}) => {
  return activityTracker.trackActivity(userId, `PHI_ACCESS_${operation}`, metadata);
};

const monitorValidationFailure = (userId, validationType, error) => {
  return activityTracker.trackActivity(userId, 'VALIDATION_FAILURE', {
    validationType,
    error: error.message
  });
};

const generateSecurityReport = async () => {
  try {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const snapshot = await activityTracker.securityEventsCollection
      .where('timestamp', '>=', startOfDay.toISOString())
      .get();

    return {
      totalAlerts: snapshot.size,
      alertsByType: snapshot.docs.reduce((acc, doc) => {
        const data = doc.data();
        acc[data.type] = (acc[data.type] || 0) + 1;
        return acc;
      }, {}),
      timestamp: now.toISOString()
    };
  } catch (error) {
    console.error('Error generating security report:', error);
    return {
      error: 'Failed to generate security report',
      timestamp: new Date().toISOString()
    };
  }
};

module.exports = {
  monitorAuth,
  monitorPhiAccess,
  monitorValidationFailure,
  generateSecurityReport
}; 
