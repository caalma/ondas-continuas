from flask import Flask, request, send_from_directory, jsonify, render_template_string
import os
import yaml
import sys

app = Flask(__name__, static_folder=None)

# --- Cargar Configuración ---
APP_PATH = os.path.dirname(os.path.abspath(__file__))

CONFIG_FILE = 'cfg.yml'
if len(sys.argv) == 2:
    CONFIG_FILE = sys.argv[1]

CONFIG_PATH = os.path.join(APP_PATH, CONFIG_FILE)
with open(CONFIG_PATH, 'r') as f:
    config = yaml.safe_load(f)

SERVER_CONFIG = config.get('server', {})
EDITOR_CONFIG = config.get('editor', {})
HOST = SERVER_CONFIG.get('host', '127.0.0.1')
PORT = SERVER_CONFIG.get('port', 5000)

# Directorio para guardar los scripts
SCRIPTS_DIR = os.path.join(APP_PATH, config.get('scripts_dir', 'scripts'))
if not os.path.exists(SCRIPTS_DIR):
    os.makedirs(SCRIPTS_DIR)

INITIAL_SCRIPT = config.get('script_init', 'inicial.js')


# API para obtener la configuración del editor
@app.route('/config')
def get_config():
    return jsonify(EDITOR_CONFIG)

# Servir archivos estáticos (HTML, CSS, JS)
@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory(os.path.dirname(os.path.abspath(__file__)), path)

@app.route('/')
def serve_index():
    index_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'templates/index.html')
    try:
        with open(index_path, 'r', encoding='utf-8') as f:
            template_content = f.read()
        return render_template_string(template_content, initialscript=INITIAL_SCRIPT)
    except FileNotFoundError:
        return "index.html no encontrado", 404


# API para guardar código
@app.route('/save', methods=['POST'])
def save_script():
    data = request.get_json()
    if not data or 'filename' not in data or 'content' not in data:
        return jsonify({'status': 'error', 'message': 'Datos inválidos'}), 400

    filename = data['filename']
    # Sanitize filename to prevent directory traversal
    if '..' in filename or filename.startswith('/'):
        return jsonify({'status': 'error', 'message': 'Nombre de archivo no válido'}), 400

    filepath = os.path.join(SCRIPTS_DIR, filename)
    try:
        with open(filepath, 'w') as f:
            f.write(data['content'])
        return jsonify({'status': 'success', 'message': f'Archivo guardado como {filename}'})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

# API para cargar código
@app.route('/load/<path:filename>')
def load_script(filename):
    # Sanitize filename
    if '..' in filename or filename.startswith('/'):
        return jsonify({'status': 'error', 'message': 'Nombre de archivo no válido'}), 400

    filepath = os.path.join(SCRIPTS_DIR, filename)
    if not os.path.exists(filepath):
        return jsonify({'status': 'error', 'message': 'El archivo no existe'}), 404

    try:
        with open(filepath, 'r') as f:
            content = f.read()
        return jsonify({'status': 'success', 'content': content})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

if __name__ == '__main__':
    print(f"Servidor Flask iniciado en http://{HOST}:{PORT}")
    print(f"Sirviendo archivos desde: {os.path.dirname(os.path.abspath(__file__))}")
    print(f"Guardando y cargando scripts desde: {SCRIPTS_DIR}")
    app.run(debug=True, host=HOST, port=PORT)
