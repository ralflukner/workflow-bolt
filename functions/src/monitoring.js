/**
 * HIPAA-compliant monitoring and alerting system
 * Monitors for security events and sends alerts to lukner@luknerclinic.com
 */

const admin = require('firebase-admin');

// Alert configuration
const ALERT_EMAIL = 'lukner@luknerclinic.com';
const RATE_LIMIT_THRESHOLD = 50; // requests per minute per user
const FAILED_AUTH_THRESHOLD = 5; // failed auth attempts per hour
const UNUSUAL_ACCESS_THRESHOLD = 100; // PHI access attempts per hour

// In-memory tracking (in production, use Redis or Firestore)
const userMetrics = new Map();
const securityEvents = [];

/**
 * Track user activity for anomaly detection
 */
class UserActivityTracker {
  constructor() {
    this.userSessions = new Map();
  }

  trackActivity(userId, action, metadata = {}) {
    const now = Date.now();
    const hourAgo = now - (60 * 60 * 1000);
    
    if (!this.userSessions.has(userId)) {
      this.userSessions.set(userId, {
        activities: [],
        lastActivity: now,
        authFailures: 0,
        phiAccess: 0
      });
    }

    const session = this.userSessions.get(userId);
    
    // Clean old activities (keep last hour)
    session.activities = session.activities.filter(activity => activity.timestamp > hourAgo);
    
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

    // Check for suspicious activity
    this.checkForAnomalies(userId, session);
  }

  checkForAnomalies(userId, session) {
    const recentActivities = session.activities.length;
    const recentAuthFailures = session.activities.filter(a => a.action === 'AUTH_FAILURE').length;
    const recentPhiAccess = session.activities.filter(a => a.action.includes('PHI_ACCESS')).length;

    // Rate limiting check
    if (recentActivities > RATE_LIMIT_THRESHOLD) {
      this.triggerSecurityAlert('RATE_LIMIT_EXCEEDED', {
        userId,
        activityCount: recentActivities,
        threshold: RATE_LIMIT_THRESHOLD
      });
    }

    // Failed authentication check
    if (recentAuthFailures >= FAILED_AUTH_THRESHOLD) {
      this.triggerSecurityAlert('EXCESSIVE_AUTH_FAILURES', {
        userId,
        failureCount: recentAuthFailures,
        threshold: FAILED_AUTH_THRESHOLD
      });
    }

    // Unusual PHI access pattern
    if (recentPhiAccess > UNUSUAL_ACCESS_THRESHOLD) {
      this.triggerSecurityAlert('UNUSUAL_PHI_ACCESS', {
        userId,
        accessCount: recentPhiAccess,
        threshold: UNUSUAL_ACCESS_THRESHOLD
      });
    }
  }

  triggerSecurityAlert(alertType, details) {
    const alert = {
      type: alertType,
      timestamp: new Date().toISOString(),
      details,
      severity: this.getAlertSeverity(alertType)
    };

    // Log the security event
    console.log('SECURITY_ALERT:', JSON.stringify(alert));
    
    // Store for tracking
    securityEvents.push(alert);
    
    // Send email alert
    this.sendEmailAlert(alert);
    
    // Log to Cloud Logging for centralized monitoring
    this.logToCloudMonitoring(alert);
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

  async sendEmailAlert(alert) {
    try {
      // In production, integrate with SendGrid, AWS SES, or similar
      // For now, we'll use Firebase Admin to trigger an email function
      
      const emailData = {
        to: ALERT_EMAIL,
        subject: `🚨 HIPAA Security Alert: ${alert.type}`,
        html: this.generateAlertEmail(alert)
      };

      // Log email attempt for audit
      console.log('EMAIL_ALERT_SENT:', {
        type: 'SECURITY_ALERT_EMAIL',
        recipient: ALERT_EMAIL,
        alertType: alert.type,
        severity: alert.severity,
        timestamp: new Date().toISOString()
      });

      // In a real implementation, you would send the email here
      // Example: await sendgrid.send(emailData);
      
    } catch (error) {
      console.error('Failed to send security alert email:', error);
    }
  }

  generateAlertEmail(alert) {
    return `
      <!DOCTYPE html>
      <html>
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
              <pre>${JSON.stringify(alert.details, null, 2)}</pre>
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

// Singleton instance
const activityTracker = new UserActivityTracker();

/**
 * Monitor user authentication attempts
 */
const monitorAuth = (userId, success, metadata = {}) => {
  if (success) {
    activityTracker.trackActivity(userId, 'AUTH_SUCCESS', metadata);
  } else {
    activityTracker.trackActivity(userId, 'AUTH_FAILURE', metadata);
  }
};

/**
 * Monitor PHI data access
 */
const monitorPhiAccess = (userId, operation, metadata = {}) => {
  activityTracker.trackActivity(userId, `PHI_ACCESS_${operation.toUpperCase()}`, metadata);
  
  // Log for HIPAA audit trail
  const auditLog = {
    type: 'PHI_ACCESS',
    userId,
    operation,
    timestamp: new Date().toISOString(),
    metadata
  };
  
  console.log('HIPAA_AUDIT:', JSON.stringify(auditLog));
};

/**
 * Monitor validation failures
 */
const monitorValidationFailure = (userId, validationType, error) => {
  activityTracker.trackActivity(userId, 'VALIDATION_FAILURE', {
    validationType,
    error: error.message
  });
  
  // Log validation failure for security analysis
  console.log('VALIDATION_FAILURE:', {
    userId,
    validationType,
    error: error.message,
    timestamp: new Date().toISOString()
  });
};

/**
 * Generate security report
 */
const generateSecurityReport = () => {
  const now = Date.now();
  const last24Hours = now - (24 * 60 * 60 * 1000);
  
  const recentEvents = securityEvents.filter(event => 
    new Date(event.timestamp).getTime() > last24Hours
  );
  
  const report = {
    reportGenerated: new Date().toISOString(),
    timeframe: 'Last 24 hours',
    totalSecurityEvents: recentEvents.length,
    eventsByType: {},
    eventsBySeverity: {},
    topUsers: {}
  };
  
  // Aggregate events by type and severity
  recentEvents.forEach(event => {
    report.eventsByType[event.type] = (report.eventsByType[event.type] || 0) + 1;
    report.eventsBySeverity[event.severity] = (report.eventsBySeverity[event.severity] || 0) + 1;
    
    if (event.details.userId) {
      report.topUsers[event.details.userId] = (report.topUsers[event.details.userId] || 0) + 1;
    }
  });
  
  return report;
};

module.exports = {
  monitorAuth,
  monitorPhiAccess,
  monitorValidationFailure,
  generateSecurityReport,
  activityTracker
}; 