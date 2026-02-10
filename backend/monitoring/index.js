// Monitoring Service - Main entry point
import MetricsCollector from './metricsCollector.js';
import AlertManager from './alertManager.js';
import emailService from './emailService.js';

class MonitoringService {
    constructor(io) {
        this.metricsCollector = new MetricsCollector(io);
        this.alertManager = new AlertManager();
        this.monitoringInterval = null;
        this.isRunning = false;
    }

    // Start monitoring
    async start() {
        if (this.isRunning) {
            console.log('⚠️ Monitoring already running');
            return;
        }

        // Test email connection
        const emailReady = await emailService.testConnection();
        if (!emailReady) {
            console.warn('⚠️ Email service not ready, but monitoring will continue');
        }

        console.log('🚀 Starting Twikit Monitoring System...');
        console.log(`📧 Alerts will be sent to: ${process.env.ADMIN_EMAIL}`);
        console.log(`⏰ Cooldown period: ${process.env.ALERT_COOLDOWN_MINUTES} minutes`);

        this.isRunning = true;

        // Run initial check
        this.runCheck();

        // Schedule periodic checks every 60 seconds
        this.monitoringInterval = setInterval(() => {
            this.runCheck();
        }, 60 * 1000); // 60 seconds

        console.log('✅ Monitoring system started (checking every 60 seconds)');
    }

    // Run a single monitoring check
    async runCheck() {
        try {
            // Collect all metrics (now async for Redis ping)
            const metrics = await this.metricsCollector.getAllMetrics();

            // Log current status
            this.logMetrics(metrics);

            // Check thresholds and send alerts if needed
            this.alertManager.checkAllMetrics(metrics);
        } catch (error) {
            console.error('❌ Error during monitoring check:', error);
        }
    }

    // Log metrics to console (for debugging)
    logMetrics(metrics) {
        const timestamp = new Date().toISOString();
        console.log(`\n📊 [${timestamp}] System Metrics:`);
        console.log(`  MongoDB Pool: ${metrics.mongoPool.current}/${metrics.mongoPool.max} (${metrics.mongoPool.percentage.toFixed(1)}%)`);
        console.log(`  Socket.io: ${metrics.socketConnections.current}/${metrics.socketConnections.max} (${metrics.socketConnections.percentage.toFixed(1)}%)`);
        console.log(`  Memory: ${metrics.memory.current}MB/${metrics.memory.max}MB (${metrics.memory.percentage.toFixed(1)}%)`);
        console.log(`  API p95: ${metrics.apiPerformance.p95}ms (avg: ${metrics.apiPerformance.avg}ms, count: ${metrics.apiPerformance.count})`);
        console.log(`  Error Rate: ${metrics.errorRate.rate}% (${metrics.errorRate.errors}/${metrics.errorRate.requests})`);
        console.log(`  Redis: ${metrics.redisHealth.connected ? '✅ Connected' : '❌ Disconnected'} (${metrics.redisHealth.latency}ms - ${metrics.redisHealth.status})`);
    }

    // Stop monitoring
    stop() {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
            this.isRunning = false;
            console.log('🛑 Monitoring system stopped');
        }
    }

    // Get current metrics (for API endpoint)
    async getCurrentMetrics() {
        return await this.metricsCollector.getAllMetrics();
    }

    // Get metrics collector (for middleware)
    getMetricsCollector() {
        return this.metricsCollector;
    }
}

export default MonitoringService;
