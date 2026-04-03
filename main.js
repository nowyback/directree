const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        minWidth: 800,
        minHeight: 600,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        },
        icon: path.join(__dirname, 'assets', 'icon.png'),
        show: false,
        titleBarStyle: 'default'
    });

    // Load the HTML file
    mainWindow.loadFile('templates/index.html');

    // Show window when ready to prevent visual flash
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
    });

    // Open DevTools in development mode
    if (process.argv.includes('--dev')) {
        mainWindow.webContents.openDevTools();
    }

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

// Handle app ready
app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

// Handle app closing
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// IPC handlers for file system operations
ipcMain.handle('get-file-tree', async (event, options) => {
    try {
        const { path: targetPath, maxDepth = 5, showHidden = false, ignoreList = [] } = options;
        
        // Validate and resolve path
        let resolvedPath;
        if (targetPath === '.' || !targetPath) {
            resolvedPath = process.cwd();
        } else {
            resolvedPath = path.resolve(targetPath);
        }

        // Security check - ensure path is accessible
        if (!fs.existsSync(resolvedPath)) {
            throw new Error('Path does not exist');
        }

        const stats = fs.statSync(resolvedPath);
        if (!stats.isDirectory()) {
            throw new Error('Path is not a directory');
        }

        // Generate tree
        const tree = generateFileTree(resolvedPath, 0, maxDepth, showHidden, ignoreList);
        const treeStats = getTreeStats(tree);

        return {
            success: true,
            tree,
            stats: treeStats,
            rootPath: resolvedPath
        };
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
});

ipcMain.handle('select-directory', async () => {
    try {
        const result = await dialog.showOpenDialog(mainWindow, {
            properties: ['openDirectory'],
            title: 'Select Directory to Explore'
        });

        if (!result.canceled && result.filePaths.length > 0) {
            return result.filePaths[0];
        }
        return null;
    } catch (error) {
        console.error('Directory selection error:', error);
        return null;
    }
});

ipcMain.handle('open-file', async (event, filePath) => {
    try {
        const { shell } = require('electron');
        await shell.openPath(filePath);
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

ipcMain.handle('open-in-explorer', async (event, folderPath) => {
    try {
        const { shell } = require('electron');
        await shell.showItemInFolder(folderPath);
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

function generateFileTree(dirPath, depth, maxDepth, showHidden, ignoreList = []) {
    if (depth > maxDepth) {
        return null;
    }

    try {
        const dirName = path.basename(dirPath);
        const node = {
            name: dirName === '' ? path.basename(process.cwd()) : dirName,
            path: dirPath,
            type: 'directory',
            children: []
        };

        const items = fs.readdirSync(dirPath, { withFileTypes: true });
        
        // Sort items: directories first, then files, both alphabetically
        items.sort((a, b) => {
            if (a.isDirectory() && !b.isDirectory()) return -1;
            if (!a.isDirectory() && b.isDirectory()) return 1;
            return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
        });

        let fileCount = 0;
        let dirCount = 0;

        for (const item of items) {
            // Skip hidden files if not requested
            if (!showHidden && item.name.startsWith('.')) {
                continue;
            }

            // Check ignore list
            if (shouldIgnoreItem(item.name, ignoreList)) {
                continue;
            }

            const itemPath = path.join(dirPath, item.name);

            try {
                if (item.isDirectory()) {
                    const childTree = generateFileTree(itemPath, depth + 1, maxDepth, showHidden, ignoreList);
                    if (childTree) {
                        node.children.push(childTree);
                        dirCount++;
                    }
                } else {
                    const fileStats = fs.statSync(itemPath);
                    const fileNode = {
                        name: item.name,
                        path: itemPath,
                        type: 'file',
                        size: fileStats.size
                    };
                    node.children.push(fileNode);
                    fileCount++;
                }
            } catch (error) {
                // Add error node for inaccessible items
                node.children.push({
                    name: item.name,
                    path: itemPath,
                    type: 'error',
                    error: 'Access denied'
                });
            }
        }

        node.file_count = fileCount;
        node.dir_count = dirCount;

        return node;
    } catch (error) {
        return {
            name: path.basename(dirPath),
            path: dirPath,
            type: 'error',
            error: error.message
        };
    }
}

function shouldIgnoreItem(itemName, ignoreList) {
    if (!ignoreList || ignoreList.length === 0) {
        return false;
    }

    for (const pattern of ignoreList) {
        if (pattern.trim() === '') continue;
        
        // Convert glob pattern to regex
        const regexPattern = pattern
            .replace(/\./g, '\\.')
            .replace(/\*/g, '.*')
            .replace(/\?/g, '.');
        
        const regex = new RegExp(`^${regexPattern}$`, 'i');
        
        if (regex.test(itemName)) {
            return true;
        }
    }
    
    return false;
}

function getTreeStats(tree) {
    if (!tree || tree.type === 'error') {
        return {
            total_files: 0,
            total_dirs: 0,
            total_size: 0
        };
    }

    const stats = {
        total_files: 0,
        total_dirs: 0,
        total_size: 0
    };

    function countItems(node) {
        if (node.type === 'file') {
            stats.total_files++;
            stats.total_size += node.size || 0;
        } else if (node.type === 'directory') {
            stats.total_dirs++;
            if (node.children) {
                node.children.forEach(countItems);
            }
        }
    }

    if (tree.children) {
        tree.children.forEach(countItems);
    }

    return stats;
}
