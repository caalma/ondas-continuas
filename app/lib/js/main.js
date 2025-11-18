window.onload = async () => {
    const statusMessage = document.getElementById('status-message');
    const themeSelector = document.getElementById('theme-selector');
    const themeLink = document.getElementById('theme-link');

    let editor;

    function setStatus(message, isError = false) {
        statusMessage.textContent = message;
        statusMessage.style.color = isError ? '#ff8a8a' : '#888';
    }

    function loadTheme(themeName) {
        // Set the CodeMirror theme option
        editor.setOption('theme', themeName);

        // Load the theme's CSS file
        // Handle themes that are built-in (like 'default') vs ones that need a CSS file
        if (themeName !== 'default') {
            //themeLink.href = `https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.5/theme/${themeName}.min.css`;
            themeLink.href = `/lib/extra/codemirror/theme/${themeName}.min.css`;
        } else {
            // themeLink.href = 'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.5/codemirror.min.css';
            themeLink.href = '/lib/extra/codemirror/codemirror.min.css';
        }
        setStatus(`Tema cambiado a: ${themeName}`);
    }

    // --- Inicialización ---
    try {
        // 1. Cargar configuración del servidor
        const response = await fetch('/config');
        const config = await response.json();
        const { themes, default_theme } = config;

        // 2. Inicializar el editor
        editor = CodeMirror.fromTextArea(document.getElementById('code-editor'), {
            lineNumbers: true,
            mode: 'javascript',
            theme: default_theme || 'seti',
            lineWrapping: false,
            extraKeys: {
                'Ctrl-Enter': cm => evaluateCode(cm.getValue()),
                'Alt-Enter': cm => evaluateBlock(cm),
                'Alt-W': toggleLineWrapping
            }
        });

        // 3. Poblar el selector de temas
        themes.forEach(theme => {
            const option = document.createElement('option');
            option.value = theme;
            option.textContent = theme;
            themeSelector.appendChild(option);
        });

        // 4. Establecer tema inicial
        themeSelector.value = default_theme;
        loadTheme(default_theme);

        // 5. Añadir listener para cambio de tema
        themeSelector.addEventListener('change', (e) => {
            loadTheme(e.target.value);
        });

        editor.setValue('// OndasContinuas');
        editor.focus();
        setStatus('Listo. Configuración cargada.');

    } catch (error) {
        setStatus(`Error al inicializar: ${error.message}`, true);
        console.error("Error fetching or applying config:", error);
    }


    function cleanupAndExecute(code) {
        const varRegex = /(?:var|let|const)\s+([a-zA-Z0-9_]+)\s*=/g;
        let match;
        while ((match = varRegex.exec(code)) !== null) {
            const varName = match[1];
            if (window[varName] && typeof window[varName].stop === 'function') {
                console.log(`Deteniendo instancia previa de '${varName}'`);
                window[varName].stop();
            }
        }

        try {
            eval.call(window, code);
            return { success: true };
        } catch (e) {
            console.error(e);
            return { success: false, message: e.message };
        }
    }

    function evaluateCode(code) {
        const result = cleanupAndExecute(code);
        if (result.success) {
            setStatus('Código ejecutado correctamente.');
        } else {
            setStatus(`Error: ${result.message}`, true);
        }
    }

    function evaluateBlock(cm) {
        const cursor = cm.getCursor();
        let startLine = cursor.line;
        let endLine = cursor.line;

        while (startLine > 0 && cm.getLine(startLine - 1).trim() !== '') {
            startLine--;
        }
        while (endLine < cm.lineCount() - 1 && cm.getLine(endLine + 1).trim() !== '') {
            endLine++;
        }

        const block = cm.getRange({ line: startLine, ch: 0 }, { line: endLine, ch: cm.getLine(endLine).length });
        const result = cleanupAndExecute(block);

        if (result.success) {
            setStatus('Bloque ejecutado correctamente.');
        } else {
            setStatus(`Error: ${result.message}`, true);
        }
    }

    function toggleLineWrapping(cm) {
        cm.setOption('lineWrapping', !cm.getOption('lineWrapping'));
        const wrapping = cm.getOption('lineWrapping') ? 'activado' : 'desactivado';
        setStatus(`Ajuste de línea: ${wrapping}`);
    }

    async function exportCode(filename) {
        const content = editor.getValue();
        try {
            const response = await fetch('/save', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ filename, content }),
            });
            const result = await response.json();
            if (result.status === 'success') {
                setStatus(result.message);
            } else {
                setStatus(result.message, true);
            }
        } catch (e) {
            setStatus(`Error al guardar: ${e.message}`, true);
        }
    }

    async function importCode(filename) {
        try {
            const response = await fetch(`/load/${filename}`);
            const result = await response.json();
            if (result.status === 'success') {
                editor.setValue(result.content);
                setStatus(`Archivo '${filename}' cargado.`);
            } else {
                setStatus(result.message, true);
            }
        } catch (e) {
            setStatus(`Error al cargar: ${e.message}`, true);
        }
    }

    // Exponer funciones al scope global
    window.exportCode = exportCode;
    window.importCode = importCode;

    importCode(initialScript);
};
