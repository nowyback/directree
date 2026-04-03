import os
import json
from flask import Flask, render_template, request, jsonify
from pathlib import Path

app = Flask(__name__)

class FileTreeGenerator:
    def __init__(self, root_path):
        self.root_path = Path(root_path)
    
    def generate_tree(self, max_depth=10, show_hidden=False):
        """Generate a file tree structure"""
        try:
            tree = self._build_tree(self.root_path, 0, max_depth, show_hidden)
            return tree
        except Exception as e:
            return {"error": str(e)}
    
    def _build_tree(self, path, depth, max_depth, show_hidden):
        """Recursively build tree structure"""
        if depth > max_depth:
            return None
        
        try:
            if not path.exists():
                return None
            
            # Skip hidden files/directories if not requested
            if not show_hidden and path.name.startswith('.'):
                return None
            
            node = {
                "name": path.name,
                "path": str(path),
                "type": "directory" if path.is_dir() else "file",
                "size": None
            }
            
            if path.is_file():
                try:
                    node["size"] = path.stat().st_size
                except:
                    node["size"] = 0
            elif path.is_dir():
                children = []
                try:
                    items = sorted(path.iterdir(), key=lambda x: (x.is_file(), x.name.lower()))
                    for item in items:
                        child = self._build_tree(item, depth + 1, max_depth, show_hidden)
                        if child:
                            children.append(child)
                    node["children"] = children
                    node["file_count"] = len([c for c in children if c["type"] == "file"])
                    node["dir_count"] = len([c for c in children if c["type"] == "directory"])
                except PermissionError:
                    node["children"] = []
                    node["error"] = "Permission denied"
            
            return node
            
        except Exception as e:
            return {
                "name": path.name,
                "path": str(path),
                "type": "error",
                "error": str(e)
            }
    
    def get_tree_stats(self, tree):
        """Get statistics about the file tree"""
        if not tree or "error" in tree:
            return {}
        
        stats = {
            "total_files": 0,
            "total_dirs": 0,
            "total_size": 0
        }
        
        def count_items(node):
            if node["type"] == "file":
                stats["total_files"] += 1
                stats["total_size"] += node.get("size", 0)
            elif node["type"] == "directory":
                stats["total_dirs"] += 1
                if "children" in node:
                    for child in node["children"]:
                        count_items(child)
        
        count_items(tree)
        return stats

@app.route('/')
def index():
    """Main page"""
    return render_template('index.html')

@app.route('/api/tree')
def get_tree():
    """API endpoint to get file tree"""
    path = request.args.get('path', '.')
    max_depth = int(request.args.get('max_depth', 5))
    show_hidden = request.args.get('show_hidden', 'false').lower() == 'true'
    
    # Security: ensure path is within current directory
    try:
        abs_path = os.path.abspath(path)
        current_dir = os.path.abspath('.')
        if not abs_path.startswith(current_dir):
            return jsonify({"error": "Access denied: path outside current directory"})
        
        generator = FileTreeGenerator(path)
        tree = generator.generate_tree(max_depth, show_hidden)
        stats = generator.get_tree_stats(tree)
        
        return jsonify({
            "tree": tree,
            "stats": stats,
            "root_path": path
        })
    except Exception as e:
        return jsonify({"error": str(e)})

@app.route('/api/directories')
def get_directories():
    """Get list of directories in current location"""
    try:
        current_dir = '.'
        directories = []
        for item in os.listdir(current_dir):
            if os.path.isdir(item) and not item.startswith('.'):
                directories.append(item)
        
        return jsonify({"directories": sorted(directories)})
    except Exception as e:
        return jsonify({"error": str(e)})

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
