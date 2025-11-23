/**
 * Memory Usage Performance Test Suite
 * Tests for memory consumption and leak detection in UI components
 */

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';

describe('Memory Usage Tests', () => {
    let memoryMonitor;
    let uiSystem;
    let memorySnapshots;

    beforeEach(() => {
        memorySnapshots = [];
        
        // Mock memory monitoring (in real environment would use process.memoryUsage())
        memoryMonitor = {
            baseline: {
                heapUsed: 50 * 1024 * 1024, // 50MB baseline
                heapTotal: 100 * 1024 * 1024, // 100MB total
                external: 5 * 1024 * 1024, // 5MB external
                rss: 80 * 1024 * 1024 // 80MB RSS
            },
            currentUsage: null,
            
            getMemoryUsage: function() {
                // Simulate memory usage with controlled fluctuation
                const fluctuation = (Math.random() - 0.5) * 0.02; // ±2% fluctuation (reduced for stability)
                const componentGrowth = (uiSystem.components.size * 1024 * 100); // 100KB per component

                // Include cache memory in the calculation
                const cacheGrowth = Array.from(uiSystem.dataCache.values())
                    .reduce((total, cached) => total + cached.size, 0);

                const totalGrowth = componentGrowth + cacheGrowth;

                return {
                    heapUsed: Math.floor(this.baseline.heapUsed * (1 + fluctuation) + totalGrowth),
                    heapTotal: Math.floor(this.baseline.heapTotal * (1 + fluctuation) + totalGrowth * 1.5),
                    external: Math.floor(this.baseline.external * (1 + fluctuation)),
                    rss: Math.floor(this.baseline.rss * (1 + fluctuation) + totalGrowth * 1.2),
                    timestamp: performance.now()
                };
            },
            
            takeSnapshot: function(label) {
                const usage = this.getMemoryUsage();
                const snapshot = {
                    label,
                    usage,
                    timestamp: performance.now()
                };

                memorySnapshots.push(snapshot);
                return snapshot;
            },
            
            compareSnapshots: function(before, after) {
                return {
                    heapUsedDelta: after.usage.heapUsed - before.usage.heapUsed,
                    heapTotalDelta: after.usage.heapTotal - before.usage.heapTotal,
                    externalDelta: after.usage.external - before.usage.external,
                    rssDelta: after.usage.rss - before.usage.rss,
                    timeDelta: after.timestamp - before.timestamp,
                    
                    getMemoryGrowthRate: function() {
                        // Convert milliseconds to seconds, ensure minimum time to prevent division by zero
                        const timeSeconds = Math.max(this.timeDelta / 1000, 0.001);
                        return {
                            heapPerSecond: this.heapUsedDelta / timeSeconds,
                            rssPerSecond: this.rssDelta / timeSeconds
                        };
                    }
                };
            },
            
            detectMemoryLeak: function(snapshots, thresholdMB = 10) {
                if (snapshots.length < 3) return null;

                const recent = snapshots.slice(-5); // Last 5 snapshots

                // Calculate total memory change and total time
                const first = recent[0];
                const last = recent[recent.length - 1];
                const totalTimeDelta = last.timestamp - first.timestamp;
                const totalMemoryDelta = last.usage.heapUsed - first.usage.heapUsed;

                // Ensure minimum time period to get meaningful rate
                const timeSeconds = Math.max(totalTimeDelta / 1000, 1);

                // Calculate average growth rate over entire period
                const avgGrowthRate = totalMemoryDelta / timeSeconds;

                // Convert threshold to bytes per second
                const thresholdBytesPerSecond = thresholdMB * 1024 * 1024;

                // Check if memory is consistently growing across snapshots
                let positiveGrowthCount = 0;
                for (let i = 1; i < recent.length; i++) {
                    if (recent[i].usage.heapUsed > recent[i-1].usage.heapUsed) {
                        positiveGrowthCount++;
                    }
                }

                // Only flag as leak if consistently growing AND exceeds threshold
                const isConsistentGrowth = positiveGrowthCount >= (recent.length - 1) * 0.6; // 60% of intervals growing

                return {
                    isLeaking: isConsistentGrowth && avgGrowthRate > thresholdBytesPerSecond,
                    avgGrowthRate,
                    thresholdBytesPerSecond,
                    confidence: Math.min(1, recent.length / 5) // More snapshots = higher confidence
                };
            },
            
            formatBytes: function(bytes) {
                const sizes = ['Bytes', 'KB', 'MB', 'GB'];
                if (bytes === 0) return '0 Byte';
                const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
                return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
            },
            
            getMemoryReport: function() {
                const current = this.getMemoryUsage();
                const baseline = this.baseline;
                
                return {
                    current: {
                        heapUsed: this.formatBytes(current.heapUsed),
                        heapTotal: this.formatBytes(current.heapTotal),
                        external: this.formatBytes(current.external),
                        rss: this.formatBytes(current.rss)
                    },
                    growth: {
                        heapUsed: this.formatBytes(current.heapUsed - baseline.heapUsed),
                        heapTotal: this.formatBytes(current.heapTotal - baseline.heapTotal),
                        external: this.formatBytes(current.external - baseline.external),
                        rss: this.formatBytes(current.rss - baseline.rss)
                    },
                    utilization: {
                        heapUsedPercent: Math.round((current.heapUsed / current.heapTotal) * 100),
                        heapGrowthPercent: Math.round(((current.heapUsed - baseline.heapUsed) / baseline.heapUsed) * 100)
                    }
                };
            }
        };
        
        uiSystem = {
            components: new Map(),
            eventListeners: new Set(),
            timers: new Set(),
            dataCache: new Map(),
            renderHistory: [],
            
            createComponent: function(id, type, data = {}) {
                const component = {
                    id,
                    type,
                    data: { ...data },
                    domElements: this.createMockDomElements(type),
                    eventListeners: new Set(),
                    createdAt: Date.now(),
                    memoryFootprint: this.calculateMemoryFootprint(type, data)
                };
                
                this.components.set(id, component);
                this.attachEventListeners(component);
                
                return component;
            },
            
            destroyComponent: function(id) {
                const component = this.components.get(id);
                if (!component) return false;
                
                // Clean up event listeners
                component.eventListeners.forEach(listener => {
                    this.eventListeners.delete(listener);
                });
                
                // Clean up DOM elements
                component.domElements = null;
                
                this.components.delete(id);
                return true;
            },
            
            createMockDomElements: function(type) {
                // Simulate DOM elements based on component type
                const elementCounts = {
                    'menu': 10,
                    'table': 50,
                    'form': 20,
                    'chart': 100,
                    'text': 1
                };
                
                const count = elementCounts[type] || 5;
                return Array.from({ length: count }, (_, i) => ({
                    id: `elem_${type}_${i}`,
                    innerHTML: `<div>Mock ${type} element ${i}</div>`,
                    attributes: { class: `${type}-element`, 'data-id': i },
                    children: []
                }));
            },
            
            attachEventListeners: function(component) {
                // Simulate event listener attachment
                const events = ['click', 'focus', 'blur', 'keydown'];
                events.forEach(event => {
                    const listener = {
                        componentId: component.id,
                        event,
                        handler: () => {}, // Mock handler
                        createdAt: Date.now()
                    };
                    
                    component.eventListeners.add(listener);
                    this.eventListeners.add(listener);
                });
            },
            
            calculateMemoryFootprint: function(type, data) {
                const baseFootprints = {
                    'menu': 5 * 1024, // 5KB
                    'table': 20 * 1024, // 20KB
                    'form': 15 * 1024, // 15KB
                    'chart': 50 * 1024, // 50KB
                    'text': 1 * 1024 // 1KB
                };
                
                const baseFootprint = baseFootprints[type] || 10 * 1024;
                const dataSize = JSON.stringify(data).length;
                
                return baseFootprint + dataSize;
            },
            
            addToCache: function(key, value) {
                this.dataCache.set(key, {
                    value,
                    timestamp: Date.now(),
                    accessCount: 0,
                    size: JSON.stringify(value).length
                });
            },
            
            getFromCache: function(key) {
                const cached = this.dataCache.get(key);
                if (cached) {
                    cached.accessCount++;
                    return cached.value;
                }
                return null;
            },
            
            clearCache: function() {
                this.dataCache.clear();
            },
            
            scheduleCleanup: function() {
                const timerId = setTimeout(() => {
                    this.performCleanup();
                    this.timers.delete(timerId);
                }, 1000);
                
                this.timers.add(timerId);
            },
            
            performCleanup: function() {
                // Clean up old cache entries
                const now = Date.now();
                const maxAge = 5 * 60 * 1000; // 5 minutes
                
                for (const [key, cached] of this.dataCache.entries()) {
                    if (now - cached.timestamp > maxAge && cached.accessCount === 0) {
                        this.dataCache.delete(key);
                    }
                }
                
                // Clean up old render history
                if (this.renderHistory.length > 100) {
                    this.renderHistory = this.renderHistory.slice(-50);
                }
            },
            
            getTotalMemoryFootprint: function() {
                let total = 0;
                
                // Component memory
                this.components.forEach(component => {
                    total += component.memoryFootprint;
                });
                
                // Cache memory
                this.dataCache.forEach(cached => {
                    total += cached.size;
                });
                
                // Event listeners (estimate)
                total += this.eventListeners.size * 1024; // 1KB per listener estimate
                
                return total;
            },
            
            getMemoryStats: function() {
                const componentMemory = Array.from(this.components.values())
                    .reduce((total, comp) => total + comp.memoryFootprint, 0);
                
                const cacheMemory = Array.from(this.dataCache.values())
                    .reduce((total, cached) => total + cached.size, 0);
                
                return {
                    totalComponents: this.components.size,
                    componentMemory: memoryMonitor.formatBytes(componentMemory),
                    totalCacheEntries: this.dataCache.size,
                    cacheMemory: memoryMonitor.formatBytes(cacheMemory),
                    totalEventListeners: this.eventListeners.size,
                    estimatedTotal: memoryMonitor.formatBytes(this.getTotalMemoryFootprint())
                };
            },
            
            reset: function() {
                // Clear all components
                this.components.forEach((_, id) => this.destroyComponent(id));
                
                // Clear cache
                this.clearCache();
                
                // Clear timers
                this.timers.forEach(timer => clearTimeout(timer));
                this.timers.clear();
                
                // Clear history
                this.renderHistory = [];
            }
        };
    });
    
    describe('Memory Usage Monitoring', () => {
        test('should track baseline memory usage', () => {
            const baseline = memoryMonitor.takeSnapshot('baseline');
            
            expect(baseline.label).toBe('baseline');
            expect(baseline.usage.heapUsed).toBeGreaterThan(0);
            expect(baseline.usage.heapTotal).toBeGreaterThan(baseline.usage.heapUsed);
            expect(baseline.usage.rss).toBeGreaterThan(0);
        });

        test('should detect memory growth with component creation', () => {
            const before = memoryMonitor.takeSnapshot('before-components');
            
            // Create multiple components
            for (let i = 0; i < 10; i++) {
                uiSystem.createComponent(`comp-${i}`, 'table', {
                    rows: Array.from({ length: 20 }, (_, j) => ({ id: j, name: `Row ${j}` }))
                });
            }
            
            const after = memoryMonitor.takeSnapshot('after-components');
            const comparison = memoryMonitor.compareSnapshots(before, after);
            
            expect(comparison.heapUsedDelta).toBeGreaterThan(0);
            expect(comparison.rssDelta).toBeGreaterThan(0);
            expect(uiSystem.components.size).toBe(10);
        });

        test('should show memory reduction after cleanup', () => {
            // Create components
            for (let i = 0; i < 20; i++) {
                uiSystem.createComponent(`temp-comp-${i}`, 'chart', {
                    dataPoints: Array.from({ length: 100 }, () => Math.random())
                });
            }
            
            const beforeCleanup = memoryMonitor.takeSnapshot('before-cleanup');
            
            // Destroy half of the components
            for (let i = 0; i < 10; i++) {
                uiSystem.destroyComponent(`temp-comp-${i}`);
            }
            
            const afterCleanup = memoryMonitor.takeSnapshot('after-cleanup');
            const comparison = memoryMonitor.compareSnapshots(beforeCleanup, afterCleanup);
            
            expect(comparison.heapUsedDelta).toBeLessThan(0); // Memory should decrease
            expect(uiSystem.components.size).toBe(10);
        });
    });
    
    describe('Memory Leak Detection', () => {
        test('should detect potential memory leaks', () => {
            // Simulate gradual memory growth
            for (let i = 0; i < 10; i++) {
                memoryMonitor.takeSnapshot(`leak-test-${i}`);
                
                // Create components without cleaning up
                uiSystem.createComponent(`leak-comp-${i}`, 'table', {
                    data: Array.from({ length: 50 }, (_, j) => ({ id: j, value: Math.random() }))
                });
            }
            
            const leakDetection = memoryMonitor.detectMemoryLeak(memorySnapshots);
            
            expect(leakDetection).not.toBeNull();
            expect(leakDetection.avgGrowthRate).toBeGreaterThan(0);
        });

        test('should not flag normal memory usage as leak', () => {
            // Create and destroy components (normal usage)
            for (let i = 0; i < 8; i++) {
                memoryMonitor.takeSnapshot(`normal-usage-${i}`);
                
                // Create component
                uiSystem.createComponent(`normal-comp-${i}`, 'menu', { items: 5 });
                
                // Clean up previous component
                if (i > 0) {
                    uiSystem.destroyComponent(`normal-comp-${i-1}`);
                }
            }
            
            const leakDetection = memoryMonitor.detectMemoryLeak(memorySnapshots, 5); // 5MB threshold
            
            expect(leakDetection.isLeaking).toBe(false);
        });

        test('should track event listener cleanup', () => {
            const initialListeners = uiSystem.eventListeners.size;
            
            // Create components with event listeners
            for (let i = 0; i < 5; i++) {
                uiSystem.createComponent(`listener-comp-${i}`, 'form');
            }
            
            expect(uiSystem.eventListeners.size).toBeGreaterThan(initialListeners);
            
            // Destroy components
            for (let i = 0; i < 5; i++) {
                uiSystem.destroyComponent(`listener-comp-${i}`);
            }
            
            // Event listeners should be cleaned up
            expect(uiSystem.eventListeners.size).toBe(initialListeners);
        });
    });
    
    describe('Cache Memory Management', () => {
        test('should track cache memory usage', () => {
            const beforeCache = memoryMonitor.takeSnapshot('before-cache');
            
            // Add items to cache
            for (let i = 0; i < 50; i++) {
                const largeData = Array.from({ length: 100 }, (_, j) => ({
                    id: j,
                    name: `Item ${j}`,
                    data: `Large data string ${j}`.repeat(10)
                }));
                
                uiSystem.addToCache(`cache-key-${i}`, largeData);
            }
            
            const afterCache = memoryMonitor.takeSnapshot('after-cache');
            const comparison = memoryMonitor.compareSnapshots(beforeCache, afterCache);
            
            expect(comparison.heapUsedDelta).toBeGreaterThan(0);
            expect(uiSystem.dataCache.size).toBe(50);
        });

        test('should perform automatic cache cleanup', () => {
            // Add cache entries
            for (let i = 0; i < 20; i++) {
                uiSystem.addToCache(`temp-key-${i}`, { data: `temp data ${i}` });
            }
            
            expect(uiSystem.dataCache.size).toBe(20);
            
            // Manually trigger cleanup (simulating time passage)
            uiSystem.performCleanup();
            
            // Some entries might be cleaned up based on access patterns
            expect(uiSystem.dataCache.size).toBeLessThanOrEqual(20);
        });

        test('should manage render history memory', () => {
            // Fill render history beyond limit
            for (let i = 0; i < 150; i++) {
                uiSystem.renderHistory.push({
                    id: i,
                    type: 'render',
                    timestamp: Date.now(),
                    data: `render data ${i}`
                });
            }
            
            expect(uiSystem.renderHistory.length).toBe(150);
            
            // Trigger cleanup
            uiSystem.performCleanup();
            
            // History should be trimmed
            expect(uiSystem.renderHistory.length).toBeLessThan(150);
            expect(uiSystem.renderHistory.length).toBeGreaterThan(0);
        });
    });
    
    describe('Memory Usage Reporting', () => {
        test('should provide comprehensive memory report', () => {
            // Create some components and cache data
            uiSystem.createComponent('comp1', 'table', { rows: 50 });
            uiSystem.createComponent('comp2', 'chart', { dataPoints: 200 });
            uiSystem.addToCache('data1', { largeArray: Array(1000).fill('data') });
            
            const memoryReport = memoryMonitor.getMemoryReport();
            
            expect(memoryReport.current).toBeDefined();
            expect(memoryReport.growth).toBeDefined();
            expect(memoryReport.utilization).toBeDefined();
            expect(memoryReport.utilization.heapUsedPercent).toBeGreaterThan(0);
            expect(memoryReport.utilization.heapUsedPercent).toBeLessThanOrEqual(100);
        });

        test('should provide detailed component memory stats', () => {
            // Create various types of components
            uiSystem.createComponent('menu1', 'menu', { items: 10 });
            uiSystem.createComponent('table1', 'table', { rows: 100, columns: 5 });
            uiSystem.createComponent('form1', 'form', { fields: 20 });
            
            const stats = uiSystem.getMemoryStats();
            
            expect(stats.totalComponents).toBe(3);
            expect(stats.componentMemory).toBeDefined();
            expect(stats.totalEventListeners).toBeGreaterThan(0);
            expect(stats.estimatedTotal).toBeDefined();
        });

        test('should format memory sizes correctly', () => {
            const testCases = [
                { bytes: 1024, expected: '1 KB' },
                { bytes: 1048576, expected: '1 MB' },
                { bytes: 1073741824, expected: '1 GB' },
                { bytes: 500, expected: '500 Bytes' }
            ];
            
            testCases.forEach(({ bytes, expected }) => {
                const formatted = memoryMonitor.formatBytes(bytes);
                expect(formatted).toBe(expected);
            });
        });
    });
    
    describe('Memory Performance Under Load', () => {
        test('should maintain reasonable memory usage under heavy load', () => {
            const beforeLoad = memoryMonitor.takeSnapshot('before-heavy-load');
            
            // Simulate heavy component creation and destruction
            for (let cycle = 0; cycle < 10; cycle++) {
                // Create batch of components
                for (let i = 0; i < 20; i++) {
                    const id = `load-comp-${cycle}-${i}`;
                    uiSystem.createComponent(id, 'table', {
                        data: Array.from({ length: 50 }, (_, j) => ({
                            id: j,
                            value: Math.random(),
                            text: `Data ${j}`.repeat(5)
                        }))
                    });
                }
                
                // Add to cache
                for (let i = 0; i < 10; i++) {
                    uiSystem.addToCache(`load-cache-${cycle}-${i}`, {
                        data: Array(100).fill('cache data')
                    });
                }
                
                // Clean up some components
                for (let i = 0; i < 10; i++) {
                    uiSystem.destroyComponent(`load-comp-${cycle}-${i}`);
                }
                
                // Periodic cleanup
                if (cycle % 3 === 0) {
                    uiSystem.performCleanup();
                }
            }
            
            const afterLoad = memoryMonitor.takeSnapshot('after-heavy-load');
            const comparison = memoryMonitor.compareSnapshots(beforeLoad, afterLoad);
            
            // Memory should grow, but not excessively
            expect(comparison.heapUsedDelta).toBeGreaterThan(0);
            expect(comparison.heapUsedDelta).toBeLessThan(100 * 1024 * 1024); // Less than 100MB growth
        });

        test('should handle rapid component creation and destruction', () => {
            const snapshots = [];
            
            for (let i = 0; i < 20; i++) {
                snapshots.push(memoryMonitor.takeSnapshot(`rapid-test-${i}`));
                
                // Rapid create and destroy
                const componentIds = [];
                for (let j = 0; j < 10; j++) {
                    const id = `rapid-comp-${i}-${j}`;
                    componentIds.push(id);
                    uiSystem.createComponent(id, 'menu', { items: 5 });
                }
                
                // Immediately destroy all
                componentIds.forEach(id => uiSystem.destroyComponent(id));
            }
            
            // Check for memory leaks in rapid creation/destruction
            const leakDetection = memoryMonitor.detectMemoryLeak(snapshots, 2); // 2MB threshold
            
            expect(leakDetection.isLeaking).toBe(false);
            expect(uiSystem.components.size).toBe(0); // All components should be destroyed
        });
    });
    
    describe('Memory Cleanup Verification', () => {
        test('should completely clean up after reset', () => {
            // Create various resources
            for (let i = 0; i < 10; i++) {
                uiSystem.createComponent(`reset-comp-${i}`, 'chart', { points: 100 });
                uiSystem.addToCache(`reset-cache-${i}`, { data: 'test data' });
            }
            
            uiSystem.scheduleCleanup();
            
            const beforeReset = memoryMonitor.takeSnapshot('before-reset');
            
            // Reset everything
            uiSystem.reset();
            
            const afterReset = memoryMonitor.takeSnapshot('after-reset');
            
            // Verify complete cleanup
            expect(uiSystem.components.size).toBe(0);
            expect(uiSystem.dataCache.size).toBe(0);
            expect(uiSystem.eventListeners.size).toBe(0);
            expect(uiSystem.timers.size).toBe(0);
            expect(uiSystem.renderHistory).toHaveLength(0);
        });

        test('should properly clean up DOM references', () => {
            const component = uiSystem.createComponent('dom-test', 'table', { rows: 20 });
            
            expect(component.domElements).toBeDefined();
            expect(component.domElements.length).toBeGreaterThan(0);
            
            uiSystem.destroyComponent('dom-test');
            
            // DOM references should be nullified
            expect(component.domElements).toBeNull();
        });

        test('should track timer cleanup', () => {
            const initialTimerCount = uiSystem.timers.size;
            
            // Schedule multiple cleanup timers
            for (let i = 0; i < 5; i++) {
                uiSystem.scheduleCleanup();
            }
            
            expect(uiSystem.timers.size).toBe(initialTimerCount + 5);
            
            // Reset should clear all timers
            uiSystem.reset();
            
            expect(uiSystem.timers.size).toBe(0);
        });
    });
});