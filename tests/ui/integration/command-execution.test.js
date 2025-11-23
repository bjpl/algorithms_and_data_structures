/**
 * Command Execution Integration Tests
 * Tests for command processing and execution workflows
 */

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';

describe('Command Execution Integration Tests', () => {
    let commandSystem;
    let executionLog;
    let mockFileSystem;

    beforeEach(() => {
        executionLog = [];
        
        mockFileSystem = {
            files: new Map(),
            write: jest.fn(function(path, content) {
                this.files.set(path, content);
                return Promise.resolve();
            }),
            read: jest.fn(function(path) {
                return Promise.resolve(this.files.get(path) || null);
            }),
            exists: jest.fn(function(path) {
                return Promise.resolve(this.files.has(path));
            }),
            delete: jest.fn(function(path) {
                const existed = this.files.has(path);
                this.files.delete(path);
                return Promise.resolve(existed);
            })
        };

        commandSystem = {
            state: {
                currentLesson: null,
                progress: new Map(),
                settings: {
                    difficulty: 'beginner',
                    showHints: true,
                    autoSave: true
                },
                history: [],
                isExecuting: false,
                lastCommand: null,
                commandQueue: []
            },
            commands: {
                start: {
                    name: 'start',
                    description: 'Start a lesson',
                    usage: 'start <lesson-name>',
                    requiresArgs: true,
                    execute: async function(args, context) {
                        const lessonName = args[0];
                        executionLog.push({ command: 'start', args, timestamp: Date.now() });
                        
                        if (!lessonName) {
                            throw new Error('Lesson name is required');
                        }
                        
                        context.state.currentLesson = lessonName;
                        context.state.progress.set(lessonName, { started: true, completed: false, score: 0 });
                        
                        return {
                            success: true,
                            message: `Started lesson: ${lessonName}`,
                            data: { lesson: lessonName }
                        };
                    }
                },
                complete: {
                    name: 'complete',
                    description: 'Mark current lesson as complete',
                    usage: 'complete [score]',
                    execute: async function(args, context) {
                        executionLog.push({ command: 'complete', args, timestamp: Date.now() });
                        
                        if (!context.state.currentLesson) {
                            throw new Error('No active lesson to complete');
                        }
                        
                        const score = args[0] ? parseInt(args[0]) : 100;
                        const progress = context.state.progress.get(context.state.currentLesson);
                        
                        if (progress) {
                            progress.completed = true;
                            progress.score = Math.max(progress.score, score);
                            progress.completedAt = new Date().toISOString();
                        }
                        
                        // Auto-save progress if enabled
                        if (context.state.settings.autoSave) {
                            const filename = 'progress.json';
                            const data = {
                                progress: Object.fromEntries(context.state.progress),
                                settings: context.state.settings,
                                savedAt: new Date().toISOString()
                            };
                            await mockFileSystem.write(filename, JSON.stringify(data, null, 2));
                        }
                        
                        return {
                            success: true,
                            message: `Completed lesson: ${context.state.currentLesson} (Score: ${score})`,
                            data: { lesson: context.state.currentLesson, score }
                        };
                    }
                },
                progress: {
                    name: 'progress',
                    description: 'View learning progress',
                    usage: 'progress [lesson-name]',
                    execute: async function(args, context) {
                        executionLog.push({ command: 'progress', args, timestamp: Date.now() });
                        
                        if (args[0]) {
                            const lessonProgress = context.state.progress.get(args[0]);
                            return {
                                success: true,
                                message: lessonProgress ? 'Lesson progress found' : 'Lesson not started',
                                data: { lesson: args[0], progress: lessonProgress }
                            };
                        } else {
                            const allProgress = Object.fromEntries(context.state.progress);
                            return {
                                success: true,
                                message: `Found progress for ${context.state.progress.size} lessons`,
                                data: { progress: allProgress }
                            };
                        }
                    }
                },
                set: {
                    name: 'set',
                    description: 'Update settings',
                    usage: 'set <setting> <value>',
                    requiresArgs: true,
                    execute: async function(args, context) {
                        executionLog.push({ command: 'set', args, timestamp: Date.now() });
                        
                        const [setting, value] = args;
                        if (!setting || value === undefined) {
                            throw new Error('Setting name and value are required');
                        }
                        
                        const validSettings = ['difficulty', 'showHints', 'autoSave'];
                        if (!validSettings.includes(setting)) {
                            throw new Error(`Invalid setting: ${setting}`);
                        }
                        
                        // Type conversion
                        let convertedValue = value;
                        if (setting === 'showHints' || setting === 'autoSave') {
                            convertedValue = value === 'true' || value === '1' || value === true;
                            if (value === 'false' || value === '0' || value === false) {
                                convertedValue = false;
                            }
                        }
                        
                        context.state.settings[setting] = convertedValue;
                        
                        return {
                            success: true,
                            message: `Updated ${setting} to ${convertedValue}`,
                            data: { setting, value: convertedValue }
                        };
                    }
                },
                save: {
                    name: 'save',
                    description: 'Save progress to file',
                    usage: 'save [filename]',
                    execute: async function(args, context) {
                        executionLog.push({ command: 'save', args, timestamp: Date.now() });
                        
                        const filename = args[0] || 'progress.json';
                        const data = {
                            progress: Object.fromEntries(context.state.progress),
                            settings: context.state.settings,
                            savedAt: new Date().toISOString()
                        };
                        
                        await mockFileSystem.write(filename, JSON.stringify(data, null, 2));
                        
                        return {
                            success: true,
                            message: `Progress saved to ${filename}`,
                            data: { filename, itemCount: context.state.progress.size }
                        };
                    }
                },
                load: {
                    name: 'load',
                    description: 'Load progress from file',
                    usage: 'load [filename]',
                    execute: async function(args, context) {
                        executionLog.push({ command: 'load', args, timestamp: Date.now() });
                        
                        const filename = args[0] || 'progress.json';
                        const content = await mockFileSystem.read(filename);
                        
                        if (!content) {
                            throw new Error(`File not found: ${filename}`);
                        }
                        
                        const data = JSON.parse(content);
                        context.state.progress = new Map(Object.entries(data.progress || {}));
                        context.state.settings = { ...context.state.settings, ...data.settings };
                        
                        return {
                            success: true,
                            message: `Progress loaded from ${filename}`,
                            data: { filename, itemCount: context.state.progress.size }
                        };
                    }
                },
                reset: {
                    name: 'reset',
                    description: 'Reset progress',
                    usage: 'reset [lesson-name|all]',
                    execute: async function(args, context) {
                        executionLog.push({ command: 'reset', args, timestamp: Date.now() });
                        
                        const target = args[0] || 'current';
                        
                        if (target === 'all') {
                            const count = context.state.progress.size;
                            context.state.progress.clear();
                            context.state.currentLesson = null;
                            return {
                                success: true,
                                message: `Reset progress for ${count} lessons`,
                                data: { resetCount: count }
                            };
                        } else if (target === 'current' && context.state.currentLesson) {
                            context.state.progress.delete(context.state.currentLesson);
                            const lesson = context.state.currentLesson;
                            context.state.currentLesson = null;
                            return {
                                success: true,
                                message: `Reset progress for lesson: ${lesson}`,
                                data: { lesson }
                            };
                        } else if (context.state.progress.has(target)) {
                            context.state.progress.delete(target);
                            return {
                                success: true,
                                message: `Reset progress for lesson: ${target}`,
                                data: { lesson: target }
                            };
                        } else {
                            throw new Error(`Lesson not found: ${target}`);
                        }
                    }
                },
                help: {
                    name: 'help',
                    description: 'Show help information',
                    usage: 'help [command-name]',
                    execute: async function(args, context) {
                        executionLog.push({ command: 'help', args, timestamp: Date.now() });
                        
                        if (args[0]) {
                            const command = context.commands[args[0]];
                            if (!command) {
                                throw new Error(`Unknown command: ${args[0]}`);
                            }
                            return {
                                success: true,
                                message: `Help for ${command.name}`,
                                data: {
                                    name: command.name,
                                    description: command.description,
                                    usage: command.usage
                                }
                            };
                        } else {
                            const commands = Object.values(context.commands).map(cmd => ({
                                name: cmd.name,
                                description: cmd.description,
                                usage: cmd.usage
                            }));
                            return {
                                success: true,
                                message: `Available commands (${commands.length})`,
                                data: { commands }
                            };
                        }
                    }
                }
            },
            execute: async function(commandLine) {
                if (this.state.isExecuting) {
                    this.state.commandQueue.push(commandLine);
                    return { success: true, message: 'Command queued', queued: true };
                }

                this.state.isExecuting = true;

                // Add to history first, before any errors can occur
                this.state.history.push({
                    command: commandLine,
                    timestamp: Date.now(),
                    status: 'executing'
                });

                try {
                    const parts = commandLine.trim().split(/\s+/);
                    const commandName = parts[0];
                    const args = parts.slice(1);

                    const command = this.commands[commandName];
                    if (!command) {
                        throw new Error(`Unknown command: ${commandName}`);
                    }

                    if (command.requiresArgs && args.length === 0) {
                        throw new Error(`Command '${commandName}' requires arguments. Usage: ${command.usage}`);
                    }
                    
                    const result = await command.execute(args, this);
                    
                    // Update history with result
                    this.state.history[this.state.history.length - 1].status = 'completed';
                    this.state.history[this.state.history.length - 1].result = result;
                    this.state.lastCommand = { command: commandName, args, result };
                    
                    return result;
                    
                } catch (error) {
                    // Update history with error
                    if (this.state.history.length > 0) {
                        this.state.history[this.state.history.length - 1].status = 'error';
                        this.state.history[this.state.history.length - 1].error = error.message;
                    }
                    
                    return {
                        success: false,
                        message: error.message,
                        error: error.name
                    };
                } finally {
                    this.state.isExecuting = false;
                    
                    // Process queued commands
                    if (this.state.commandQueue.length > 0) {
                        const nextCommand = this.state.commandQueue.shift();
                        setTimeout(() => this.execute(nextCommand), 0);
                    }
                }
            },
            saveProgress: async function() {
                return this.execute('save');
            },
            getCommandHistory: function() {
                return this.state.history.slice();
            },
            clearHistory: function() {
                this.state.history = [];
            }
        };
    });

    describe('Basic Command Execution', () => {
        test('should execute start command successfully', async () => {
            const result = await commandSystem.execute('start arrays');
            
            expect(result.success).toBe(true);
            expect(result.message).toContain('Started lesson: arrays');
            expect(commandSystem.state.currentLesson).toBe('arrays');
            expect(commandSystem.state.progress.has('arrays')).toBe(true);
        });

        test('should execute complete command successfully', async () => {
            await commandSystem.execute('start trees');
            const result = await commandSystem.execute('complete 85');
            
            expect(result.success).toBe(true);
            expect(result.data.score).toBe(85);
            
            const progress = commandSystem.state.progress.get('trees');
            expect(progress.completed).toBe(true);
            expect(progress.score).toBe(85);
        });

        test('should execute progress command and return data', async () => {
            await commandSystem.execute('start sorting');
            await commandSystem.execute('complete 92');
            
            const result = await commandSystem.execute('progress');
            
            expect(result.success).toBe(true);
            expect(result.data.progress).toBeDefined();
            expect(result.data.progress.sorting).toBeDefined();
            expect(result.data.progress.sorting.completed).toBe(true);
        });

        test('should execute help command and return command info', async () => {
            const result = await commandSystem.execute('help');
            
            expect(result.success).toBe(true);
            expect(result.data.commands).toBeDefined();
            expect(result.data.commands.length).toBeGreaterThan(0);
            
            const helpForStart = await commandSystem.execute('help start');
            expect(helpForStart.data.name).toBe('start');
            expect(helpForStart.data.usage).toBeDefined();
        });
    });

    describe('Command Validation and Error Handling', () => {
        test('should handle unknown commands', async () => {
            const result = await commandSystem.execute('unknown-command');
            
            expect(result.success).toBe(false);
            expect(result.message).toContain('Unknown command: unknown-command');
        });

        test('should validate required arguments', async () => {
            const result = await commandSystem.execute('start');
            
            expect(result.success).toBe(false);
            expect(result.message).toContain('requires arguments');
        });

        test('should handle command execution errors', async () => {
            const result = await commandSystem.execute('complete');
            
            expect(result.success).toBe(false);
            expect(result.message).toContain('No active lesson');
        });

        test('should handle invalid settings', async () => {
            const result = await commandSystem.execute('set invalidSetting value');
            
            expect(result.success).toBe(false);
            expect(result.message).toContain('Invalid setting');
        });

        test('should handle file operation errors', async () => {
            const result = await commandSystem.execute('load nonexistent.json');
            
            expect(result.success).toBe(false);
            expect(result.message).toContain('File not found');
        });
    });

    describe('Settings Management', () => {
        test('should update string settings', async () => {
            const result = await commandSystem.execute('set difficulty advanced');
            
            expect(result.success).toBe(true);
            expect(commandSystem.state.settings.difficulty).toBe('advanced');
        });

        test('should update boolean settings', async () => {
            const result1 = await commandSystem.execute('set showHints false');
            expect(result1.success).toBe(true);
            expect(commandSystem.state.settings.showHints).toBe(false);
            
            const result2 = await commandSystem.execute('set autoSave true');
            expect(result2.success).toBe(true);
            expect(commandSystem.state.settings.autoSave).toBe(true);
        });

        test('should handle boolean conversion from strings', async () => {
            await commandSystem.execute('set showHints 1');
            expect(commandSystem.state.settings.showHints).toBe(true);
            
            await commandSystem.execute('set showHints 0');
            expect(commandSystem.state.settings.showHints).toBe(false);
        });
    });

    describe('Progress Persistence', () => {
        test('should save progress to file', async () => {
            await commandSystem.execute('start graphs');
            await commandSystem.execute('complete 88');
            
            const result = await commandSystem.execute('save test-progress.json');
            
            expect(result.success).toBe(true);
            expect(mockFileSystem.write).toHaveBeenCalledWith(
                'test-progress.json',
                expect.stringContaining('graphs')
            );
        });

        test('should load progress from file', async () => {
            // Setup some progress and save it
            await commandSystem.execute('start dynamic');
            await commandSystem.execute('complete 95');
            await commandSystem.execute('save test-load.json');
            
            // Clear current progress
            commandSystem.state.progress.clear();
            commandSystem.state.currentLesson = null;
            
            // Load it back
            const result = await commandSystem.execute('load test-load.json');
            
            expect(result.success).toBe(true);
            expect(commandSystem.state.progress.has('dynamic')).toBe(true);
            expect(commandSystem.state.progress.get('dynamic').score).toBe(95);
        });

        test('should handle auto-save when enabled', async () => {
            await commandSystem.execute('set autoSave true');
            await commandSystem.execute('start recursion');
            await commandSystem.execute('complete 90');
            
            // Auto-save should have been triggered
            expect(mockFileSystem.write).toHaveBeenCalledWith(
                'progress.json',
                expect.stringContaining('recursion')
            );
        });
    });

    describe('Progress Reset Operations', () => {
        test('should reset current lesson progress', async () => {
            await commandSystem.execute('start searching');
            await commandSystem.execute('complete 87');
            
            const result = await commandSystem.execute('reset current');
            
            expect(result.success).toBe(true);
            expect(commandSystem.state.progress.has('searching')).toBe(false);
            expect(commandSystem.state.currentLesson).toBeNull();
        });

        test('should reset specific lesson progress', async () => {
            await commandSystem.execute('start lesson1');
            await commandSystem.execute('complete 80');
            await commandSystem.execute('start lesson2');
            await commandSystem.execute('complete 75');
            
            const result = await commandSystem.execute('reset lesson1');
            
            expect(result.success).toBe(true);
            expect(commandSystem.state.progress.has('lesson1')).toBe(false);
            expect(commandSystem.state.progress.has('lesson2')).toBe(true);
        });

        test('should reset all progress', async () => {
            await commandSystem.execute('start lesson1');
            await commandSystem.execute('complete 90');
            await commandSystem.execute('start lesson2');
            await commandSystem.execute('complete 85');
            
            const result = await commandSystem.execute('reset all');
            
            expect(result.success).toBe(true);
            expect(result.data.resetCount).toBe(2);
            expect(commandSystem.state.progress.size).toBe(0);
        });

        test('should handle reset of non-existent lesson', async () => {
            const result = await commandSystem.execute('reset nonexistent');
            
            expect(result.success).toBe(false);
            expect(result.message).toContain('Lesson not found');
        });
    });

    describe('Command History and State', () => {
        test('should maintain command execution history', async () => {
            await commandSystem.execute('start test-lesson');
            await commandSystem.execute('complete 100');
            await commandSystem.execute('progress');
            
            const history = commandSystem.getCommandHistory();
            
            expect(history).toHaveLength(3);
            expect(history[0].command).toBe('start test-lesson');
            expect(history[0].status).toBe('completed');
            expect(history[1].command).toBe('complete 100');
            expect(history[2].command).toBe('progress');
        });

        test('should track command execution errors in history', async () => {
            await commandSystem.execute('invalid-command');
            
            const history = commandSystem.getCommandHistory();
            const lastEntry = history[history.length - 1];
            
            expect(lastEntry.status).toBe('error');
            expect(lastEntry.error).toBeDefined();
        });

        test('should clear command history', async () => {
            await commandSystem.execute('help');
            await commandSystem.execute('progress');
            
            commandSystem.clearHistory();
            
            expect(commandSystem.getCommandHistory()).toHaveLength(0);
        });

        test('should track last successful command', async () => {
            await commandSystem.execute('start last-test');
            
            expect(commandSystem.state.lastCommand).toBeDefined();
            expect(commandSystem.state.lastCommand.command).toBe('start');
            expect(commandSystem.state.lastCommand.args).toEqual(['last-test']);
            expect(commandSystem.state.lastCommand.result.success).toBe(true);
        });
    });

    describe('Concurrent Command Execution', () => {
        test('should queue commands when system is busy', async () => {
            // Start a command that will take time
            const promise1 = commandSystem.execute('start concurrent-test-1');
            const promise2 = commandSystem.execute('start concurrent-test-2');
            
            const result1 = await promise1;
            const result2 = await promise2;
            
            expect(result1.success).toBe(true);
            // Second command should either succeed or be queued
            expect(result2.success || result2.queued).toBe(true);
        });

        test('should prevent concurrent execution', async () => {
            commandSystem.state.isExecuting = true;
            
            const result = await commandSystem.execute('help');
            
            expect(result.queued).toBe(true);
            expect(commandSystem.state.commandQueue).toHaveLength(1);
        });
    });

    describe('Complex Command Workflows', () => {
        test('should execute complete learning workflow', async () => {
            const workflow = [
                'set difficulty intermediate',
                'start comprehensive-test',
                'complete 95',
                'save workflow-test.json',
                'progress comprehensive-test'
            ];
            
            const results = [];
            for (const command of workflow) {
                results.push(await commandSystem.execute(command));
            }
            
            // All commands should succeed
            expect(results.every(r => r.success)).toBe(true);
            
            // Verify final state
            expect(commandSystem.state.settings.difficulty).toBe('intermediate');
            expect(commandSystem.state.progress.get('comprehensive-test').completed).toBe(true);
            expect(commandSystem.state.progress.get('comprehensive-test').score).toBe(95);
        });

        test('should handle error recovery in workflows', async () => {
            await commandSystem.execute('start error-recovery-test');
            
            // This should fail
            const errorResult = await commandSystem.execute('invalid-command');
            expect(errorResult.success).toBe(false);
            
            // This should still work
            const successResult = await commandSystem.execute('complete 88');
            expect(successResult.success).toBe(true);
            
            // Verify the lesson was still completed despite the error
            const progress = commandSystem.state.progress.get('error-recovery-test');
            expect(progress.completed).toBe(true);
        });
    });
});