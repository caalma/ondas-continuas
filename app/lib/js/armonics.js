
const armonicos = (f, N) => Array.from({ length: N }, (_, i) => (i + 1) * f);


const armonicosinversos = (f, N) => Array.from({ length: N }, (_, i) => f / (i + 1));



function armonicosPro(
    frecuencia,
    cantidad = 10,
    opciones = {}
) {
    const defaults = {
        direccion: "arriba",        // "arriba" → armónicos | "abajo" → subarmónicos | "ambos"
        incluirFundamental: true,   // solo aplica cuando direccion = "arriba"
        soloImpares: false,         // solo armónicos impares (cuadrada, clarinete...)
        amplitud: "1/n",            // "plana" | "1/n" | "1/n^2" | "ninguna" (solo frecuencias)
        redondearFreq: 3,           // decimales para frecuencia, false = sin redondear
        redondearAmp: 4,            // decimales para amplitud
        toleranciaDivisor: 0.5      // para subarmónicos: cuán "entero" debe ser el divisor
    };

    const o = { ...defaults, ...opciones };

    const resultados = [];

    // ── ARMÓNICOS HACIA ARRIBA ─────────────────────────────────────
    if (o.direccion === "arriba" || o.direccion === "ambos") {
        let inicio = o.incluirFundamental ? 1 : 2;
        let paso = o.soloImpares ? 2 : 1;
        let contador = 0;
        let n = inicio;

        while (contador < cantidad) {
            const freq = frecuencia * n;
            const item = { orden: n, frecuencia: freq };

            // Amplitud
            if (o.amplitud !== "ninguna") {
                let amp;
                if (o.amplitud === "plana") amp = 1;
                else if (o.amplitud === "1/n^2") amp = 1 / (n * n);
                else amp = 1 / n; // "1/n"

                item.amplitud = o.redondearAmp ? Number(amp.toFixed(o.redondearAmp)) : amp;
            }

            // Redondeo de frecuencia
            item.frecuencia = o.redondearFreq !== false
                ? Number(item.frecuencia.toFixed(o.redondearFreq))
                : item.frecuencia;

            resultados.push(item);
            n += paso;
            contador++;
        }
    }

    // ── SUBARMÓNICOS (DIVISORES) HACIA ABAJO ───────────────────────
    if (o.direccion === "abajo" || o.direccion === "ambos") {
        let encontrados = 0;
        for (let divisor = 2; encontrados < cantidad; divisor++) {
            const freqSub = frecuencia / divisor;
            const producto = freqSub * divisor;

            // ¿Es casi exacto? (para evitar floats feos como 439.99)
            if (Math.abs(producto - frecuencia) <= o.toleranciaDivisor) {
                const item = {
                    orden: divisor,
                    frecuencia: o.redondearFreq !== false
                        ? Number(freqSub.toFixed(o.redondearFreq))
                        : freqSub,
                    razon: `${frecuencia} ÷ ${divisor}`
                };
                if (o.amplitud !== "ninguna") {
                    // En subarmónicos la amplitud suele ser más alta cuanto más grave
                    const amp = o.amplitud === "plana" ? 1 : divisor / 2;
                    item.amplitud = o.redondearAmp ? Number(amp.toFixed(o.redondearAmp)) : amp;
                }
                resultados.push(item);
                encontrados++;
            }
        }
    }

    return resultados;
}
