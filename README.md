# File Tree Generator - Desktop App

A desktop application built with Electron that automatically generates and displays file tree structures for any directory.

## Features

- **Desktop Application**: Native desktop app using Electron
- **Batch File Launcher**: Simple `start.bat` file to launch the app
- **Interactive File Tree**: Explore directory structures with expandable/collapsible folders
- **Directory Browser**: Built-in folder selection dialog
- **Customizable Depth**: Control how deep the tree generation goes
- **File Statistics**: View counts of files, directories, and total size
- **Hidden Files Option**: Toggle to show or hide hidden files/directories
- **Modern UI**: Clean, responsive interface with visual file type icons
- **Security**: Safe file system access with proper error handling

## Quick Start Tutorial

### For Users (Desktop App)

1. **Clone or download the repository**
2. **Double-click `start.bat`** - This handles everything automatically:
   - Checks for Node.js installation
   - Installs dependencies if needed
   - Launches the desktop application
3. **Use the app**:
   - Click "Browse" to select a folder, or enter a path manually
   - Adjust settings (depth, hidden files) as needed
   - Click "Generate Tree" to explore

### For Developers

1. **Install Node.js** (v16+): https://nodejs.org/
2. **Install dependencies**: `npm install`
3. **Run in development**: `npm run dev` (opens DevTools)
4. **Run normally**: `npm start`

### Alternative: Flask Web Server (Legacy)

This project also includes a Python Flask backend:

1. **Install Python dependencies**: `pip install -r requirements.txt`
2. **Run Flask server**: `python app.py`
3. **Open browser**: Navigate to `http://localhost:5000`

## Installation & Running

### Method 1: Using the Batch File (Recommended)

1. **Double-click `start.bat`** - This will:
   - Check for Node.js installation
   - Install dependencies automatically (if needed)
   - Launch the desktop application

### Method 2: Manual Installation

1. **Install Node.js** (if not already installed):
   - Download from https://nodejs.org/

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Run the application**:
   ```bash
   npm start
   ```

## Usage

1. **Launch the app** using `start.bat` or `npm start`
2. **Select Directory**: 
   - Enter a path manually, or
   - Click "Browse" to use the folder selection dialog
3. **Configure Options**:
   - Set maximum depth for tree generation
   - Toggle hidden files visibility
4. **Generate Tree**: Click "Generate Tree" to explore the directory structure

## Application Structure

```
file-tree-generator/
├── main.js              # Electron main process
├── preload.js           # Electron preload script
├── package.json         # Node.js configuration
├── start.bat            # Windows batch launcher
├── templates/
│   └── index.html       # User interface
├── requirements.txt     # Python dependencies (legacy)
├── app.py              # Flask backend (legacy)
└── README.md           # This file
```

## Technical Details

- **Framework**: Electron 28.0.0
- **Security**: Context isolation enabled, preload script for IPC
- **File System**: Direct Node.js fs API access
- **UI**: Modern HTML5/CSS3 with responsive design
- **Icons**: Emoji-based file type indicators

## Security Features

- Context isolation for secure renderer-main communication
- Path validation and error handling
- Safe file system access through IPC
- Proper permission error handling

## System Requirements

- **Operating System**: Windows 10 or later
- **Node.js**: Version 16 or higher
- **Memory**: 512MB RAM minimum
- **Storage**: 100MB free space

## Troubleshooting

### "Node.js is not installed"
- Install Node.js from https://nodejs.org/
- Restart your computer after installation

### "Failed to install dependencies"
- Check your internet connection
- Try running `npm install` manually

### "Failed to start the application"
- Ensure all dependencies are installed (`npm install`)
- Check that Node.js is in your system PATH

## Development Mode

For development with DevTools:
```bash
npm run dev
```

## License

MIT License
