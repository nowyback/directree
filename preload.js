const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
    getFileTree: (options) => ipcRenderer.invoke('get-file-tree', options),
    selectDirectory: () => ipcRenderer.invoke('select-directory'),
    getDirectories: () => ipcRenderer.invoke('get-directories'),
    openFile: (filePath) => ipcRenderer.invoke('open-file', filePath),
    openInExplorer: (folderPath) => ipcRenderer.invoke('open-in-explorer', folderPath)
});
