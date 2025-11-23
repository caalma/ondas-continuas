// Activación de atajos
var shortcutActive = true;

// Mapa interno de atajos registrados
const _shortcutMap = new Map();

// Normaliza y escucha eventos de teclado a nivel global
document.addEventListener('keydown', (e) => {
    const combo = [
        e.ctrlKey ? 'ctrl' : '',
        e.shiftKey ? 'shift' : '',
        e.altKey ? 'alt' : '',
        e.metaKey ? 'meta' : '',
        // Normalizamos la tecla a minúscula y reemplazamos algunos nombres comunes
        e.key.toLowerCase()
            .replace(' ', 'space')
            .replace('arrowup', 'up')
            .replace('arrowdown', 'down')
            .replace('arrowleft', 'left')
            .replace('arrowright', 'right')
            .replace('escape', 'esc')
            .replace('delete', 'del')
            .replace('capslock', 'caps')
    ]
          .filter(Boolean)
          .sort((a, b) => {
              // Orden predecible: ctrl, shift, alt, meta, luego tecla
              const order = { ctrl: 0, shift: 1, alt: 2, meta: 3 };
              return (order[a] ?? 99) - (order[b] ?? 99);
          })
          .join('+');

    const handler = _shortcutMap.get(combo);
    if (handler) {
        if(shortcutActive){
            e.preventDefault();
            handler(e);
        }
    }
});

// Función pública para registrar (o desregistrar) atajos
function sc(shortcut, handler) {
    if (typeof shortcut !== 'string') return;

    // Normalizamos el atajo dado (igual que arriba)
    const parts = shortcut
          .toLowerCase()
          .split('+')
          .map(p => p.trim())
          .filter(Boolean)
          .sort((a, b) => {
              const order = { ctrl: 0, shift: 1, alt: 2, meta: 3 };
              return (order[a] ?? 99) - (order[b] ?? 99);
          });

    if (parts.length === 0) return;

    const combo = parts.join('+');

    if (typeof handler === 'function') {
        _shortcutMap.set(combo, handler);
    } else {
        _shortcutMap.delete(combo); // permite sk('ctrl+4', null) para desactivar
    }
}
