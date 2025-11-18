// Ctrl+Enter: Ejecutar todo
// Alt+Enter: Ejecutar bloque
// Alt-W: Ajuste de línea

// --- Ejemplo Básico ---
var s1 = freq(220).onda('sine').vol(0.3);
s1.play();


// --- Guardar y Cargar ---
if (false){

    var arc = 'inicial.js';
    exportCode(arc);

    importCode(arc);

}
