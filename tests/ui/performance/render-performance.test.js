/**
 * Render Performance Test Suite
 * Benchmarks and performance tests for UI rendering
 */

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';

describe('Render Performance Tests', () => {
    let performanceMonitor;
    let renderSystem;
    let benchmarkResults;

    beforeEach(() => {
        benchmarkResults = [];

        performanceMonitor = {
            metrics: new Map(),
            timers: new Map(),
            startTimer: function(name) {
                this.timers.set(name, {
                    startTime: performance.now(),
                    endTime: null,
                    duration: null
                });
            },
            endTimer: function(name) {
                const timer = this.timers.get(name);
                if (timer) {
                    timer.endTime = performance.now();
                    timer.duration = timer.endTime - timer.startTime;
                    
                    // Store in metrics
                    if (!this.metrics.has(name)) {
                        this.metrics.set(name, []);
                    }
                    this.metrics.get(name).push(timer.duration);
                    
                    return timer.duration;
                }
                return null;
            },
            getMetrics: function(name) {
                const measurements = this.metrics.get(name) || [];
                if (measurements.length === 0) return null;
                
                const sorted = measurements.slice().sort((a, b) => a - b);
                return {
                    count: measurements.length,
                    min: sorted[0],
                    max: sorted[sorted.length - 1],
                    average: measurements.reduce((a, b) => a + b, 0) / measurements.length,
                    median: sorted[Math.floor(sorted.length / 2)],
                    p95: sorted[Math.floor(sorted.length * 0.95)],
                    p99: sorted[Math.floor(sorted.length * 0.99)]
                };
            },
            benchmark: async function(name, fn, iterations = 100) {
                const results = [];
                
                // Warm-up runs
                for (let i = 0; i < 10; i++) {
                    await fn();
                }
                
                // Actual benchmark
                for (let i = 0; i < iterations; i++) {
                    const startTime = performance.now();
                    await fn();
                    const endTime = performance.now();
                    results.push(endTime - startTime);
                }
                
                const sorted = results.sort((a, b) => a - b);
                const benchmark = {
                    name,
                    iterations,
                    results: {
                        min: sorted[0],
                        max: sorted[sorted.length - 1],
                        average: results.reduce((a, b) => a + b, 0) / results.length,
                        median: sorted[Math.floor(sorted.length / 2)],
                        p95: sorted[Math.floor(sorted.length * 0.95)],
                        p99: sorted[Math.floor(sorted.length * 0.99)],
                        standardDeviation: this.calculateStandardDeviation(results)
                    }
                };
                
                benchmarkResults.push(benchmark);
                return benchmark;
            },
            calculateStandardDeviation: function(values) {
                const avg = values.reduce((a, b) => a + b, 0) / values.length;
                const squaredDiffs = values.map(value => Math.pow(value - avg, 2));
                const avgSquaredDiff = squaredDiffs.reduce((a, b) => a + b, 0) / squaredDiffs.length;
                return Math.sqrt(avgSquaredDiff);
            },
            clear: function() {
                this.metrics.clear();
                this.timers.clear();
                benchmarkResults.length = 0;
            }
        };

        renderSystem = {
            cache: new Map(),
            renderHistory: [],
            renderStats: {
                totalRenders: 0,
                cacheHits: 0,
                cacheMisses: 0,
                averageRenderTime: 0
            },
            
            renderMenu: async function(items, options = {}) {
                const startTime = performance.now();
                
                // Simulate menu rendering with variable complexity
                const complexity = items.length * (options.icons ? 1.5 : 1) * (options.descriptions ? 2 : 1);
                
                // Simulate rendering work
                await this.simulateRenderWork(complexity);
                
                const endTime = performance.now();
                const renderTime = endTime - startTime;
                
                this.renderStats.totalRenders++;
                this.updateAverageRenderTime(renderTime);
                
                this.renderHistory.push({
                    type: 'menu',
                    itemCount: items.length,
                    options,
                    renderTime,
                    timestamp: Date.now()
                });
                
                return {
                    rendered: true,
                    itemCount: items.length,
                    renderTime
                };
            },
            
            renderTable: async function(data, columns) {
                const startTime = performance.now();
                
                const cacheKey = `table_${data.length}_${columns.length}`;
                
                if (this.cache.has(cacheKey)) {
                    this.renderStats.cacheHits++;
                    const cachedResult = this.cache.get(cacheKey);
                    return {
                        ...cachedResult,
                        fromCache: true,
                        renderTime: performance.now() - startTime
                    };
                }
                
                this.renderStats.cacheMisses++;
                
                // Simulate table rendering
                const complexity = data.length * columns.length * 0.1;
                await this.simulateRenderWork(complexity);
                
                const endTime = performance.now();
                const renderTime = endTime - startTime;
                
                const result = {
                    rendered: true,
                    rows: data.length,
                    columns: columns.length,
                    renderTime
                };
                
                this.cache.set(cacheKey, result);
                this.renderStats.totalRenders++;
                this.updateAverageRenderTime(renderTime);
                
                return result;
            },
            
            renderProgressBar: async function(percentage, options = {}) {
                const startTime = performance.now();
                
                // Simple render for progress bars
                const complexity = options.animated ? 5 : 1;
                await this.simulateRenderWork(complexity);
                
                const renderTime = performance.now() - startTime;
                
                this.renderStats.totalRenders++;
                this.updateAverageRenderTime(renderTime);
                
                return {
                    rendered: true,
                    percentage,
                    renderTime
                };
            },
            
            renderCodeBlock: async function(code, language = 'javascript') {
                const startTime = performance.now();
                
                // Code highlighting is expensive
                const complexity = code.length * 0.01 + (language === 'javascript' ? 10 : 5);
                await this.simulateRenderWork(complexity);
                
                const renderTime = performance.now() - startTime;
                
                this.renderStats.totalRenders++;
                this.updateAverageRenderTime(renderTime);
                
                return {
                    rendered: true,
                    codeLength: code.length,
                    language,
                    renderTime
                };
            },
            
            batchRender: async function(renderTasks) {
                const startTime = performance.now();
                const results = [];
                
                // Execute all renders in parallel
                const promises = renderTasks.map(async task => {
                    switch (task.type) {
                        case 'menu':
                            return await this.renderMenu(task.items, task.options);
                        case 'table':
                            return await this.renderTable(task.data, task.columns);
                        case 'progress':
                            return await this.renderProgressBar(task.percentage, task.options);
                        case 'code':
                            return await this.renderCodeBlock(task.code, task.language);
                        default:
                            return { rendered: false, error: 'Unknown render type' };
                    }
                });
                
                const renderResults = await Promise.all(promises);
                const totalTime = performance.now() - startTime;
                
                return {
                    batchSize: renderTasks.length,
                    results: renderResults,
                    totalTime,
                    averagePerItem: totalTime / renderTasks.length
                };
            },
            
            simulateRenderWork: async function(complexity) {
                // Simulate CPU-intensive rendering work
                const baseDelay = Math.max(1, complexity * 0.5);
                
                // Add some randomness to simulate real-world variance
                const variance = baseDelay * 0.2 * (Math.random() - 0.5);
                const actualDelay = baseDelay + variance;
                
                if (actualDelay > 1) {
                    await new Promise(resolve => setTimeout(resolve, actualDelay));
                }
                
                // Simulate some CPU work for sub-millisecond delays
                const iterations = Math.floor(actualDelay * 10000);
                let result = 0;
                for (let i = 0; i < iterations; i++) {
                    result += Math.random();
                }
                
                return result;
            },
            
            updateAverageRenderTime: function(newTime) {
                const total = this.renderStats.averageRenderTime * (this.renderStats.totalRenders - 1) + newTime;
                this.renderStats.averageRenderTime = total / this.renderStats.totalRenders;
            },
            
            clearCache: function() {
                this.cache.clear();
            },
            
            getStats: function() {
                return {
                    ...this.renderStats,
                    cacheSize: this.cache.size,
                    cacheHitRate: this.renderStats.cacheHits / (this.renderStats.cacheHits + this.renderStats.cacheMisses) || 0
                };
            },
            
            reset: function() {
                this.cache.clear();
                this.renderHistory = [];
                this.renderStats = {
                    totalRenders: 0,
                    cacheHits: 0,
                    cacheMisses: 0,
                    averageRenderTime: 0
                };
            }
        };
    });

    describe('Individual Component Rendering', () => {
        test('should render simple menu within performance thresholds', async () => {
            const menuItems = [
                { id: 'arrays', label: 'Arrays' },
                { id: 'lists', label: 'Linked Lists' },
                { id: 'trees', label: 'Trees' }
            ];
            
            const result = await renderSystem.renderMenu(menuItems);
            
            expect(result.rendered).toBe(true);
            expect(result.renderTime).toBeLessThan(50); // 50ms threshold for simple menu
            expect(result.itemCount).toBe(3);
        });

        test('should render complex menu with icons and descriptions', async () => {
            const menuItems = Array.from({ length: 20 }, (_, i) => ({
                id: `item${i}`,
                label: `Menu Item ${i}`,
                description: `Description for menu item ${i}`
            }));
            
            const options = { icons: true, descriptions: true };
            const result = await renderSystem.renderMenu(menuItems, options);
            
            expect(result.rendered).toBe(true);
            expect(result.renderTime).toBeLessThan(200); // 200ms threshold for complex menu
            expect(result.itemCount).toBe(20);
        });

        test('should render data tables efficiently', async () => {
            const testData = Array.from({ length: 100 }, (_, i) => ({
                id: i,
                name: `Item ${i}`,
                value: Math.random() * 1000,
                category: `Category ${i % 5}`
            }));
            
            const columns = ['id', 'name', 'value', 'category'];
            const result = await renderSystem.renderTable(testData, columns);
            
            expect(result.rendered).toBe(true);
            expect(result.renderTime).toBeLessThan(100); // 100ms threshold for 100-row table
            expect(result.rows).toBe(100);
            expect(result.columns).toBe(4);
        });

        test('should render progress bars quickly', async () => {
            const result = await renderSystem.renderProgressBar(75, { animated: true });
            
            expect(result.rendered).toBe(true);
            expect(result.renderTime).toBeLessThan(20); // 20ms threshold for progress bar
            expect(result.percentage).toBe(75);
        });

        test('should render code blocks with syntax highlighting', async () => {
            const code = `
                function quickSort(arr) {
                    if (arr.length <= 1) return arr;
                    const pivot = arr[Math.floor(arr.length / 2)];
                    const left = arr.filter(x => x < pivot);
                    const right = arr.filter(x => x > pivot);
                    return quickSort(left).concat(pivot, quickSort(right));
                }
            `;
            
            const result = await renderSystem.renderCodeBlock(code, 'javascript');
            
            expect(result.rendered).toBe(true);
            expect(result.renderTime).toBeLessThan(150); // 150ms threshold for code highlighting
            expect(result.language).toBe('javascript');
            expect(result.codeLength).toBe(code.length);
        });
    });

    describe('Batch Rendering Performance', () => {
        test('should render multiple components efficiently in batch', async () => {
            const renderTasks = [
                {
                    type: 'menu',
                    items: [{ id: 'test', label: 'Test' }],
                    options: {}
                },
                {
                    type: 'table',
                    data: Array.from({ length: 10 }, (_, i) => ({ id: i, name: `Item ${i}` })),
                    columns: ['id', 'name']
                },
                {
                    type: 'progress',
                    percentage: 50,
                    options: {}
                },
                {
                    type: 'code',
                    code: 'console.log(\"Hello World\");',
                    language: 'javascript'
                }
            ];
            
            const result = await renderSystem.batchRender(renderTasks);
            
            expect(result.batchSize).toBe(4);
            expect(result.results.every(r => r.rendered)).toBe(true);
            expect(result.totalTime).toBeLessThan(200); // 200ms for batch of 4 items
            expect(result.averagePerItem).toBeLessThan(50); // Average per item
        });

        test('should handle large batch renders without blocking', async () => {
            const largeRenderTasks = Array.from({ length: 50 }, (_, i) => ({
                type: 'menu',
                items: [{ id: `item${i}`, label: `Item ${i}` }],
                options: {}
            }));
            
            const startTime = performance.now();
            const result = await renderSystem.batchRender(largeRenderTasks);
            const totalTime = performance.now() - startTime;
            
            expect(result.batchSize).toBe(50);
            expect(totalTime).toBeLessThan(1000); // 1 second for 50 renders
        });
    });

    describe('Caching Performance', () => {
        test('should improve performance with caching', async () => {
            const testData = Array.from({ length: 50 }, (_, i) => ({ id: i, value: i }));
            const columns = ['id', 'value'];
            
            // First render (cache miss)
            const firstRender = await renderSystem.renderTable(testData, columns);
            expect(firstRender.fromCache).toBeUndefined();
            
            // Second render (cache hit)
            const secondRender = await renderSystem.renderTable(testData, columns);
            expect(secondRender.fromCache).toBe(true);
            expect(secondRender.renderTime).toBeLessThan(firstRender.renderTime);
        });

        test('should track cache hit rates', async () => {
            const testData = [{ id: 1, name: 'Test' }];
            const columns = ['id', 'name'];
            
            // Generate cache misses and hits
            await renderSystem.renderTable(testData, columns); // miss
            await renderSystem.renderTable(testData, columns); // hit
            await renderSystem.renderTable(testData, columns); // hit
            
            const stats = renderSystem.getStats();
            expect(stats.cacheHits).toBe(2);
            expect(stats.cacheMisses).toBe(1);
            expect(stats.cacheHitRate).toBeCloseTo(0.67, 2);
        });
    });

    describe('Performance Benchmarking', () => {
        test('should benchmark menu rendering performance', async () => {
            const menuItems = Array.from({ length: 10 }, (_, i) => ({
                id: `item${i}`,
                label: `Menu Item ${i}`
            }));
            
            const benchmark = await performanceMonitor.benchmark(
                'menu-render-10-items',
                () => renderSystem.renderMenu(menuItems),
                50
            );
            
            expect(benchmark.iterations).toBe(50);
            expect(benchmark.results.average).toBeLessThan(100); // Average should be under 100ms
            expect(benchmark.results.p95).toBeLessThan(150); // 95th percentile under 150ms
        });

        test('should benchmark table rendering with different sizes', async () => {
            const testSizes = [10, 50, 100, 500];
            const benchmarks = [];
            
            for (const size of testSizes) {
                const testData = Array.from({ length: size }, (_, i) => ({
                    id: i,
                    name: `Item ${i}`,
                    value: Math.random() * 1000
                }));
                
                const columns = ['id', 'name', 'value'];
                const benchmark = await performanceMonitor.benchmark(
                    `table-render-${size}-rows`,
                    () => {
                        renderSystem.clearCache(); // Force cache miss for consistent benchmarking
                        return renderSystem.renderTable(testData, columns);
                    },
                    20
                );
                
                benchmarks.push({ size, benchmark });
            }
            
            // Verify performance scales reasonably with data size
            for (let i = 1; i < benchmarks.length; i++) {
                const current = benchmarks[i];
                const previous = benchmarks[i - 1];
                
                // Performance should scale sub-linearly (not grow faster than data size)
                const dataRatio = current.size / previous.size;
                const performanceRatio = current.benchmark.results.average / previous.benchmark.results.average;
                
                expect(performanceRatio).toBeLessThan(dataRatio * 1.5); // Allow 50% overhead for scaling
            }
        });

        test('should maintain consistent performance over time', async () => {
            const menuItems = Array.from({ length: 5 }, (_, i) => ({
                id: `item${i}`,
                label: `Item ${i}`
            }));
            
            // Run multiple benchmark sessions
            const benchmarks = [];
            for (let session = 0; session < 5; session++) {
                const benchmark = await performanceMonitor.benchmark(
                    `consistency-test-session-${session}`,
                    () => renderSystem.renderMenu(menuItems),
                    20
                );
                benchmarks.push(benchmark.results.average);
            }
            
            // Check performance consistency
            const averageTime = benchmarks.reduce((a, b) => a + b, 0) / benchmarks.length;
            const maxDeviation = Math.max(...benchmarks.map(time => Math.abs(time - averageTime)));
            
            // Maximum deviation should be within 50% of average
            expect(maxDeviation).toBeLessThan(averageTime * 0.5);
        });
    });

    describe('Performance Regression Detection', () => {
        test('should detect performance regressions', async () => {
            const baselineThresholds = {
                'simple-menu': 30, // ms
                'complex-menu': 150,
                'small-table': 50,
                'large-table': 300,
                'progress-bar': 20,
                'code-block': 100
            };
            
            // Test each component type
            const simpleMenuTime = (await renderSystem.renderMenu([{ id: 'test', label: 'Test' }])).renderTime;
            expect(simpleMenuTime).toBeLessThan(baselineThresholds['simple-menu']);
            
            const complexMenuItems = Array.from({ length: 20 }, (_, i) => ({
                id: `item${i}`,
                label: `Item ${i}`,
                description: `Description ${i}`
            }));
            const complexMenuTime = (await renderSystem.renderMenu(complexMenuItems, { icons: true, descriptions: true })).renderTime;
            expect(complexMenuTime).toBeLessThan(baselineThresholds['complex-menu']);
            
            const smallTableData = Array.from({ length: 10 }, (_, i) => ({ id: i, name: `Item ${i}` }));
            const smallTableTime = (await renderSystem.renderTable(smallTableData, ['id', 'name'])).renderTime;
            expect(smallTableTime).toBeLessThan(baselineThresholds['small-table']);
        });

        test('should provide performance metrics for monitoring', async () => {
            // Generate some renders
            await renderSystem.renderMenu([{ id: 'test', label: 'Test' }]);
            await renderSystem.renderTable([{ id: 1, name: 'Test' }], ['id', 'name']);
            await renderSystem.renderProgressBar(50);
            
            const stats = renderSystem.getStats();
            
            expect(stats.totalRenders).toBeGreaterThan(0);
            expect(stats.averageRenderTime).toBeGreaterThan(0);
            expect(stats.cacheSize).toBeGreaterThanOrEqual(0);
            expect(stats.cacheHitRate).toBeGreaterThanOrEqual(0);
            expect(stats.cacheHitRate).toBeLessThanOrEqual(1);
        });
    });

    describe('Memory Performance', () => {
        test('should not leak memory during repeated renders', async () => {
            const initialCacheSize = renderSystem.cache.size;
            
            // Perform many renders with same data (should use cache)
            const testData = [{ id: 1, name: 'Test' }];
            const columns = ['id', 'name'];
            
            for (let i = 0; i < 100; i++) {
                await renderSystem.renderTable(testData, columns);
            }
            
            const finalCacheSize = renderSystem.cache.size;
            
            // Cache should not grow unbounded
            expect(finalCacheSize - initialCacheSize).toBeLessThan(10);
        });

        test('should manage render history efficiently', async () => {
            const initialHistoryLength = renderSystem.renderHistory.length;
            
            // Generate many renders
            for (let i = 0; i < 50; i++) {
                await renderSystem.renderMenu([{ id: `item${i}`, label: `Item ${i}` }]);
            }
            
            const finalHistoryLength = renderSystem.renderHistory.length;
            
            expect(finalHistoryLength).toBe(initialHistoryLength + 50);
            expect(renderSystem.renderHistory).toHaveLength(finalHistoryLength);
        });
    });
});"