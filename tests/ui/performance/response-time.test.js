/**
 * Response Time Performance Test Suite
 * Tests for UI response time measurements and latency analysis
 */

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';

describe('Response Time Tests', () => {
    let responseTracker;
    let interactionSystem;
    let latencyMeasurements;

    beforeEach(() => {
        latencyMeasurements = [];
        
        responseTracker = {
            interactions: new Map(),
            measurements: [],
            thresholds: {
                excellent: 100,    // < 100ms excellent
                good: 300,         // < 300ms good  
                acceptable: 1000,  // < 1000ms acceptable
                poor: 3000        // < 3000ms poor (anything above is critical)
            },
            
            startInteraction: function(interactionId, type) {
                const interaction = {
                    id: interactionId,
                    type: type,
                    startTime: performance.now(),
                    endTime: null,
                    duration: null,
                    phases: [],
                    metadata: {}
                };
                
                this.interactions.set(interactionId, interaction);
                return interaction;
            },
            
            addPhase: function(interactionId, phaseName) {
                const interaction = this.interactions.get(interactionId);
                if (interaction) {
                    const currentTime = performance.now();
                    const phase = {
                        name: phaseName,
                        timestamp: currentTime,
                        duration: currentTime - (interaction.phases.length > 0 
                            ? interaction.phases[interaction.phases.length - 1].timestamp 
                            : interaction.startTime)
                    };
                    
                    interaction.phases.push(phase);
                }
            },
            
            endInteraction: function(interactionId, metadata = {}) {
                const interaction = this.interactions.get(interactionId);
                if (interaction) {
                    interaction.endTime = performance.now();
                    interaction.duration = interaction.endTime - interaction.startTime;
                    interaction.metadata = { ...interaction.metadata, ...metadata };
                    
                    this.measurements.push({
                        type: interaction.type,
                        duration: interaction.duration,
                        phases: interaction.phases.slice(),
                        timestamp: Date.now(),
                        metadata: interaction.metadata
                    });
                    
                    latencyMeasurements.push(interaction.duration);
                    return interaction.duration;
                }
                return null;
            },
            
            categorizeResponse: function(duration) {
                if (duration < this.thresholds.excellent) return 'excellent';
                if (duration < this.thresholds.good) return 'good';
                if (duration < this.thresholds.acceptable) return 'acceptable';
                if (duration < this.thresholds.poor) return 'poor';
                return 'critical';
            },
            
            getStatistics: function(interactionType = null) {
                let measurements = this.measurements;
                if (interactionType) {
                    measurements = measurements.filter(m => m.type === interactionType);
                }
                
                if (measurements.length === 0) return null;
                
                const durations = measurements.map(m => m.duration).sort((a, b) => a - b);
                const totalDuration = durations.reduce((sum, d) => sum + d, 0);
                
                return {
                    count: measurements.length,
                    min: durations[0],
                    max: durations[durations.length - 1],
                    mean: totalDuration / measurements.length,
                    median: durations[Math.floor(durations.length / 2)],
                    p95: durations[Math.floor(durations.length * 0.95)],
                    p99: durations[Math.floor(durations.length * 0.99)],
                    
                    distribution: {
                        excellent: measurements.filter(m => this.categorizeResponse(m.duration) === 'excellent').length,
                        good: measurements.filter(m => this.categorizeResponse(m.duration) === 'good').length,
                        acceptable: measurements.filter(m => this.categorizeResponse(m.duration) === 'acceptable').length,
                        poor: measurements.filter(m => this.categorizeResponse(m.duration) === 'poor').length,
                        critical: measurements.filter(m => this.categorizeResponse(m.duration) === 'critical').length
                    }
                };
            },
            
            getPerformanceReport: function() {
                const overall = this.getStatistics();
                if (!overall) return null;
                
                const byType = {};
                const types = [...new Set(this.measurements.map(m => m.type))];
                
                types.forEach(type => {
                    byType[type] = this.getStatistics(type);
                });
                
                return {
                    overall,
                    byType,
                    totalInteractions: this.measurements.length,
                    averageResponseTime: overall.mean,
                    responseTimeGrade: this.getOverallGrade(overall)
                };
            },
            
            getOverallGrade: function(stats) {
                const total = stats.count;
                const excellentPercent = (stats.distribution.excellent / total) * 100;
                const goodPercent = (stats.distribution.good / total) * 100;
                const acceptablePercent = (stats.distribution.acceptable / total) * 100;
                
                if (excellentPercent >= 80) return 'A+';
                if (excellentPercent + goodPercent >= 80) return 'A';
                if (excellentPercent + goodPercent >= 60) return 'B';
                if (excellentPercent + goodPercent + acceptablePercent >= 80) return 'C';
                return 'F';
            },
            
            detectPerformanceRegression: function(previousStats) {
                const currentStats = this.getStatistics();
                if (!currentStats || !previousStats) return null;
                
                const regressions = [];
                
                // Check for mean response time regression (>20% increase)
                const meanIncrease = ((currentStats.mean - previousStats.mean) / previousStats.mean) * 100;
                if (meanIncrease > 20) {
                    regressions.push({
                        type: 'mean_response_time',
                        previousValue: previousStats.mean,
                        currentValue: currentStats.mean,
                        percentageIncrease: meanIncrease
                    });
                }
                
                // Check for P95 regression (>30% increase)
                const p95Increase = ((currentStats.p95 - previousStats.p95) / previousStats.p95) * 100;
                if (p95Increase > 30) {
                    regressions.push({
                        type: 'p95_response_time',
                        previousValue: previousStats.p95,
                        currentValue: currentStats.p95,
                        percentageIncrease: p95Increase
                    });
                }
                
                return {
                    hasRegression: regressions.length > 0,
                    regressions,
                    severity: regressions.length > 1 ? 'high' : regressions.length > 0 ? 'medium' : 'low'
                };
            },
            
            clear: function() {
                this.interactions.clear();
                this.measurements = [];
                latencyMeasurements = [];
            }
        };
        
        interactionSystem = {
            state: {
                isProcessing: false,
                currentMenu: 'main',
                loadedData: new Map(),
                renderQueue: []
            },
            
            handleMenuNavigation: async function(direction) {
                const interactionId = `nav_${Date.now()}`;
                responseTracker.startInteraction(interactionId, 'navigation');
                
                // Simulate input processing phase
                responseTracker.addPhase(interactionId, 'input_processing');
                await this.simulateProcessing(5, 15);
                
                // Simulate state update phase
                responseTracker.addPhase(interactionId, 'state_update');
                this.state.currentMenu = direction;
                await this.simulateProcessing(2, 8);
                
                // Simulate render phase
                responseTracker.addPhase(interactionId, 'render');
                await this.simulateProcessing(10, 30);
                
                return responseTracker.endInteraction(interactionId, { direction });
            },
            
            handleMenuSelection: async function(itemId) {
                const interactionId = `select_${Date.now()}`;
                responseTracker.startInteraction(interactionId, 'selection');
                
                responseTracker.addPhase(interactionId, 'validation');
                await this.simulateProcessing(1, 5);
                
                responseTracker.addPhase(interactionId, 'data_fetch');
                await this.simulateDataFetch(itemId);
                
                responseTracker.addPhase(interactionId, 'render');
                await this.simulateProcessing(15, 40);
                
                return responseTracker.endInteraction(interactionId, { itemId });
            },
            
            handleFormSubmission: async function(formData) {
                const interactionId = `form_${Date.now()}`;
                responseTracker.startInteraction(interactionId, 'form_submission');
                
                responseTracker.addPhase(interactionId, 'validation');
                await this.simulateProcessing(5, 15);
                
                if (formData.requiresNetworkCall) {
                    responseTracker.addPhase(interactionId, 'network_request');
                    await this.simulateNetworkRequest();
                }
                
                responseTracker.addPhase(interactionId, 'state_update');
                await this.simulateProcessing(3, 10);
                
                responseTracker.addPhase(interactionId, 'render');
                await this.simulateProcessing(8, 25);
                
                return responseTracker.endInteraction(interactionId, { 
                    formSize: Object.keys(formData).length,
                    hasNetworkCall: formData.requiresNetworkCall 
                });
            },
            
            handleSearch: async function(query) {
                const interactionId = `search_${Date.now()}`;
                responseTracker.startInteraction(interactionId, 'search');
                
                responseTracker.addPhase(interactionId, 'query_processing');
                await this.simulateProcessing(2, 8);
                
                responseTracker.addPhase(interactionId, 'search_execution');
                const resultCount = await this.simulateSearch(query);
                
                responseTracker.addPhase(interactionId, 'result_rendering');
                await this.simulateProcessing(resultCount * 2, resultCount * 5);
                
                return responseTracker.endInteraction(interactionId, { 
                    queryLength: query.length,
                    resultCount 
                });
            },
            
            handleDataRefresh: async function() {
                const interactionId = `refresh_${Date.now()}`;
                responseTracker.startInteraction(interactionId, 'data_refresh');
                
                responseTracker.addPhase(interactionId, 'cache_clear');
                this.state.loadedData.clear();
                await this.simulateProcessing(1, 3);
                
                responseTracker.addPhase(interactionId, 'data_fetch');
                await this.simulateNetworkRequest();
                
                responseTracker.addPhase(interactionId, 'full_render');
                await this.simulateProcessing(20, 60);
                
                return responseTracker.endInteraction(interactionId, { 
                    dataSize: this.state.loadedData.size 
                });
            },
            
            simulateProcessing: async function(minMs, maxMs) {
                const delay = Math.random() * (maxMs - minMs) + minMs;
                if (delay > 1) {
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            },
            
            simulateDataFetch: async function(itemId) {
                if (this.state.loadedData.has(itemId)) {
                    // Cache hit - faster response
                    await this.simulateProcessing(1, 5);
                } else {
                    // Cache miss - slower response
                    await this.simulateProcessing(20, 80);
                    this.state.loadedData.set(itemId, { loaded: true, timestamp: Date.now() });
                }
            },
            
            simulateNetworkRequest: async function() {
                // Simulate network latency with variance
                const baseLatency = 100;
                const variance = Math.random() * 200; // 0-200ms variance
                const networkJitter = (Math.random() - 0.5) * 50; // ±25ms jitter
                
                const totalDelay = baseLatency + variance + networkJitter;
                await this.simulateProcessing(totalDelay, totalDelay + 10);
            },
            
            simulateSearch: async function(query) {
                const baseTime = Math.max(10, query.length * 2);
                const resultCount = Math.min(100, Math.max(0, 50 - query.length * 2));
                
                await this.simulateProcessing(baseTime, baseTime + resultCount);
                return resultCount;
            },
            
            runBenchmarkSuite: async function(iterations = 50) {
                const results = {
                    navigation: [],
                    selection: [],
                    form_submission: [],
                    search: [],
                    data_refresh: []
                };
                
                for (let i = 0; i < iterations; i++) {
                    // Navigation benchmark
                    const navTime = await this.handleMenuNavigation('down');
                    results.navigation.push(navTime);
                    
                    // Selection benchmark
                    const selTime = await this.handleMenuSelection(`item_${i}`);
                    results.selection.push(selTime);
                    
                    // Form submission benchmark (every 5th iteration)
                    if (i % 5 === 0) {
                        const formTime = await this.handleFormSubmission({ 
                            name: 'test', 
                            requiresNetworkCall: i % 10 === 0 
                        });
                        results.form_submission.push(formTime);
                    }
                    
                    // Search benchmark (every 3rd iteration)
                    if (i % 3 === 0) {
                        const searchTime = await this.handleSearch(`query ${i}`);
                        results.search.push(searchTime);
                    }
                    
                    // Data refresh benchmark (every 10th iteration)
                    if (i % 10 === 0) {
                        const refreshTime = await this.handleDataRefresh();
                        results.data_refresh.push(refreshTime);
                    }
                }
                
                return results;
            }
        };
    });
    
    describe('Basic Response Time Measurements', () => {
        test('should measure menu navigation response time', async () => {
            const responseTime = await interactionSystem.handleMenuNavigation('down');
            
            expect(responseTime).toBeGreaterThan(0);
            expect(responseTime).toBeLessThan(100); // Should be under 100ms for good UX
            expect(responseTracker.categorizeResponse(responseTime)).toMatch(/excellent|good/);
        });

        test('should measure menu selection response time', async () => {
            const responseTime = await interactionSystem.handleMenuSelection('arrays');
            
            expect(responseTime).toBeGreaterThan(0);
            expect(responseTime).toBeLessThan(200); // Should be under 200ms for selections
        });

        test('should measure form submission response time', async () => {
            const formData = {
                username: 'testuser',
                difficulty: 'intermediate',
                requiresNetworkCall: false
            };
            
            const responseTime = await interactionSystem.handleFormSubmission(formData);
            
            expect(responseTime).toBeGreaterThan(0);
            expect(responseTime).toBeLessThan(300); // Local form processing should be quick
        });

        test('should measure search response time', async () => {
            const responseTime = await interactionSystem.handleSearch('array sorting');
            
            expect(responseTime).toBeGreaterThan(0);
            expect(responseTime).toBeLessThan(500); // Search should be reasonably fast
            
            const measurement = responseTracker.measurements[responseTracker.measurements.length - 1];
            expect(measurement.metadata.queryLength).toBe(13);
        });

        test('should measure data refresh response time', async () => {
            const responseTime = await interactionSystem.handleDataRefresh();
            
            expect(responseTime).toBeGreaterThan(100); // Should include network time
            expect(responseTime).toBeLessThan(1000); // But not excessive
        });
    });
    
    describe('Response Time Categorization', () => {
        test('should categorize response times correctly', () => {
            expect(responseTracker.categorizeResponse(50)).toBe('excellent');
            expect(responseTracker.categorizeResponse(150)).toBe('good');
            expect(responseTracker.categorizeResponse(500)).toBe('acceptable');
            expect(responseTracker.categorizeResponse(2000)).toBe('poor');
            expect(responseTracker.categorizeResponse(4000)).toBe('critical');
        });

        test('should track response time distribution', async () => {
            // Generate various response times
            await interactionSystem.handleMenuNavigation('up'); // Should be excellent
            await interactionSystem.handleMenuSelection('item1'); // Should be good
            await interactionSystem.handleFormSubmission({ requiresNetworkCall: true }); // Might be acceptable
            
            const stats = responseTracker.getStatistics();
            
            expect(stats.distribution.excellent).toBeGreaterThanOrEqual(0);
            expect(stats.distribution.good).toBeGreaterThanOrEqual(0);
            expect(stats.distribution.acceptable).toBeGreaterThanOrEqual(0);
            expect(stats.count).toBe(3);
        });
    });
    
    describe('Performance Statistics', () => {
        test('should provide comprehensive statistics', async () => {
            // Generate multiple interactions
            for (let i = 0; i < 10; i++) {
                await interactionSystem.handleMenuNavigation(i % 2 === 0 ? 'up' : 'down');
            }
            
            const stats = responseTracker.getStatistics('navigation');
            
            expect(stats.count).toBe(10);
            expect(stats.min).toBeGreaterThan(0);
            expect(stats.max).toBeGreaterThan(stats.min);
            expect(stats.mean).toBeGreaterThan(0);
            expect(stats.median).toBeGreaterThan(0);
            expect(stats.p95).toBeGreaterThan(stats.median);
        });

        test('should provide performance report with grades', async () => {
            // Generate mixed performance interactions
            for (let i = 0; i < 20; i++) {
                if (i < 15) {
                    await interactionSystem.handleMenuNavigation('up'); // Fast operations
                } else {
                    await interactionSystem.handleFormSubmission({ requiresNetworkCall: true }); // Slower operations
                }
            }
            
            const report = responseTracker.getPerformanceReport();
            
            expect(report).toBeDefined();
            expect(report.overall).toBeDefined();
            expect(report.byType.navigation).toBeDefined();
            expect(report.byType.form_submission).toBeDefined();
            expect(report.responseTimeGrade).toMatch(/A\\+|A|B|C|F/);
            expect(report.totalInteractions).toBe(20);
        });
    });
    
    describe('Phase-based Performance Analysis', () => {
        test('should track interaction phases', async () => {
            await interactionSystem.handleMenuSelection('detailed-item');
            
            const interaction = responseTracker.measurements[responseTracker.measurements.length - 1];
            
            expect(interaction.phases).toBeDefined();
            expect(interaction.phases.length).toBeGreaterThan(0);
            
            // Should have validation, data_fetch, and render phases
            const phaseNames = interaction.phases.map(p => p.name);
            expect(phaseNames).toContain('validation');
            expect(phaseNames).toContain('data_fetch');
            expect(phaseNames).toContain('render');
        });

        test('should identify slow phases', async () => {
            await interactionSystem.handleFormSubmission({ 
                data: 'large form data',
                requiresNetworkCall: true 
            });
            
            const interaction = responseTracker.measurements[responseTracker.measurements.length - 1];
            const phases = interaction.phases;
            
            // Find the slowest phase
            const slowestPhase = phases.reduce((slowest, phase) => 
                phase.duration > slowest.duration ? phase : slowest
            );
            
            expect(slowestPhase).toBeDefined();
            expect(slowestPhase.duration).toBeGreaterThan(0);
            
            // Network phase should typically be slowest for network operations
            if (phases.some(p => p.name === 'network_request')) {
                const networkPhase = phases.find(p => p.name === 'network_request');
                expect(networkPhase.duration).toBeGreaterThan(50); // Network should take meaningful time
            }
        });
    });
    
    describe('Performance Regression Detection', () => {
        test('should detect mean response time regression', async () => {
            // Establish baseline
            for (let i = 0; i < 20; i++) {
                await interactionSystem.handleMenuNavigation('up');
            }
            
            const baselineStats = responseTracker.getStatistics();
            responseTracker.clear();
            
            // Simulate degraded performance
            const originalSimulateProcessing = interactionSystem.simulateProcessing;
            interactionSystem.simulateProcessing = async function(minMs, maxMs) {
                return originalSimulateProcessing.call(this, minMs * 2, maxMs * 2); // 2x slower
            };
            
            for (let i = 0; i < 20; i++) {
                await interactionSystem.handleMenuNavigation('up');
            }
            
            const regressionAnalysis = responseTracker.detectPerformanceRegression(baselineStats);
            
            expect(regressionAnalysis.hasRegression).toBe(true);
            expect(regressionAnalysis.regressions.length).toBeGreaterThan(0);
            expect(regressionAnalysis.severity).toMatch(/medium|high/);
            
            // Restore original function
            interactionSystem.simulateProcessing = originalSimulateProcessing;
        });

        test('should not flag minor variations as regressions', async () => {
            // Generate baseline data
            for (let i = 0; i < 50; i++) {
                await interactionSystem.handleMenuNavigation('up');
            }
            
            const baselineStats = responseTracker.getStatistics();
            responseTracker.clear();
            
            // Generate similar performance data (minor variation)
            for (let i = 0; i < 50; i++) {
                await interactionSystem.handleMenuNavigation('up');
            }
            
            const regressionAnalysis = responseTracker.detectPerformanceRegression(baselineStats);
            
            expect(regressionAnalysis.hasRegression).toBe(false);
            expect(regressionAnalysis.severity).toBe('low');
        });
    });
    
    describe('Load Testing Response Times', () => {
        test('should maintain reasonable response times under load', async () => {
            const results = await interactionSystem.runBenchmarkSuite(25);
            
            // Check navigation performance
            const navStats = this.calculateStats(results.navigation);
            expect(navStats.mean).toBeLessThan(100); // Average navigation under 100ms
            expect(navStats.p95).toBeLessThan(150); // 95th percentile under 150ms
            
            // Check selection performance  
            const selStats = this.calculateStats(results.selection);
            expect(selStats.mean).toBeLessThan(200); // Average selection under 200ms
            expect(selStats.p95).toBeLessThan(300); // 95th percentile under 300ms
        });

        test('should show performance consistency over time', async () => {
            const batchSize = 10;
            const batches = 5;
            const batchResults = [];
            
            for (let batch = 0; batch < batches; batch++) {
                const batchStart = responseTracker.measurements.length;
                
                for (let i = 0; i < batchSize; i++) {
                    await interactionSystem.handleMenuNavigation('up');
                }
                
                const batchMeasurements = responseTracker.measurements.slice(batchStart);
                const batchAverage = batchMeasurements.reduce((sum, m) => sum + m.duration, 0) / batchSize;
                batchResults.push(batchAverage);
            }
            
            // Check consistency (coefficient of variation should be low)
            const overallMean = batchResults.reduce((sum, avg) => sum + avg, 0) / batches;
            const variance = batchResults.reduce((sum, avg) => sum + Math.pow(avg - overallMean, 2), 0) / batches;
            const standardDeviation = Math.sqrt(variance);
            const coefficientOfVariation = standardDeviation / overallMean;
            
            expect(coefficientOfVariation).toBeLessThan(0.3); // CV should be less than 30%
        });
    });
    
    describe('Caching Impact on Response Times', () => {
        test('should show improved response times with caching', async () => {
            const itemId = 'cached-test-item';
            
            // First access (cache miss)
            const firstResponse = await interactionSystem.handleMenuSelection(itemId);
            
            // Second access (cache hit)
            const secondResponse = await interactionSystem.handleMenuSelection(itemId);
            
            // Cache hit should be significantly faster
            expect(secondResponse).toBeLessThan(firstResponse * 0.5); // At least 50% faster
        });

        test('should track cache hit rate impact on performance', async () => {
            const items = ['item1', 'item2', 'item3'];
            const responseTimes = [];
            
            // Generate cache misses and hits
            for (let round = 0; round < 3; round++) {
                for (const item of items) {
                    const responseTime = await interactionSystem.handleMenuSelection(item);
                    responseTimes.push({
                        item,
                        round,
                        responseTime,
                        isCacheHit: round > 0 // First round is cache miss
                    });
                }
            }
            
            // Calculate average response times for cache hits vs misses
            const cacheMisses = responseTimes.filter(r => !r.isCacheHit);
            const cacheHits = responseTimes.filter(r => r.isCacheHit);
            
            const avgCacheMiss = cacheMisses.reduce((sum, r) => sum + r.responseTime, 0) / cacheMisses.length;
            const avgCacheHit = cacheHits.reduce((sum, r) => sum + r.responseTime, 0) / cacheHits.length;
            
            expect(avgCacheHit).toBeLessThan(avgCacheMiss);
            expect(avgCacheHit / avgCacheMiss).toBeLessThan(0.8); // Cache hits should be 20%+ faster
        });
    });
    
    // Helper method for calculating statistics
    describe.skip('Helper Methods', () => {
        beforeEach(() => {
            this.calculateStats = function(values) {
                const sorted = values.slice().sort((a, b) => a - b);
                const sum = sorted.reduce((a, b) => a + b, 0);
                
                return {
                    count: sorted.length,
                    min: sorted[0],
                    max: sorted[sorted.length - 1],
                    mean: sum / sorted.length,
                    median: sorted[Math.floor(sorted.length / 2)],
                    p95: sorted[Math.floor(sorted.length * 0.95)],
                    p99: sorted[Math.floor(sorted.length * 0.99)]
                };
            };
        });
    });
});"