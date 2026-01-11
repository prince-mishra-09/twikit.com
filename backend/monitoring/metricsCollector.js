// Metrics Collector - Gathers all system metrics
import mongoose from 'mongoose';

class MetricsCollector {
    constructor(io) {
        this.io = io;
        this.apiMetrics = {
            requests: [],
            errors: []
        };
    }

    // 1. MongoDB Connection Pool Usage
    getMongoPoolUsage() {
        try {
            const pool = mongoose.connection.db?.serverConfig?.s?.pool;
            if (!pool) return { current: 0, max: 100, percentage: 0 };

            const current = pool.totalConnectionCount || 0;
            const max = parseInt(process.env.MONGO_POOL_LIMIT) || 100;
            const percentage = (current / max) * 100;

            return { current, max, percentage };
        } catch (error) {
            console.error('Error getting MongoDB pool stats:', error);
            return { current: 0, max: 100, percentage: 0 };
        }
    }

    // 2. Socket.io Active Connections
    getSocketConnections() {
        try {
            const current = this.io?.engine?.clientsCount || 0;
            const max = parseInt(process.env.SOCKET_LIMIT) || 500;
            const percentage = (current / max) * 100;

            return { current, max, percentage };
        } catch (error) {
            console.error('Error getting Socket.io stats:', error);
            return { current: 0, max: 500, percentage: 0 };
        }
    }

    // 3. Memory Usage
    getMemoryUsage() {
        try {
            const memUsage = process.memoryUsage();
            const heapUsedMB = memUsage.heapUsed / 1024 / 1024;
            const maxMB = parseInt(process.env.MEMORY_LIMIT_MB) || 512;
            const percentage = (heapUsedMB / maxMB) * 100;

            return {
                current: Math.round(heapUsedMB),
                max: maxMB,
                percentage,
                rss: Math.round(memUsage.rss / 1024 / 1024),
                external: Math.round(memUsage.external / 1024 / 1024)
            };
        } catch (error) {
            console.error('Error getting memory stats:', error);
            return { current: 0, max: 512, percentage: 0 };
        }
    }

    // 4. API Response Time (p95)
    recordRequest(duration) {
        const now = Date.now();
        this.apiMetrics.requests.push({ duration, timestamp: now });

        // Keep only last 5 minutes of data
        const fiveMinutesAgo = now - 5 * 60 * 1000;
        this.apiMetrics.requests = this.apiMetrics.requests.filter(
            r => r.timestamp > fiveMinutesAgo
        );
    }

    getApiPerformance() {
        try {
            if (this.apiMetrics.requests.length === 0) {
                return { p95: 0, avg: 0, count: 0 };
            }

            const durations = this.apiMetrics.requests.map(r => r.duration).sort((a, b) => a - b);
            const p95Index = Math.floor(durations.length * 0.95);
            const p95 = durations[p95Index] || 0;
            const avg = durations.reduce((a, b) => a + b, 0) / durations.length;

            return {
                p95: Math.round(p95),
                avg: Math.round(avg),
                count: durations.length
            };
        } catch (error) {
            console.error('Error calculating API performance:', error);
            return { p95: 0, avg: 0, count: 0 };
        }
    }

    // 5. Error Rate
    recordError() {
        const now = Date.now();
        this.apiMetrics.errors.push({ timestamp: now });

        // Keep only last 5 minutes of data
        const fiveMinutesAgo = now - 5 * 60 * 1000;
        this.apiMetrics.errors = this.apiMetrics.errors.filter(
            e => e.timestamp > fiveMinutesAgo
        );
    }

    getErrorRate() {
        try {
            const totalRequests = this.apiMetrics.requests.length;
            const totalErrors = this.apiMetrics.errors.length;

            if (totalRequests === 0) return { rate: 0, errors: 0, requests: 0 };

            const rate = (totalErrors / totalRequests) * 100;

            return {
                rate: parseFloat(rate.toFixed(2)),
                errors: totalErrors,
                requests: totalRequests
            };
        } catch (error) {
            console.error('Error calculating error rate:', error);
            return { rate: 0, errors: 0, requests: 0 };
        }
    }

    // Get all metrics at once
    getAllMetrics() {
        return {
            mongoPool: this.getMongoPoolUsage(),
            socketConnections: this.getSocketConnections(),
            memory: this.getMemoryUsage(),
            apiPerformance: this.getApiPerformance(),
            errorRate: this.getErrorRate()
        };
    }
}

export default MetricsCollector;
