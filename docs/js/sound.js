const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

class Sound {
    constructor() {
        this.oscillator = null;
        this.gainNode = audioCtx.createGain();
        this.panner = audioCtx.createStereoPanner();
        this.gainNode.connect(this.panner).connect(audioCtx.destination);

        this.params = {
            freq: 440,
            onda: 'sine',
            vol: 0.5,
            pan: 0
        };
    }

    onda(v, customData = null) {
        const basic_waves = ['sine', 'square', 'sawtooth', 'triangle'];

        if (basic_waves.includes(v)){
            this.params.onda = v;
            if (this.oscillator) this.oscillator.type = v;
        } else if (v === 'custom'){
            if (customData !== null){
                const wave = audioCtx.createPeriodicWave(
                    customData.real, customData.imag,
                    { disableNormalization: customData.NoNormalizacion }
                );
                this.oscillator.setPeriodicWave(wave);
                this.params.onda = v;
            }
        }

        return this;
    }

    freq(v, interp = false, interp_seconds = 1) {
        if (interp in EASING){
            fade([this], v,  'freq', interp_seconds * 1000, EASING['interp']);
        }else{
            this.params.freq = v;
            if (this.oscillator) this.oscillator.frequency.setValueAtTime(v, audioCtx.currentTime);
            return this;
        }
    }

    vol(v, interp = false, interp_seconds = 1) {
        if (interp in EASING){
            fade([this], v,  'vol', interp_seconds * 1000, EASING['interp']);
        }else{
            this.params.vol = v;
            this.gainNode.gain.setValueAtTime(v, audioCtx.currentTime);
            return this;
        }
    }

    pan(v, interp = false, interp_seconds = 1) {
        if (interp in EASING){
            fade([this], v,  'pan', interp_seconds * 1000, EASING['interp']);
        }else{
            this.params.pan = v;
            this.panner.pan.setValueAtTime(v, audioCtx.currentTime);
            return this;
        }
    }

    play() {
        if (this.oscillator) {
            this.oscillator.stop();
        }
        this.oscillator = audioCtx.createOscillator();
        this.oscillator.type = this.params.onda;
        this.oscillator.frequency.setValueAtTime(this.params.freq, audioCtx.currentTime);
        this.gainNode.gain.setValueAtTime(this.params.vol, audioCtx.currentTime);
        this.panner.pan.setValueAtTime(this.params.pan, audioCtx.currentTime);
        this.oscillator.connect(this.gainNode);
        this.oscillator.start();
        return this;
    }

    stop() {
        if (this.oscillator) {
            this.oscillator.stop();
            this.oscillator = null;
        }
        return this;
    }
}

// Funciones globales para la API
function freq(f) {
    return new Sound().freq(f);
}

function onda(o) {
    return new Sound().onda(o);
}

function vol(v) {
    return new Sound().vol(v);
}

function pan(p) {
    return new Sound().pan(p);
}
