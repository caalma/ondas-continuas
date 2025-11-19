const WaveX = {

    'harmonicsDuty': (harmonics = 100, duty = 0.25, no_normalization = false) => {
        const real = new Float32Array(harmonics + 1);
        const imag = new Float32Array(harmonics + 1);
        real[0] = 0;
        imag[0] = 0;
        for (let n = 1; n <= harmonics; n++) {
            real[n] = 0;
            imag[n] = (2 / (n * Math.PI)) * Math.sin(n * Math.PI * duty);
        }
	    return {
    	    'real': real,
      	    'imag': imag,
      	    'no_normalization': no_normalization,
        }
    },

    'invertedSawtooth':  (harmonics = 100) => {
        const real = new Float32Array(harmonics + 1).fill(0);
        const imag = new Float32Array(harmonics + 1);
        imag[0] = 0;
        for (let n = 1; n <= harmonics; n++) {
            imag[n] = 2 / (n * Math.PI); // positivo → sube, no baja
        }
        return { real, imag, no_normalization: false };

    },

    'bellishWave': (harmonics = 100) => {
        const real = new Float32Array(harmonics + 1).fill(0);
        const imag = new Float32Array(harmonics + 1).fill(0);
        for (let n = 1; n <= harmonics; n += 2) { // solo impares
            imag[n] = 1 / (n * n); // caída cuadrática → más suave
        }
        return { real, imag, no_normalization: true };
    },

    'harmonicNoise': (harmonics = 200) => {
        const real = new Float32Array(harmonics + 1);
        const imag = new Float32Array(harmonics + 1);
        real[0] = imag[0] = 0;
        for (let n = 1; n <= harmonics; n++) {
            const amp = Math.random() * (1 / n); // más energía en graves
            const phase = Math.random() * 2 * Math.PI;
            real[n] = amp * Math.cos(phase);
            imag[n] = amp * Math.sin(phase);
        }
        return { real, imag, no_normalization: true };
    },

    'arbitraryWave': (func, harmonics = 100, samples = 2048) => {
        // Ej: onda con "picos suaves"
        // const spikeWave = arbitraryWave(t => Math.exp(-50 * Math.pow((t - 0.5 + 1) % 1 - 0.5, 2)));
        const real = new Float32Array(harmonics + 1).fill(0);
        const imag = new Float32Array(harmonics + 1).fill(0);

        // Muestrear la función
        const f = new Float32Array(samples);
        for (let i = 0; i < samples; i++) {
            f[i] = func(i / samples);
        }

        // Calcular coeficientes por DFT simple (lento pero claro)
        for (let n = 1; n <= harmonics; n++) {
            let realSum = 0, imagSum = 0;
            for (let i = 0; i < samples; i++) {
                const t = i / samples;
                const angle = 2 * Math.PI * n * t;
                realSum += f[i] * Math.cos(angle);
                imagSum -= f[i] * Math.sin(angle); // nota el signo
            }
            real[n] = realSum / samples;
            imag[n] = imagSum / samples;
        }

        return { real, imag, no_normalization: false };
    },


    'thueMorseWave': (harmonics = 128) => {
        // Generar secuencia Thue-Morse (0/1) para los primeros N números
        const thue = n => {
            let c = 0;
            while (n) {
                c ^= 1 & n;
                n >>= 1;
            }
            return c;
        };

        const real = new Float32Array(harmonics + 1).fill(0);
        const imag = new Float32Array(harmonics + 1);
        imag[0] = 0;
        for (let n = 1; n <= harmonics; n++) {
            imag[n] = thue(n) ? 1 / n : -1 / n;
        }
        return { real, imag, no_normalization: true };
    }

}
