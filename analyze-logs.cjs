#!/usr/bin/env node


/**
 * Log Analysis Script for Tebra API Failures
 * Analyzes Cloud Run logs to identify patterns and generate insights
 * 
 * Usage:
 * node analyze-logs.js [--days=7] [--service=tebra-php-api]
 */

const { spawn } = require('child_process');
const fs = require('fs');

class LogAnalyzer {
  constructor(options = {}) {
    this.days = options.days || 7;
    this.service = options.service || 'tebra-php-api';
    this.project = options.project || 'luknerlumina-firebase';
    this.region = options.region || 'us-central1';
  }

  async analyzeLogs() {
    console.log(`🔍 Analyzing logs for ${this.service} (last ${this.days} days)...\n`);

    try {
      // Fetch logs from Cloud Logging
      const logs = await this.fetchLogs();
      
      // Analyze different aspects
      const analysis = {
        summary: this.generateSummary(logs),
        errorPatterns: this.analyzeErrorPatterns(logs),
        performanceMetrics: this.analyzePerformance(logs),
        tebraFaults: this.analyzeTebraFaults(logs),
        recommendations: []
      };

      // Generate recommendations based on analysis
      analysis.recommendations = this.generateRecommendations(analysis);

      // Output results
      this.outputAnalysis(analysis);
      
      // Save detailed report
      this.saveReport(analysis, logs);

    } catch (error) {
      console.error('❌ Log analysis failed:', error.message);
      process.exit(1);
    }
  }

  async fetchLogs() {
    console.log('📥 Fetching logs from Cloud Logging...');
    
    const startTime = new Date();
    startTime.setDate(startTime.getDate() - this.days);
    const startTimeISO = startTime.toISOString();

    // Build gcloud logging query
    const query = `
      resource.type="cloud_run_revision"
      resource.labels.service_name="${this.service}"
      timestamp>="${startTimeISO}"
    `.trim();

    try {
      // Use spawn with argument array to prevent shell injection
      const logs = await new Promise((resolve, reject) => {
        const gcloudProcess = spawn('gcloud', [
          'logging',
          'read',
          query,
          `--project=${this.project}`,
          '--format=json',
          '--limit=1000'
        ]);

        let stdout = '';
        let stderr = '';

        // Handle stdout data streaming
        gcloudProcess.stdout.on('data', (chunk) => {
          stdout += chunk.toString();
          // Optional: Log progress for large datasets
          process.stdout.write('.');
        });

        // Handle stderr data streaming
        gcloudProcess.stderr.on('data', (chunk) => {
          stderr += chunk.toString();
        });

        // Handle process completion
        gcloudProcess.on('close', (code) => {
          if (code !== 0) {
            reject(new Error(`gcloud command failed with status ${code}: ${stderr}`));
            return;
          }

          try {
            const parsedLogs = JSON.parse(stdout || '[]');
            resolve(parsedLogs);
          } catch (parseError) {
            reject(new Error(`Failed to parse JSON output: ${parseError.message}`));
          }
        });

        // Handle process errors
        gcloudProcess.on('error', (error) => {
          reject(new Error(`Failed to start gcloud process: ${error.message}`));
        });

        // Optional: Set timeout for long-running commands
        const timeout = setTimeout(() => {
          gcloudProcess.kill('SIGTERM');
          reject(new Error('gcloud command timed out after 5 minutes'));
        }, 5 * 60 * 1000); // 5 minutes

        gcloudProcess.on('close', () => {
          clearTimeout(timeout);
        });
      });

      console.log(`\n📊 Retrieved ${logs.length} log entries\n`);
      return logs;
    } catch (error) {
      console.error('❌ Failed to fetch Cloud Logging data via gcloud CLI.');
      console.error(`   ${error.message}`);
      throw error;
    }
  }

  generateSampleLogs() {
    // Generate sample logs for demonstration
    return [
      {
        timestamp: new Date().toISOString(),
        severity: 'ERROR',
        textPayload: 'InternalServiceFault: Tebra backend error',
        labels: { action: 'getAppointments' }
      },
      {
        timestamp: new Date().toISOString(),
        severity: 'INFO',
        textPayload: 'Request completed successfully',
        labels: { action: 'getProviders', duration: '1200ms' }
      }
    ];
  }

  generateSummary(logs) {
    const total = logs.length;
    const errors = logs.filter(log => log.severity === 'ERROR').length;
    const warnings = logs.filter(log => log.severity === 'WARNING').length;
    const info = logs.filter(log => log.severity === 'INFO').length;

    return {
      totalLogs: total,
      errorCount: errors,
      warningCount: warnings,
      infoCount: info,
      errorRate: total > 0 ? ((errors / total) * 100).toFixed(2) : 0
    };
  }

  analyzeErrorPatterns(logs) {
    const errors = logs.filter(log => log.severity === 'ERROR');
    const patterns = {};

    errors.forEach(log => {
      const message = log.textPayload || log.jsonPayload?.message || 'Unknown error';
      
      // Categorize errors
      let category = 'OTHER';
      if (message.includes('InternalServiceFault')) category = 'TEBRA_FAULT';
      else if (message.includes('timeout')) category = 'TIMEOUT';
      else if (message.includes('401') || message.includes('403')) category = 'AUTH_ERROR';
      else if (message.includes('429')) category = 'RATE_LIMIT';
      else if (message.includes('502') || message.includes('503')) category = 'SERVICE_UNAVAILABLE';

      if (!patterns[category]) {
        patterns[category] = { count: 0, examples: [] };
      }
      
      patterns[category].count++;
      if (patterns[category].examples.length < 3) {
        patterns[category].examples.push({
          timestamp: log.timestamp,
          message: message.substring(0, 100) + (message.length > 100 ? '...' : '')
        });
      }
    });

    return patterns;
  }

  analyzePerformance(logs) {
    const performanceLogs = logs.filter(log => {
      const message = log.textPayload || log.jsonPayload?.message || '';
      return message.includes('duration') || message.includes('ms') || message.includes('completed');
    });

    // Extract duration information (simplified)
    const durations = [];
    performanceLogs.forEach(log => {
      const message = log.textPayload || log.jsonPayload?.message || '';
      const match = message.match(/(\d+)ms/);
      if (match) {
        durations.push(parseInt(match[1]));
      }
    });

    if (durations.length === 0) {
      return { message: 'No performance data available' };
    }

    durations.sort((a, b) => a - b);
    const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
    const median = durations[Math.floor(durations.length / 2)];
    const p95 = durations[Math.floor(durations.length * 0.95)];

    return {
      sampleCount: durations.length,
      averageMs: Math.round(avg),
      medianMs: median,
      p95Ms: p95,
      minMs: durations[0],
      maxMs: durations[durations.length - 1]
    };
  }

  analyzeTebraFaults(logs) {
    const tebraFaults = logs.filter(log => {
      const message = log.textPayload || log.jsonPayload?.message || '';
      return message.includes('InternalServiceFault');
    });

    const faultsByAction = {};
    const faultsByTime = {};

    tebraFaults.forEach(log => {
      // Group by action
      const action = log.labels?.action || 'unknown';
      faultsByAction[action] = (faultsByAction[action] || 0) + 1;

      // Group by hour
      const hour = new Date(log.timestamp).getHours();
      faultsByTime[hour] = (faultsByTime[hour] || 0) + 1;
    });

    return {
      totalFaults: tebraFaults.length,
      faultsByAction,
      faultsByTime,
      recentFaults: tebraFaults.slice(0, 5).map(log => ({
        timestamp: log.timestamp,
        action: log.labels?.action || 'unknown',
        message: (log.textPayload || '').substring(0, 100)
      }))
    };
  }

  generateRecommendations(analysis) {
    const recommendations = [];

    // Error rate recommendations
    if (parseFloat(analysis.summary.errorRate) > 10) {
      recommendations.push({
        priority: 'HIGH',
        category: 'ERROR_RATE',
        message: `Error rate is ${analysis.summary.errorRate}% - implement circuit breaker pattern`
      });
    }

    // Tebra fault recommendations
    if (analysis.tebraFaults.totalFaults > 0) {
      recommendations.push({
        priority: 'HIGH',
        category: 'TEBRA_FAULTS',
        message: `${analysis.tebraFaults.totalFaults} Tebra InternalServiceFaults detected - implement retry logic with exponential backoff`
      });
    }

    // Performance recommendations
    if (analysis.performanceMetrics.p95Ms > 5000) {
      recommendations.push({
        priority: 'MEDIUM',
        category: 'PERFORMANCE',
        message: `95th percentile response time is ${analysis.performanceMetrics.p95Ms}ms - consider caching or optimization`
      });
    }

    // Rate limiting recommendations
    if (analysis.errorPatterns.RATE_LIMIT?.count > 0) {
      recommendations.push({
        priority: 'MEDIUM',
        category: 'RATE_LIMITING',
        message: `${analysis.errorPatterns.RATE_LIMIT.count} rate limit errors - implement client-side throttling`
      });
    }

    return recommendations;
  }

  outputAnalysis(analysis) {
    console.log('📊 ANALYSIS RESULTS');
    console.log('==================\n');

    // Summary
    console.log('📈 SUMMARY:');
    console.log(`   Total logs: ${analysis.summary.totalLogs}`);
    console.log(`   Errors: ${analysis.summary.errorCount} (${analysis.summary.errorRate}%)`);
    console.log(`   Warnings: ${analysis.summary.warningCount}`);
    console.log(`   Info: ${analysis.summary.infoCount}\n`);

    // Error patterns
    console.log('🚨 ERROR PATTERNS:');
    Object.entries(analysis.errorPatterns).forEach(([category, data]) => {
      console.log(`   ${category}: ${data.count} occurrences`);
      data.examples.forEach(example => {
        console.log(`     - ${example.timestamp}: ${example.message}`);
      });
    });
    console.log();

    // Performance
    if (analysis.performanceMetrics.sampleCount) {
      console.log('⚡ PERFORMANCE METRICS:');
      console.log(`   Average: ${analysis.performanceMetrics.averageMs}ms`);
      console.log(`   Median: ${analysis.performanceMetrics.medianMs}ms`);
      console.log(`   95th percentile: ${analysis.performanceMetrics.p95Ms}ms`);
      console.log(`   Range: ${analysis.performanceMetrics.minMs}ms - ${analysis.performanceMetrics.maxMs}ms\n`);
    }

    // Tebra faults
    if (analysis.tebraFaults.totalFaults > 0) {
      console.log('🔥 TEBRA FAULTS:');
      console.log(`   Total faults: ${analysis.tebraFaults.totalFaults}`);
      console.log('   By action:', JSON.stringify(analysis.tebraFaults.faultsByAction, null, 2));
      console.log('   By hour:', JSON.stringify(analysis.tebraFaults.faultsByTime, null, 2));
      console.log();
    }

    // Recommendations
    console.log('💡 RECOMMENDATIONS:');
    analysis.recommendations.forEach((rec, index) => {
      console.log(`   ${index + 1}. [${rec.priority}] ${rec.category}: ${rec.message}`);
    });
    console.log();
  }

  saveReport(analysis, logs) {
    const report = {
      generatedAt: new Date().toISOString(),
      analysisConfig: {
        days: this.days,
        service: this.service,
        project: this.project
      },
      analysis,
      rawLogCount: logs.length
    };

    const filename = `tebra-analysis-${new Date().toISOString().split('T')[0]}.json`;
    fs.writeFileSync(filename, JSON.stringify(report, null, 2));
    console.log(`💾 Detailed report saved to: ${filename}`);
  }
}

// CLI handling
if (require.main === module) {
  const args = process.argv.slice(2);
  const options = {};

  args.forEach(arg => {
    if (arg.startsWith('--days=')) {
      options.days = parseInt(arg.split('=')[1]);
    } else if (arg.startsWith('--service=')) {
      options.service = arg.split('=')[1];
    }
  });

  // Make the CLI entrypoint async and await the analysis
  (async () => {
    try {
      const analyzer = new LogAnalyzer(options);
      await analyzer.analyzeLogs();
    } catch (error) {
      console.error('❌ Analysis failed:', error.message);
      process.exit(1);
    }
  })();
}

module.exports = { LogAnalyzer }; 