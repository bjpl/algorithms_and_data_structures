/**
 * Error Handling Integration Tests
 * Tests for error scenarios and recovery mechanisms in UI
 */

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';

describe('Error Handling Integration Tests', () => {
    let errorHandler;
    let uiSystem;
    let errorLog;
    let recoveryActions;

    beforeEach(() => {
        errorLog = [];
        recoveryActions = [];

        errorHandler = {
            errors: new Map(),
            errorTypes: {
                UI_RENDER_ERROR: 'UI_RENDER_ERROR',
                NAVIGATION_ERROR: 'NAVIGATION_ERROR', 
                DATA_LOAD_ERROR: 'DATA_LOAD_ERROR',
                COMMAND_ERROR: 'COMMAND_ERROR',
                NETWORK_ERROR: 'NETWORK_ERROR',
                VALIDATION_ERROR: 'VALIDATION_ERROR',
                TIMEOUT_ERROR: 'TIMEOUT_ERROR',
                PERMISSION_ERROR: 'PERMISSION_ERROR'
            },
            severityLevels: {
                LOW: 1,
                MEDIUM: 2,
                HIGH: 3,
                CRITICAL: 4
            },
            handleError: function(error, context = {}) {
                const errorId = `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                const errorInfo = {
                    id: errorId,
                    message: error.message || 'Unknown error',
                    type: error.type || 'UNKNOWN_ERROR',
                    severity: error.severity || this.severityLevels.MEDIUM,
                    context: context,
                    timestamp: new Date().toISOString(),
                    stack: error.stack,
                    recovered: false,
                    recoveryAttempts: 0
                };

                this.errors.set(errorId, errorInfo);
                errorLog.push(errorInfo);

                // Log error for debugging
                console.error(`[${errorInfo.severity}] ${errorInfo.type}: ${errorInfo.message}`);

                // Attempt recovery based on error type and severity
                this.attemptRecovery(errorId, errorInfo);

                return errorId;
            },
            attemptRecovery: function(errorId, errorInfo) {
                const recoveryStrategy = this.getRecoveryStrategy(errorInfo.type, errorInfo.severity);
                
                if (recoveryStrategy) {
                    errorInfo.recoveryAttempts++;
                    recoveryActions.push({
                        errorId,
                        strategy: recoveryStrategy.name,
                        timestamp: Date.now()
                    });
                    
                    try {
                        const result = recoveryStrategy.execute(errorInfo);
                        if (result.success) {
                            errorInfo.recovered = true;
                            errorInfo.recoveryResult = result;
                        }
                    } catch (recoveryError) {
                        console.error('Recovery attempt failed:', recoveryError.message);
                        errorInfo.recoveryError = recoveryError.message;
                    }
                }
            },
            getRecoveryStrategy: function(errorType, severity) {
                const strategies = {
                    [this.errorTypes.UI_RENDER_ERROR]: {
                        name: 'ui-fallback',
                        execute: (errorInfo) => {
                            // Fallback to basic UI mode
                            uiSystem.enableFallbackMode();
                            return { success: true, action: 'enabled fallback mode' };
                        }
                    },
                    [this.errorTypes.NAVIGATION_ERROR]: {
                        name: 'navigation-reset',
                        execute: (errorInfo) => {
                            // Reset to main menu
                            uiSystem.resetToMainMenu();
                            return { success: true, action: 'reset to main menu' };
                        }
                    },
                    [this.errorTypes.DATA_LOAD_ERROR]: {
                        name: 'data-retry',
                        execute: (errorInfo) => {
                            // Retry loading with exponential backoff
                            const delay = Math.pow(2, errorInfo.recoveryAttempts) * 1000;
                            setTimeout(() => {
                                uiSystem.retryDataLoad(errorInfo.context.dataSource);
                            }, delay);
                            return { success: true, action: `retry scheduled in ${delay}ms` };
                        }
                    },
                    [this.errorTypes.COMMAND_ERROR]: {
                        name: 'command-help',
                        execute: (errorInfo) => {
                            // Show command help
                            uiSystem.showCommandHelp(errorInfo.context.command);
                            return { success: true, action: 'displayed command help' };
                        }
                    },
                    [this.errorTypes.NETWORK_ERROR]: {
                        name: 'offline-mode',
                        execute: (errorInfo) => {
                            // Enable offline mode
                            uiSystem.enableOfflineMode();
                            return { success: true, action: 'enabled offline mode' };
                        }
                    },
                    [this.errorTypes.VALIDATION_ERROR]: {
                        name: 'input-correction',
                        execute: (errorInfo) => {
                            // Show validation hints
                            uiSystem.showValidationHints(errorInfo.context.field, errorInfo.message);
                            return { success: true, action: 'displayed validation hints' };
                        }
                    }
                };

                return strategies[errorType];
            },
            getUserFriendlyMessage: function(error) {
                const friendlyMessages = {
                    [this.errorTypes.UI_RENDER_ERROR]: 'Display issue detected. Switching to simplified view.',
                    [this.errorTypes.NAVIGATION_ERROR]: 'Navigation problem. Returning to main menu.',
                    [this.errorTypes.DATA_LOAD_ERROR]: 'Unable to load content. Retrying...',
                    [this.errorTypes.COMMAND_ERROR]: 'Command not recognized. Here\'s some help.',
                    [this.errorTypes.NETWORK_ERROR]: 'Connection issue. Working in offline mode.',
                    [this.errorTypes.VALIDATION_ERROR]: 'Input needs correction. Please check the highlighted fields.',
                    [this.errorTypes.TIMEOUT_ERROR]: 'Operation took too long. Please try again.',
                    [this.errorTypes.PERMISSION_ERROR]: 'Access denied. Please check your permissions.'
                };

                return friendlyMessages[error.type] || 'An unexpected error occurred. Please try again.';
            },
            getErrorStats: function() {
                const stats = {
                    total: this.errors.size,
                    byType: {},
                    bySeverity: {},
                    recovered: 0,
                    unrecovered: 0
                };

                this.errors.forEach(error => {
                    stats.byType[error.type] = (stats.byType[error.type] || 0) + 1;
                    stats.bySeverity[error.severity] = (stats.bySeverity[error.severity] || 0) + 1;
                    
                    if (error.recovered) {
                        stats.recovered++;
                    } else {
                        stats.unrecovered++;
                    }
                });

                return stats;
            },
            clearErrors: function() {
                this.errors.clear();
                errorLog.length = 0;
                recoveryActions.length = 0;
            },
            getRecentErrors: function(count = 10) {
                return errorLog.slice(-count);
            }
        };

        uiSystem = {
            state: {
                fallbackMode: false,
                offlineMode: false,
                currentScreen: 'main-menu',
                lastError: null,
                retryCount: 0
            },
            enableFallbackMode: jest.fn(function() {
                this.state.fallbackMode = true;
                return { success: true };
            }),
            enableOfflineMode: jest.fn(function() {
                this.state.offlineMode = true;
                return { success: true };
            }),
            resetToMainMenu: jest.fn(function() {
                this.state.currentScreen = 'main-menu';
                return { success: true };
            }),
            retryDataLoad: jest.fn(function(dataSource) {
                this.state.retryCount++;
                return { success: true, dataSource };
            }),
            showCommandHelp: jest.fn(function(command) {
                return { success: true, command };
            }),
            showValidationHints: jest.fn(function(field, message) {
                return { success: true, field, message };
            }),
            simulateError: function(errorType, severity = 2, context = {}) {
                const error = {
                    message: `Simulated ${errorType} error`,
                    type: errorType,
                    severity: severity,
                    stack: new Error().stack
                };
                
                return errorHandler.handleError(error, context);
            }
        };
    });

    describe('Error Detection and Logging', () => {
        test('should capture and log UI render errors', () => {
            const error = {
                message: 'Component render failed',
                type: errorHandler.errorTypes.UI_RENDER_ERROR,
                severity: errorHandler.severityLevels.HIGH
            };
            
            const errorId = errorHandler.handleError(error);
            
            expect(errorId).toBeDefined();
            expect(errorLog).toHaveLength(1);
            expect(errorLog[0].type).toBe(errorHandler.errorTypes.UI_RENDER_ERROR);
            expect(errorLog[0].message).toBe('Component render failed');
        });

        test('should capture navigation errors with context', () => {
            const error = {
                message: 'Invalid route transition',
                type: errorHandler.errorTypes.NAVIGATION_ERROR
            };
            
            const context = {
                from: 'arrays-menu',
                to: 'invalid-screen',
                user: 'test-user'
            };
            
            errorHandler.handleError(error, context);
            
            expect(errorLog[0].context).toEqual(context);
            expect(errorLog[0].context.from).toBe('arrays-menu');
        });

        test('should assign unique IDs to each error', () => {
            const error1 = { message: 'Error 1', type: 'TEST_ERROR' };
            const error2 = { message: 'Error 2', type: 'TEST_ERROR' };
            
            const id1 = errorHandler.handleError(error1);
            const id2 = errorHandler.handleError(error2);
            
            expect(id1).not.toBe(id2);
            expect(errorHandler.errors.has(id1)).toBe(true);
            expect(errorHandler.errors.has(id2)).toBe(true);
        });

        test('should track error timestamps', () => {
            const beforeTime = Date.now();
            
            const error = { message: 'Timestamp test', type: 'TEST_ERROR' };
            errorHandler.handleError(error);
            
            const afterTime = Date.now();
            const loggedError = errorLog[0];
            const errorTime = new Date(loggedError.timestamp).getTime();
            
            expect(errorTime).toBeGreaterThanOrEqual(beforeTime);
            expect(errorTime).toBeLessThanOrEqual(afterTime);
        });
    });

    describe('Error Recovery Mechanisms', () => {
        test('should attempt UI fallback recovery for render errors', () => {
            uiSystem.simulateError(errorHandler.errorTypes.UI_RENDER_ERROR, errorHandler.severityLevels.HIGH);
            
            expect(uiSystem.enableFallbackMode).toHaveBeenCalled();
            expect(uiSystem.state.fallbackMode).toBe(true);
            expect(recoveryActions).toHaveLength(1);
            expect(recoveryActions[0].strategy).toBe('ui-fallback');
        });

        test('should reset navigation for navigation errors', () => {
            uiSystem.simulateError(errorHandler.errorTypes.NAVIGATION_ERROR, errorHandler.severityLevels.MEDIUM);
            
            expect(uiSystem.resetToMainMenu).toHaveBeenCalled();
            expect(uiSystem.state.currentScreen).toBe('main-menu');
        });

        test('should enable offline mode for network errors', () => {
            uiSystem.simulateError(errorHandler.errorTypes.NETWORK_ERROR, errorHandler.severityLevels.HIGH);
            
            expect(uiSystem.enableOfflineMode).toHaveBeenCalled();
            expect(uiSystem.state.offlineMode).toBe(true);
        });

        test('should show command help for command errors', () => {
            const context = { command: 'invalid-command' };
            const error = {
                message: 'Unknown command',
                type: errorHandler.errorTypes.COMMAND_ERROR
            };
            
            errorHandler.handleError(error, context);
            
            expect(uiSystem.showCommandHelp).toHaveBeenCalledWith('invalid-command');
        });

        test('should show validation hints for validation errors', () => {
            const context = { field: 'difficulty' };
            const error = {
                message: 'Invalid difficulty level',
                type: errorHandler.errorTypes.VALIDATION_ERROR
            };
            
            errorHandler.handleError(error, context);
            
            expect(uiSystem.showValidationHints).toHaveBeenCalledWith('difficulty', 'Invalid difficulty level');
        });
    });

    describe('Error Severity Handling', () => {
        test('should handle critical errors with immediate recovery', () => {
            const criticalError = {
                message: 'System crash imminent',
                type: errorHandler.errorTypes.UI_RENDER_ERROR,
                severity: errorHandler.severityLevels.CRITICAL
            };
            
            const errorId = errorHandler.handleError(criticalError);
            const errorInfo = errorHandler.errors.get(errorId);
            
            expect(errorInfo.severity).toBe(errorHandler.severityLevels.CRITICAL);
            expect(errorInfo.recoveryAttempts).toBeGreaterThan(0);
        });

        test('should handle low severity errors gracefully', () => {
            const lowError = {
                message: 'Minor UI glitch',
                type: errorHandler.errorTypes.UI_RENDER_ERROR,
                severity: errorHandler.severityLevels.LOW
            };
            
            errorHandler.handleError(lowError);
            
            expect(errorLog[0].severity).toBe(errorHandler.severityLevels.LOW);
        });
    });

    describe('User-Friendly Error Messages', () => {
        test('should provide friendly messages for technical errors', () => {
            const technicalErrors = [
                { type: errorHandler.errorTypes.UI_RENDER_ERROR },
                { type: errorHandler.errorTypes.NAVIGATION_ERROR },
                { type: errorHandler.errorTypes.DATA_LOAD_ERROR },
                { type: errorHandler.errorTypes.NETWORK_ERROR }
            ];
            
            technicalErrors.forEach(error => {
                const friendlyMessage = errorHandler.getUserFriendlyMessage(error);
                
                expect(friendlyMessage).toBeDefined();
                expect(friendlyMessage.length).toBeGreaterThan(10);
                expect(friendlyMessage).not.toContain('undefined');
                expect(friendlyMessage).not.toContain('null');
            });
        });

        test('should provide fallback message for unknown error types', () => {
            const unknownError = { type: 'UNKNOWN_ERROR_TYPE' };
            const message = errorHandler.getUserFriendlyMessage(unknownError);
            
            expect(message).toBe('An unexpected error occurred. Please try again.');
        });
    });

    describe('Error Statistics and Reporting', () => {
        test('should provide comprehensive error statistics', () => {
            // Generate various errors
            uiSystem.simulateError(errorHandler.errorTypes.UI_RENDER_ERROR);
            uiSystem.simulateError(errorHandler.errorTypes.NAVIGATION_ERROR);
            uiSystem.simulateError(errorHandler.errorTypes.UI_RENDER_ERROR);
            uiSystem.simulateError(errorHandler.errorTypes.NETWORK_ERROR);
            
            const stats = errorHandler.getErrorStats();
            
            expect(stats.total).toBe(4);
            expect(stats.byType[errorHandler.errorTypes.UI_RENDER_ERROR]).toBe(2);
            expect(stats.byType[errorHandler.errorTypes.NAVIGATION_ERROR]).toBe(1);
            expect(stats.byType[errorHandler.errorTypes.NETWORK_ERROR]).toBe(1);
        });

        test('should track recovery success rates', () => {
            uiSystem.simulateError(errorHandler.errorTypes.UI_RENDER_ERROR);
            uiSystem.simulateError(errorHandler.errorTypes.NAVIGATION_ERROR);
            
            const stats = errorHandler.getErrorStats();
            
            expect(stats.recovered).toBeGreaterThan(0);
            expect(stats.recovered + stats.unrecovered).toBe(stats.total);
        });

        test('should provide recent error history', () => {
            // Generate multiple errors
            for (let i = 0; i < 15; i++) {
                uiSystem.simulateError(errorHandler.errorTypes.DATA_LOAD_ERROR);
            }

            const recentErrors = errorHandler.getRecentErrors(5);

            expect(recentErrors).toHaveLength(5);
            // Compare timestamps as Date objects or convert to milliseconds
            const firstTime = new Date(recentErrors[0].timestamp).getTime();
            const lastTime = new Date(recentErrors[4].timestamp).getTime();
            expect(firstTime).toBeLessThanOrEqual(lastTime);
        });
    });

    describe('Error Recovery Retry Logic', () => {
        test('should implement exponential backoff for data load retries', (done) => {
            const context = { dataSource: 'lesson-data.json' };
            const error = {
                message: 'Failed to load lesson data',
                type: errorHandler.errorTypes.DATA_LOAD_ERROR
            };

            errorHandler.handleError(error, context);

            // The recovery strategy schedules a retry with setTimeout
            // Wait for the scheduled retry to execute (2^1 * 1000 = 2000ms)
            setTimeout(() => {
                expect(uiSystem.retryDataLoad).toHaveBeenCalledWith('lesson-data.json');
                done();
            }, 2500); // Wait longer than the initial backoff delay
        }, 15000); // Increase test timeout to 15 seconds

        test('should track retry attempts', () => {
            const error = {
                message: 'Connection timeout',
                type: errorHandler.errorTypes.NETWORK_ERROR
            };
            
            const errorId = errorHandler.handleError(error);
            const errorInfo = errorHandler.errors.get(errorId);
            
            expect(errorInfo.recoveryAttempts).toBe(1);
            
            // Simulate another recovery attempt
            errorHandler.attemptRecovery(errorId, errorInfo);
            expect(errorInfo.recoveryAttempts).toBe(2);
        });
    });

    describe('Error Context Preservation', () => {
        test('should preserve user context during error handling', () => {
            const userContext = {
                userId: 'user123',
                currentLesson: 'arrays-basics',
                progress: 75,
                sessionId: 'sess456'
            };
            
            const error = {
                message: 'Progress save failed',
                type: errorHandler.errorTypes.DATA_LOAD_ERROR
            };
            
            errorHandler.handleError(error, userContext);
            
            expect(errorLog[0].context).toEqual(userContext);
            expect(errorLog[0].context.userId).toBe('user123');
            expect(errorLog[0].context.currentLesson).toBe('arrays-basics');
        });

        test('should maintain error context through recovery attempts', () => {
            const context = { action: 'navigate', target: 'lesson-view' };
            const error = {
                message: 'Navigation failed',
                type: errorHandler.errorTypes.NAVIGATION_ERROR
            };
            
            const errorId = errorHandler.handleError(error, context);
            const errorInfo = errorHandler.errors.get(errorId);
            
            expect(errorInfo.context.action).toBe('navigate');
            expect(errorInfo.context.target).toBe('lesson-view');
        });
    });

    describe('Error Cleanup and Management', () => {
        test('should clear all errors and logs', () => {
            uiSystem.simulateError(errorHandler.errorTypes.UI_RENDER_ERROR);
            uiSystem.simulateError(errorHandler.errorTypes.NAVIGATION_ERROR);
            
            expect(errorLog).toHaveLength(2);
            expect(errorHandler.errors.size).toBe(2);
            
            errorHandler.clearErrors();
            
            expect(errorLog).toHaveLength(0);
            expect(errorHandler.errors.size).toBe(0);
            expect(recoveryActions).toHaveLength(0);
        });

        test('should handle cleanup during active error processing', () => {
            uiSystem.simulateError(errorHandler.errorTypes.DATA_LOAD_ERROR);
            
            // Simulate cleanup during recovery
            errorHandler.clearErrors();
            
            // System should handle this gracefully
            expect(errorHandler.errors.size).toBe(0);
            expect(() => errorHandler.getErrorStats()).not.toThrow();
        });
    });

    describe('Complex Error Scenarios', () => {
        test('should handle cascading errors correctly', () => {
            // Simulate a series of related errors
            uiSystem.simulateError(errorHandler.errorTypes.NETWORK_ERROR);
            uiSystem.simulateError(errorHandler.errorTypes.DATA_LOAD_ERROR);
            uiSystem.simulateError(errorHandler.errorTypes.UI_RENDER_ERROR);
            
            const stats = errorHandler.getErrorStats();
            
            expect(stats.total).toBe(3);
            expect(recoveryActions).toHaveLength(3);
            
            // Verify that offline mode was enabled due to network error
            expect(uiSystem.state.offlineMode).toBe(true);
            // Verify that fallback mode was enabled due to render error
            expect(uiSystem.state.fallbackMode).toBe(true);
        });

        test('should prevent infinite recovery loops', () => {
            const error = {
                message: 'Persistent error',
                type: errorHandler.errorTypes.UI_RENDER_ERROR
            };
            
            const errorId = errorHandler.handleError(error);
            const errorInfo = errorHandler.errors.get(errorId);
            
            // Simulate multiple recovery attempts
            for (let i = 0; i < 5; i++) {
                errorHandler.attemptRecovery(errorId, errorInfo);
            }
            
            // Should have attempted recovery multiple times but not infinitely
            expect(errorInfo.recoveryAttempts).toBe(6); // 1 initial + 5 manual
            expect(errorInfo.recoveryAttempts).toBeLessThan(10);
        });

        test('should maintain system stability during error storms', () => {
            // Simulate many errors in quick succession
            const errorTypes = Object.values(errorHandler.errorTypes);
            
            for (let i = 0; i < 50; i++) {
                const randomType = errorTypes[Math.floor(Math.random() * errorTypes.length)];
                uiSystem.simulateError(randomType);
            }
            
            const stats = errorHandler.getErrorStats();
            
            expect(stats.total).toBe(50);
            expect(stats.recovered + stats.unrecovered).toBe(50);
            expect(() => errorHandler.getErrorStats()).not.toThrow();
        });
    });
});