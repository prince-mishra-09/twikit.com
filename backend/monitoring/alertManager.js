// Alert Manager - Handles threshold logic and cooldown
import emailService from './emailService.js';

class AlertManager {
    constructor() {
        this.alertState = {
            mongoPool: { alerted: false, lastAlertTime: 0, consecutiveBreaches: 0 },
            socketConnections: { alerted: false, lastAlertTime: 0, consecutiveBreaches: 0 },
            memory: { alerted: false, lastAlertTime: 0, consecutiveBreaches: 0 },
            apiPerformance: { alerted: false, lastAlertTime: 0, consecutiveBreaches: 0 },
            errorRate: { alerted: false, lastAlertTime: 0, consecutiveBreaches: 0 },
            redisHealth: { alerted: false, lastAlertTime: 0, consecutiveBreaches: 0 }
        };

        this.cooldownMs = (parseInt(process.env.ALERT_COOLDOWN_MINUTES) || 30) * 60 * 1000;
    }

    // Check if cooldown period has passed
    canAlert(metricName) {
        const state = this.alertState[metricName];
        const now = Date.now();

        if (state.alerted && (now - state.lastAlertTime) < this.cooldownMs) {
            return false; // Still in cooldown
        }

        return true;
    }

    // Check MongoDB Pool
    checkMongoPool(metrics) {
        const threshold = 80; // 80%
        const metricName = 'mongoPool';

        if (metrics.percentage >= threshold) {
            if (this.canAlert(metricName)) {
                this.sendAlert(metricName, {
                    name: 'MongoDB Connection Pool',
                    current: `${metrics.current} connections`,
                    threshold: `${threshold}% (${metrics.max * 0.8} connections)`,
                    percentage: `${metrics.percentage.toFixed(1)}%`,
                    actions: [
                        'Increase MongoDB pool size in mongoose config',
                        'Check for connection leaks in code',
                        'Add Redis caching to reduce DB queries',
                        'Consider adding read replicas'
                    ]
                });

                this.alertState[metricName].alerted = true;
                this.alertState[metricName].lastAlertTime = Date.now();
            }
        } else if (metrics.percentage < threshold * 0.9) {
            // Reset if dropped below 90% of threshold (72%)
            if (this.alertState[metricName].alerted) {
                this.alertState[metricName].alerted = false;
                console.log(`✅ ${metricName} recovered to normal levels`);
            }
        }
    }

    // Check Socket.io Connections
    checkSocketConnections(metrics) {
        const threshold = 80; // 80%
        const metricName = 'socketConnections';

        if (metrics.percentage >= threshold) {
            if (this.canAlert(metricName)) {
                this.sendAlert(metricName, {
                    name: 'Socket.io Active Connections',
                    current: `${metrics.current} connections`,
                    threshold: `${threshold}% (${metrics.max * 0.8} connections)`,
                    percentage: `${metrics.percentage.toFixed(1)}%`,
                    actions: [
                        'Add Socket.io Redis adapter for horizontal scaling',
                        'Check for zombie connections (disconnect cleanup)',
                        'Implement connection rate limiting',
                        'Consider adding load balancer'
                    ]
                });

                this.alertState[metricName].alerted = true;
                this.alertState[metricName].lastAlertTime = Date.now();
            }
        } else if (metrics.percentage < threshold * 0.9) {
            if (this.alertState[metricName].alerted) {
                this.alertState[metricName].alerted = false;
                console.log(`✅ ${metricName} recovered to normal levels`);
            }
        }
    }

    // Check Memory Usage
    checkMemory(metrics) {
        const threshold = 80; // 80%
        const metricName = 'memory';

        if (metrics.percentage >= threshold) {
            if (this.canAlert(metricName)) {
                this.sendAlert(metricName, {
                    name: 'Node.js Memory Usage',
                    current: `${metrics.current}MB heap used`,
                    threshold: `${threshold}% (${metrics.max * 0.8}MB)`,
                    percentage: `${metrics.percentage.toFixed(1)}%`,
                    actions: [
                        'Check for memory leaks (use heap snapshots)',
                        'Restart server to clear memory',
                        'Optimize data structures (avoid large arrays)',
                        'Add pagination to reduce in-memory data',
                        `RSS: ${metrics.rss}MB, External: ${metrics.external}MB`
                    ]
                });

                this.alertState[metricName].alerted = true;
                this.alertState[metricName].lastAlertTime = Date.now();
            }
        } else if (metrics.percentage < threshold * 0.9) {
            if (this.alertState[metricName].alerted) {
                this.alertState[metricName].alerted = false;
                console.log(`✅ ${metricName} recovered to normal levels`);
            }
        }
    }

    // Check API Performance (requires 3 consecutive breaches)
    checkApiPerformance(metrics) {
        const threshold = parseInt(process.env.API_P95_LIMIT_MS) || 500;
        const metricName = 'apiPerformance';

        if (metrics.p95 > threshold) {
            this.alertState[metricName].consecutiveBreaches++;

            if (this.alertState[metricName].consecutiveBreaches >= 3 && this.canAlert(metricName)) {
                this.sendAlert(metricName, {
                    name: 'API Response Time (p95)',
                    current: `${metrics.p95}ms`,
                    threshold: `${threshold}ms`,
                    percentage: `${((metrics.p95 / threshold) * 100).toFixed(1)}%`,
                    actions: [
                        'Check slow database queries (add indexes)',
                        'Add Redis caching for frequent queries',
                        'Optimize API endpoints (reduce populate calls)',
                        `Average: ${metrics.avg}ms, Requests: ${metrics.count}`
                    ]
                });

                this.alertState[metricName].alerted = true;
                this.alertState[metricName].lastAlertTime = Date.now();
                this.alertState[metricName].consecutiveBreaches = 0;
            }
        } else {
            this.alertState[metricName].consecutiveBreaches = 0;
            if (this.alertState[metricName].alerted) {
                this.alertState[metricName].alerted = false;
                console.log(`✅ ${metricName} recovered to normal levels`);
            }
        }
    }

    // Check Error Rate
    checkErrorRate(metrics) {
        const threshold = parseFloat(process.env.ERROR_RATE_LIMIT) || 1;
        const metricName = 'errorRate';

        if (metrics.rate > threshold) {
            if (this.canAlert(metricName)) {
                this.sendAlert(metricName, {
                    name: 'API Error Rate',
                    current: `${metrics.rate}%`,
                    threshold: `${threshold}%`,
                    percentage: `${((metrics.rate / threshold) * 100).toFixed(1)}%`,
                    actions: [
                        'Check server logs for error patterns',
                        'Verify database connection stability',
                        'Check for failing external services (Cloudinary)',
                        `Errors: ${metrics.errors}, Requests: ${metrics.requests}`
                    ]
                });

                this.alertState[metricName].alerted = true;
                this.alertState[metricName].lastAlertTime = Date.now();
            }
        } else if (metrics.rate < threshold * 0.5) {
            if (this.alertState[metricName].alerted) {
                this.alertState[metricName].alerted = false;
                console.log(`✅ ${metricName} recovered to normal levels`);
            }
        }
    }

    // Check Redis Health
    checkRedisHealth(metrics) {
        const metricName = 'redisHealth';

        // Alert if Redis is disconnected
        if (!metrics.connected) {
            if (this.canAlert(metricName)) {
                this.sendAlert(metricName, {
                    name: 'Redis Connection',
                    current: 'Disconnected',
                    threshold: 'Connected',
                    percentage: '0%',
                    actions: [
                        'Check Upstash Redis dashboard for service status',
                        'Verify UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN in .env',
                        'Check network connectivity',
                        'Review Redis connection logs',
                        `Error: ${metrics.error || 'Unknown'}`
                    ]
                });

                this.alertState[metricName].alerted = true;
                this.alertState[metricName].lastAlertTime = Date.now();
            }
        }
        // Alert if Redis latency is critical (>300ms)
        else if (metrics.status === 'critical') {
            if (this.canAlert(metricName)) {
                this.sendAlert(metricName, {
                    name: 'Redis Latency',
                    current: `${metrics.latency}ms`,
                    threshold: '100ms (healthy)',
                    percentage: `${((metrics.latency / 100) * 100).toFixed(1)}%`,
                    actions: [
                        'Check Upstash dashboard for service degradation',
                        'Verify if approaching free tier limits (10K commands/day)',
                        'Consider upgrading Upstash plan if consistently slow',
                        'Check network latency to Upstash region',
                        `Current status: ${metrics.status}`
                    ]
                });

                this.alertState[metricName].alerted = true;
                this.alertState[metricName].lastAlertTime = Date.now();
            }
        }
        // Reset alert if Redis is healthy again
        else if (metrics.connected && metrics.status === 'healthy') {
            if (this.alertState[metricName].alerted) {
                this.alertState[metricName].alerted = false;
                console.log(`✅ ${metricName} recovered to normal levels`);
            }
        }
    }

    // Send alert email
    async sendAlert(metricName, data) {
        try {
            await emailService.sendAlert(data);
            console.log(`🚨 Alert sent for ${metricName}`);
        } catch (error) {
            console.error(`Failed to send alert for ${metricName}:`, error);
        }
    }

    // Check all metrics
    checkAllMetrics(allMetrics) {
        this.checkMongoPool(allMetrics.mongoPool);
        this.checkSocketConnections(allMetrics.socketConnections);
        this.checkMemory(allMetrics.memory);
        this.checkApiPerformance(allMetrics.apiPerformance);
        this.checkErrorRate(allMetrics.errorRate);
        this.checkRedisHealth(allMetrics.redisHealth);
    }
}

export default AlertManager;
