/**
 * Menu Interaction Integration Tests
 * Tests for menu system interactions and state management
 */

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';

describe('Menu Interaction Integration Tests', () => {
    let menuSystem;
    let interactionLog;
    let keyHandler;

    beforeEach(() => {
        interactionLog = [];
        
        menuSystem = {
            state: {
                currentMenuId: 'main',
                selectedIndex: 0,
                isOpen: true,
                searchQuery: '',
                filteredItems: [],
                lastInteraction: null
            },
            menus: {
                main: {
                    id: 'main',
                    title: 'Main Menu',
                    items: [
                        { id: 'arrays', label: 'Arrays & Lists', icon: '📊', description: 'Learn array operations and list structures', shortcut: '1' },
                        { id: 'trees', label: 'Trees & Graphs', icon: '🌳', description: 'Explore tree traversal and graph algorithms', shortcut: '2' },
                        { id: 'sorting', label: 'Sorting Algorithms', icon: '🔄', description: 'Master different sorting techniques', shortcut: '3' },
                        { id: 'searching', label: 'Search Algorithms', icon: '🔍', description: 'Learn binary search and advanced searching', shortcut: '4' },
                        { id: 'dynamic', label: 'Dynamic Programming', icon: '⚡', description: 'Solve complex problems with memoization', shortcut: '5' },
                        { id: 'practice', label: 'Practice Problems', icon: '💪', description: 'Test your knowledge with challenges', shortcut: '6' },
                        { id: 'progress', label: 'Progress Tracking', icon: '📈', description: 'View your learning progress', shortcut: '7' },
                        { id: 'settings', label: 'Settings', icon: '⚙️', description: 'Customize your learning experience', shortcut: '8' }
                    ]
                },
                arrays: {
                    id: 'arrays',
                    title: 'Arrays & Lists',
                    parent: 'main',
                    items: [
                        { id: 'array-basics', label: 'Array Basics', description: 'Fundamental array operations' },
                        { id: 'dynamic-arrays', label: 'Dynamic Arrays', description: 'Resizable array structures' },
                        { id: 'linked-lists', label: 'Linked Lists', description: 'Single and double linked lists' },
                        { id: 'array-practice', label: 'Array Practice', description: 'Hands-on array problems' }
                    ]
                },
                settings: {
                    id: 'settings',
                    title: 'Settings',
                    parent: 'main',
                    items: [
                        { id: 'theme', label: 'Theme Settings', type: 'submenu' },
                        { id: 'difficulty', label: 'Difficulty Level', type: 'select', options: ['Beginner', 'Intermediate', 'Advanced'] },
                        { id: 'notifications', label: 'Notifications', type: 'toggle', value: true },
                        { id: 'auto-save', label: 'Auto-save Progress', type: 'toggle', value: true },
                        { id: 'reset', label: 'Reset Progress', type: 'action', confirm: true }
                    ]
                }
            },
            navigate: function(direction) {
                const currentMenu = this.menus[this.state.currentMenuId];
                const itemCount = this.getVisibleItems().length;
                
                switch (direction) {
                    case 'up':
                        this.state.selectedIndex = (this.state.selectedIndex - 1 + itemCount) % itemCount;
                        break;
                    case 'down':
                        this.state.selectedIndex = (this.state.selectedIndex + 1) % itemCount;
                        break;
                    case 'first':
                        this.state.selectedIndex = 0;
                        break;
                    case 'last':
                        this.state.selectedIndex = itemCount - 1;
                        break;
                }
                
                this.state.lastInteraction = { type: 'navigate', direction, timestamp: Date.now() };
                interactionLog.push({ action: 'navigate', direction, newIndex: this.state.selectedIndex });
            },
            selectItem: function() {
                const item = this.getCurrentItem();
                if (!item) return false;
                
                interactionLog.push({ action: 'select', item: item.id, type: item.type || 'default' });
                
                switch (item.type) {
                    case 'submenu':
                        return this.openSubmenu(item.id);
                    case 'toggle':
                        return this.toggleItem(item.id);
                    case 'select':
                        return this.openSelectDialog(item.id);
                    case 'action':
                        return this.executeAction(item.id);
                    default:
                        return this.activateItem(item.id);
                }
            },
            getCurrentItem: function() {
                const visibleItems = this.getVisibleItems();
                return visibleItems[this.state.selectedIndex] || null;
            },
            getVisibleItems: function() {
                const currentMenu = this.menus[this.state.currentMenuId];
                if (!currentMenu) return [];
                
                if (this.state.searchQuery) {
                    return currentMenu.items.filter(item => 
                        item.label.toLowerCase().includes(this.state.searchQuery.toLowerCase()) ||
                        (item.description && item.description.toLowerCase().includes(this.state.searchQuery.toLowerCase()))
                    );
                }
                
                return currentMenu.items;
            },
            search: function(query) {
                this.state.searchQuery = query;
                this.state.selectedIndex = 0; // Reset selection when searching
                
                interactionLog.push({ action: 'search', query, resultCount: this.getVisibleItems().length });
            },
            clearSearch: function() {
                this.state.searchQuery = '';
                this.state.selectedIndex = 0;
                interactionLog.push({ action: 'clear-search' });
            },
            goBack: function() {
                const currentMenu = this.menus[this.state.currentMenuId];
                if (currentMenu && currentMenu.parent) {
                    this.state.currentMenuId = currentMenu.parent;
                    this.state.selectedIndex = 0;
                    this.clearSearch();
                    
                    interactionLog.push({ action: 'go-back', to: currentMenu.parent });
                    return true;
                }
                return false;
            },
            openSubmenu: function(menuId) {
                if (this.menus[menuId]) {
                    this.state.currentMenuId = menuId;
                    this.state.selectedIndex = 0;
                    this.clearSearch();
                    
                    interactionLog.push({ action: 'open-submenu', menuId });
                    return true;
                }
                return false;
            },
            toggleItem: function(itemId) {
                const currentMenu = this.menus[this.state.currentMenuId];
                const item = currentMenu.items.find(i => i.id === itemId);
                
                if (item && item.type === 'toggle') {
                    item.value = !item.value;
                    interactionLog.push({ action: 'toggle', itemId, newValue: item.value });
                    return true;
                }
                return false;
            },
            openSelectDialog: function(itemId) {
                const currentMenu = this.menus[this.state.currentMenuId];
                const item = currentMenu.items.find(i => i.id === itemId);
                
                if (item && item.type === 'select' && item.options) {
                    interactionLog.push({ action: 'open-select', itemId, options: item.options });
                    return true;
                }
                return false;
            },
            executeAction: function(itemId) {
                const currentMenu = this.menus[this.state.currentMenuId];
                const item = currentMenu.items.find(i => i.id === itemId);
                
                if (item && item.type === 'action') {
                    if (item.confirm) {
                        interactionLog.push({ action: 'request-confirmation', itemId });
                    } else {
                        interactionLog.push({ action: 'execute-action', itemId });
                    }
                    return true;
                }
                return false;
            },
            activateItem: function(itemId) {
                interactionLog.push({ action: 'activate', itemId });
                return true;
            },
            handleShortcut: function(shortcut) {
                const currentMenu = this.menus[this.state.currentMenuId];
                const item = currentMenu.items.find(i => i.shortcut === shortcut);
                
                if (item) {
                    this.state.selectedIndex = currentMenu.items.indexOf(item);
                    interactionLog.push({ action: 'shortcut', shortcut, itemId: item.id });
                    return this.selectItem();
                }
                return false;
            },
            getCurrentMenu: function() {
                return this.menus[this.state.currentMenuId];
            },
            getMenuPath: function() {
                const path = [];
                let currentMenuId = this.state.currentMenuId;
                
                while (currentMenuId) {
                    const menu = this.menus[currentMenuId];
                    path.unshift(menu.title);
                    currentMenuId = menu.parent;
                }
                
                return path;
            }
        };

        keyHandler = {
            handleKey: function(key, modifiers = {}) {
                switch (key) {
                    case 'ArrowUp':
                        menuSystem.navigate('up');
                        return true;
                    case 'ArrowDown':
                        menuSystem.navigate('down');
                        return true;
                    case 'Home':
                        menuSystem.navigate('first');
                        return true;
                    case 'End':
                        menuSystem.navigate('last');
                        return true;
                    case 'Enter':
                        return menuSystem.selectItem();
                    case 'Escape':
                        if (menuSystem.state.searchQuery) {
                            menuSystem.clearSearch();
                            return true;
                        }
                        return menuSystem.goBack();
                    case 'Backspace':
                        if (modifiers.ctrl) {
                            menuSystem.clearSearch();
                            return true;
                        }
                        return menuSystem.goBack();
                    default:
                        // Handle number shortcuts
                        if (/^[0-9]$/.test(key)) {
                            return menuSystem.handleShortcut(key);
                        }
                        // Handle search input
                        if (/^[a-zA-Z\\s]$/.test(key)) {
                            menuSystem.search(menuSystem.state.searchQuery + key);
                            return true;
                        }
                        return false;
                }
            }
        };
    });

    describe('Basic Menu Navigation', () => {
        test('should navigate up and down through menu items', () => {
            menuSystem.navigate('down');
            expect(menuSystem.state.selectedIndex).toBe(1);
            
            menuSystem.navigate('down');
            expect(menuSystem.state.selectedIndex).toBe(2);
            
            menuSystem.navigate('up');
            expect(menuSystem.state.selectedIndex).toBe(1);
        });

        test('should wrap around when navigating past boundaries', () => {
            const itemCount = menuSystem.getVisibleItems().length;
            
            // Navigate to last item
            menuSystem.navigate('last');
            expect(menuSystem.state.selectedIndex).toBe(itemCount - 1);
            
            // Navigate down should wrap to first
            menuSystem.navigate('down');
            expect(menuSystem.state.selectedIndex).toBe(0);
            
            // Navigate up should wrap to last
            menuSystem.navigate('up');
            expect(menuSystem.state.selectedIndex).toBe(itemCount - 1);
        });

        test('should jump to first and last items', () => {
            menuSystem.state.selectedIndex = 3;
            
            menuSystem.navigate('first');
            expect(menuSystem.state.selectedIndex).toBe(0);
            
            menuSystem.navigate('last');
            expect(menuSystem.state.selectedIndex).toBe(menuSystem.getVisibleItems().length - 1);
        });
    });

    describe('Menu Item Selection', () => {
        test('should select and activate regular menu items', () => {
            menuSystem.state.selectedIndex = 0; // Arrays
            const result = menuSystem.selectItem();
            
            expect(result).toBe(true);
            expect(interactionLog.some(e => e.action === 'activate' && e.itemId === 'arrays')).toBe(true);
        });

        test('should open submenus when selecting submenu items', () => {
            menuSystem.state.currentMenuId = 'main';
            menuSystem.state.selectedIndex = 0; // Arrays
            
            // First activate arrays to create a submenu scenario
            menuSystem.openSubmenu('arrays');
            
            expect(menuSystem.state.currentMenuId).toBe('arrays');
            expect(interactionLog.some(e => e.action === 'open-submenu')).toBe(true);
        });

        test('should handle toggle items correctly', () => {
            menuSystem.state.currentMenuId = 'settings';
            menuSystem.state.selectedIndex = 2; // Notifications toggle
            
            const initialValue = menuSystem.getCurrentItem().value;
            menuSystem.selectItem();
            
            expect(menuSystem.getCurrentItem().value).toBe(!initialValue);
            expect(interactionLog.some(e => e.action === 'toggle')).toBe(true);
        });

        test('should handle action items with confirmation', () => {
            menuSystem.state.currentMenuId = 'settings';
            menuSystem.state.selectedIndex = 4; // Reset action
            
            menuSystem.selectItem();
            
            expect(interactionLog.some(e => e.action === 'request-confirmation')).toBe(true);
        });
    });

    describe('Keyboard Input Handling', () => {
        test('should handle arrow key navigation', () => {
            keyHandler.handleKey('ArrowDown');
            expect(menuSystem.state.selectedIndex).toBe(1);
            
            keyHandler.handleKey('ArrowUp');
            expect(menuSystem.state.selectedIndex).toBe(0);
        });

        test('should handle Home and End keys', () => {
            keyHandler.handleKey('End');
            expect(menuSystem.state.selectedIndex).toBe(menuSystem.getVisibleItems().length - 1);
            
            keyHandler.handleKey('Home');
            expect(menuSystem.state.selectedIndex).toBe(0);
        });

        test('should handle Enter key for selection', () => {
            menuSystem.state.selectedIndex = 1;
            const result = keyHandler.handleKey('Enter');
            
            expect(result).toBe(true);
            expect(interactionLog.some(e => e.action === 'activate')).toBe(true);
        });

        test('should handle Escape key for going back', () => {
            menuSystem.state.currentMenuId = 'arrays';
            const result = keyHandler.handleKey('Escape');
            
            expect(result).toBe(true);
            expect(menuSystem.state.currentMenuId).toBe('main');
        });

        test('should handle number shortcuts', () => {
            const result = keyHandler.handleKey('2');
            
            expect(result).toBe(true);
            expect(interactionLog.some(e => e.action === 'shortcut' && e.shortcut === '2')).toBe(true);
        });
    });

    describe('Search Functionality', () => {
        test('should filter items based on search query', () => {
            menuSystem.search('array');
            
            const visibleItems = menuSystem.getVisibleItems();
            expect(visibleItems.length).toBeLessThan(menuSystem.menus.main.items.length);
            expect(visibleItems.every(item => 
                item.label.toLowerCase().includes('array') || 
                (item.description && item.description.toLowerCase().includes('array'))
            )).toBe(true);
        });

        test('should reset selection when searching', () => {
            menuSystem.state.selectedIndex = 3;
            menuSystem.search('sorting');
            
            expect(menuSystem.state.selectedIndex).toBe(0);
        });

        test('should clear search and restore full menu', () => {
            menuSystem.search('tree');
            const filteredCount = menuSystem.getVisibleItems().length;
            
            menuSystem.clearSearch();
            const fullCount = menuSystem.getVisibleItems().length;
            
            expect(fullCount).toBeGreaterThan(filteredCount);
            expect(menuSystem.state.searchQuery).toBe('');
        });

        test('should handle search with no results', () => {
            menuSystem.search('nonexistent');
            
            expect(menuSystem.getVisibleItems().length).toBe(0);
        });

        test('should handle character input for search', () => {
            keyHandler.handleKey('s');
            keyHandler.handleKey('o');
            keyHandler.handleKey('r');
            keyHandler.handleKey('t');
            
            expect(menuSystem.state.searchQuery).toBe('sort');
            expect(interactionLog.filter(e => e.action === 'search')).toHaveLength(4);
        });
    });

    describe('Menu State Management', () => {
        test('should maintain menu hierarchy correctly', () => {
            menuSystem.openSubmenu('arrays');
            expect(menuSystem.state.currentMenuId).toBe('arrays');
            
            const path = menuSystem.getMenuPath();
            expect(path).toEqual(['Main Menu', 'Arrays & Lists']);
        });

        test('should track interaction history', () => {
            menuSystem.navigate('down');
            menuSystem.selectItem();
            menuSystem.navigate('up');
            
            expect(interactionLog.length).toBeGreaterThan(0);
            expect(interactionLog.some(e => e.action === 'navigate')).toBe(true);
            expect(interactionLog.some(e => e.action === 'activate')).toBe(true);
        });

        test('should handle invalid menu navigation gracefully', () => {
            const result = menuSystem.openSubmenu('nonexistent');
            expect(result).toBe(false);
            expect(menuSystem.state.currentMenuId).toBe('main'); // Should remain unchanged
        });

        test('should handle back navigation from root menu', () => {
            menuSystem.state.currentMenuId = 'main';
            const result = menuSystem.goBack();
            
            expect(result).toBe(false);
            expect(menuSystem.state.currentMenuId).toBe('main');
        });
    });

    describe('Complex Menu Interactions', () => {
        test('should handle rapid navigation correctly', () => {
            const rapidActions = [
                () => menuSystem.navigate('down'),
                () => menuSystem.navigate('down'),
                () => menuSystem.navigate('up'),
                () => menuSystem.selectItem(),
                () => menuSystem.navigate('down'),
                () => menuSystem.goBack()
            ];
            
            rapidActions.forEach(action => action());
            
            // Should maintain consistent state
            expect(menuSystem.state.selectedIndex).toBeGreaterThanOrEqual(0);
            expect(menuSystem.getCurrentMenu()).toBeDefined();
        });

        test('should handle search during navigation', () => {
            menuSystem.navigate('down');
            menuSystem.navigate('down');
            menuSystem.search('dynamic');
            
            expect(menuSystem.state.selectedIndex).toBe(0); // Reset on search
            expect(menuSystem.getVisibleItems().length).toBe(1); // Should find Dynamic Programming
            
            menuSystem.clearSearch();
            expect(menuSystem.getVisibleItems().length).toBe(8); // Back to full menu
        });

        test('should handle menu switching with preserved state', () => {
            // Navigate to arrays submenu
            menuSystem.openSubmenu('arrays');
            menuSystem.navigate('down');
            menuSystem.navigate('down');
            
            const arrayIndex = menuSystem.state.selectedIndex;
            
            // Go back and enter settings
            menuSystem.goBack();
            menuSystem.openSubmenu('settings');
            
            // State should be reset in new menu
            expect(menuSystem.state.selectedIndex).toBe(0);
            expect(menuSystem.state.currentMenuId).toBe('settings');
        });

        test('should maintain search state within menu context', () => {
            menuSystem.search('array');
            const searchResults = menuSystem.getVisibleItems().length;
            
            // Navigate within search results
            if (searchResults > 1) {
                menuSystem.navigate('down');
                expect(menuSystem.state.selectedIndex).toBe(1);
                expect(menuSystem.state.searchQuery).toBe('array');
            }
        });
    });

    describe('Accessibility and User Experience', () => {
        test('should provide meaningful interaction feedback', () => {
            menuSystem.navigate('down');
            menuSystem.selectItem();
            
            const lastNavigation = interactionLog.find(e => e.action === 'navigate');
            const lastSelection = interactionLog.find(e => e.action === 'activate');
            
            expect(lastNavigation).toBeDefined();
            expect(lastNavigation.newIndex).toBeDefined();
            expect(lastSelection).toBeDefined();
            expect(lastSelection.itemId).toBeDefined();
        });

        test('should track timing of interactions', () => {
            menuSystem.navigate('down');
            
            expect(menuSystem.state.lastInteraction).toBeDefined();
            expect(menuSystem.state.lastInteraction.type).toBe('navigate');
            expect(menuSystem.state.lastInteraction.timestamp).toBeGreaterThan(0);
        });

        test('should provide context about current location', () => {
            menuSystem.openSubmenu('arrays');
            menuSystem.navigate('down');
            
            const currentItem = menuSystem.getCurrentItem();
            const menuPath = menuSystem.getMenuPath();
            
            expect(currentItem).toBeDefined();
            expect(currentItem.label).toBeDefined();
            expect(menuPath).toContain('Arrays & Lists');
        });
    });
});