
/* Bytebeat Audio Simple.
   Ejemplo de uso (¡ahora funciona a la primera!):

   let b1 = new Bytebeat('t');
   b1.vol(0.1).pan(-1).code('t/2');

   let b2 = new Bytebeat('t & 66');
   b2.pan(1).vol(0.3).rate(0.8);
*/

let _audioContextBB = null;
let _workletReadyBB = null;

const _processorCode = `
class BytebeatProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.t = 0;
    this.rate = 1;
    this.expressionFn = t => t & 0xFF;
    this.port.onmessage = event => {
      const { cmd, value, expr } = event.data;
      if (cmd === 'expr') {
        try {
          this.expressionFn = new Function('t', \`return (\${expr}) & 0xFF;\`);
        } catch (e) {
          console.error('Bytebeat: expresión inválida', expr, e);
          this.expressionFn = t => 0;
        }
      } else if (cmd === 'rate') {
        this.rate = parseFloat(value);
      } else if (cmd === 'seek') {
        this.t = parseFloat(value);
      }
    };
  }
  process(inputs, outputs, parameters) {
    const output = outputs[0];
    if (!output.length) return true;
    const channel = output[0];
    for (let i = 0; i < channel.length; i++) {
      const val = this.expressionFn(Math.floor(this.t)) - 128;
      channel[i] = val / 128;
      this.t += this.rate;
    }
    return true;
  }
}
registerProcessor('bytebeat-processor', BytebeatProcessor);
`;

function _ensureWorkletLoaded() {
    if (!_audioContextBB) {
        _audioContextBB = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (!_workletReadyBB) {
        const blob = new Blob([_processorCode], { type: 'application/javascript' });
        const url = URL.createObjectURL(blob);
        _workletReadyBB = _audioContextBB.audioWorklet
            .addModule(url)
            .catch(err => {
                console.error("Bytebeat: fallo al cargar worklet", err);
                _workletReadyBB = null; // permite reintentar
                throw err;
            });
    }
    return _workletReadyBB;
}


class Bytebeat {
    constructor(expr, autoPlay = false) {
        _ensureWorkletLoaded();
        this._expr = expr;
        this._active = false;
        this._gain = _audioContextBB.createGain();
        this._panner = new StereoPannerNode(_audioContextBB, { pan: 0 });
        if(autoPlay) { this.play(expr); }
    }

    _createNodes(expr) {
        return _ensureWorkletLoaded().then(() => {
            this._processor = new AudioWorkletNode(_audioContextBB, 'bytebeat-processor');
            this._processor.connect(this._panner);
            this._panner.connect(this._gain);
            this._gain.connect(_audioContextBB.destination);
            this._processor.port.postMessage({ cmd: 'expr', expr });
            this._active = true;
        });
    }

    play(expr) {
        if (expr !== undefined){ this._expr = expr; }
        if (this._active) {
            return this.code(this._expr);
        } else {
            return this._createNodes(this._expr).then(() => this);
        }
    }

    code(expr) {
        if (expr !== undefined){ this._expr = expr; }
        if (this._active) {
            this._processor.port.postMessage({ cmd: 'expr', expr });
        } else {
            this._pendingExpr = this._expr;
        }
        return this;
    }


    vol(v) {
        this._gain.gain.value = Math.max(0, Math.min(1, v));
        return this;
    }

    pan(p) {
        this._panner.pan.value = Math.max(-1, Math.min(1, p));
        return this;
    }

    rate(r) {
        if (this._active) {
            this._processor.port.postMessage({ cmd: 'rate', value: r });
        }
        return this;
    }

    seek(t) {
        if (this._active) {
            this._processor.port.postMessage({ cmd: 'seek', value: t });
        }
        return this;
    }

    stop() {
        if (this._active && this._processor) {
            this._processor.disconnect();
            this._processor = null;
            this._active = false;
        }
        return this;
    }
}
