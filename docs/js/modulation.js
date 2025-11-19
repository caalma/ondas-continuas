function freqMod(carrierFreq = 220, modFreq = 10, index = 1, vol = 0.3, pan = 0) {
    const carrier = audioCtx.createOscillator();
    const modulator = audioCtx.createOscillator();
    const modGain = audioCtx.createGain();
    const outputGain = audioCtx.createGain();
    const panner = audioCtx.createStereoPanner();

    carrier.type = 'sine';
    modulator.type = 'sine';
    carrier.frequency.value = carrierFreq;
    modulator.frequency.value = modFreq;
    panner.pan.value = pan;
    outputGain.gain.value = vol;
    modGain.gain.value = index * carrierFreq;

    modulator.connect(modGain);
    modGain.connect(carrier.frequency);
    carrier.connect(outputGain);
    outputGain.connect(panner);
    outputGain.connect(audioCtx.destination);

    const startTime = audioCtx.currentTime;
    carrier.start(startTime);
    modulator.start(startTime);

    let isRunning = true;

    return {
        play: function() {
            if (!isRunning) {
                console.warn('Cannot restart stopped FM oscillator. Creating new one.');
                return fm(carrierFreq, modFreq, index, vol);
            }
            return this;
        },
        stop: function() {
            if (isRunning) {
                const stopTime = audioCtx.currentTime + 0.01;
                outputGain.gain.setValueAtTime(outputGain.gain.value, audioCtx.currentTime);
                outputGain.gain.exponentialRampToValueAtTime(0.001, stopTime);
                // Paramos los osciladores después del fade
                setTimeout(() => {
                    carrier.stop();
                    modulator.stop();
                }, 10);

                isRunning = false;
            }
            return this;
        },
        carrierFreq: function(v) {
            carrier.frequency.setValueAtTime(v, audioCtx.currentTime);
            modGain.gain.setValueAtTime(index * v, audioCtx.currentTime);
            carrierFreq = v;
            return this;
        },
        modFreq: function(v) {
            modulator.frequency.setValueAtTime(v, audioCtx.currentTime);
            modFreq = v;
            return this;
        },
        index: function(v) {
            index = v;
            modGain.gain.setValueAtTime(v * carrierFreq, audioCtx.currentTime);
            return this;
        },
        vol: function(v) {
            outputGain.gain.setValueAtTime(v, audioCtx.currentTime);
            vol = v;
            return this;
        },
        freq: function(v) {
            this.carrierFreq(v);
            return this;
        },
        onda: function(type) {
            carrier.type = type;
            modulator.type = 'sine';
            return this;
        },
        pan: function(v) {
            v = Math.max(-1, Math.min(1, v));
            panner.pan.setValueAtTime(v, audioCtx.currentTime);
            pan = v;
            return this;
        }
    };
}


function ringMod(f1 = 220, f2 = 223, vol = 0.3, pan = 0) {
    const osc1 = freq(f1).onda('sine').vol(0.1);
    const osc2 = freq(f2).onda('sine').vol(0.1);
    const merger = audioCtx.createGain();
    const modulator = audioCtx.createGain();
    const panner = audioCtx.createStereoPanner();
    const outputGain = audioCtx.createGain();
    outputGain.gain.value = vol;

    osc1.gainNode.connect(modulator);
    osc2.gainNode.connect(modulator.gain);
    modulator.connect(outputGain);
    outputGain.connect(panner);
    panner.connect(audioCtx.destination);

    osc1.play();
    osc2.play();

    return {
        play: function() {
            osc1.play();
            osc2.play();
            return this;
        },
        stop: function() {
            osc1.stop();
            osc2.stop();
            return this;
        },
        freq: function(v1, v2) {
            if (v2 === undefined) { v2 = v1 * 1.01; }
            osc1.freq(v1);
            osc2.freq(v2);
            return this;
        },
        vol: function(v) {
            outputGain.gain.value = v;
            return this;
        },
        pan: function(v) {
            v = Math.max(-1, Math.min(1, v));
            panner.pan.value = v;
            return this;
        },
        onda: function(v1, v2) {
            if (v2 === undefined) { v2 = v1; }
            osc1.onda(v1);
            osc2.onda(v2);
            return this;
        }
    };
}
