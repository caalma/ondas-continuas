
/* Bytebeat Audio Simple.
   Ejemplo de uso (¡ahora funciona a la primera!):

   let b1 = new Bytebeat('t');
   b1.vol(0.1).pan(-1).code('t/2');

   let b2 = new Bytebeat('t 66 &');
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

function _infix2rpn(expr) {
    // Tokenizamos la expresión
    const tokens = expr
          .replace(/\s+/g, '')                    // quitamos espacios
          .match(/(\|\||&&|>>>|>>|<<|[&|^+*/%~()<>!-])|[a-zA-Z_]\w*|\d+/g) || [];

    const output = [];
    const stack = [];

    const precedence = {
        '||' : 1,
        '&&' : 2,
        '|'  : 3,
        '^'  : 4,
        '&'  : 5,
        '<<' : 6, '>>' : 6, '>>>' : 6,
        '+'  : 7, '-'  : 7,
        '*'  : 8, '/'  : 8, '%'  : 8,
        '~'  : 9,                     // unario, alta precedencia
        '!'  : 9                      // por si usas negación lógica
    };

    const isLeftAssociative = op => op !== '~' && op !== '!';

    for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];

        // Es número o variable (t)
        if (/^\d+$/.test(token) || /^[a-zA-Z_]\w*$/.test(token)) {
            output.push(token);
            continue;
        }

        // Paréntesis de apertura
        if (token === '(') {
            stack.push(token);
            continue;
        }

        // Paréntesis de cierre
        if (token === ')') {
            while (stack.length && stack[stack.length - 1] !== '(') {
                output.push(stack.pop());
            }
            stack.pop(); // sacamos el '('
            continue;
        }

        // Operador
        if (precedence.hasOwnProperty(token)) {
            // Manejo especial del unario ~
            if (token === '~' || token === '!') {
                // si es el primer token o viene después de otro operador o paréntesis de apertura
                const isUnary = i === 0 ||
                      precedence.hasOwnProperty(tokens[i-1]) ||
                      tokens[i-1] === '(';
                if (isUnary) {
                    stack.push(token);   // lo tratamos como operador unario de alta precedencia
                    continue;
                }
            }

            while (
                stack.length &&
                    stack[stack.length - 1] !== '(' &&
                    (
                        precedence[stack[stack.length - 1]] > precedence[token] ||
                            (precedence[stack[stack.length - 1]] === precedence[token] && isLeftAssociative(token))
                    )
            ) {
                output.push(stack.pop());
            }
            stack.push(token);
        }
    }

    // Vaciamos la pila restante
    while (stack.length) {
        output.push(stack.pop());
    }

    return output.join(' ');
}


function _rpn2infix(rpn) {
    // Acepta string separado por espacios o ya un array
    const tokens = typeof rpn === 'string' ? rpn.trim().split(/\s+/) : rpn.slice();
    const stack = [];

    const isOperator = tok =>
          !!tok.match(/^(&&|\|\||>>>|>>|<<|[&|^+*/%!~=-])$/);

    for (const token of tokens) {
        if (isOperator(token)) {
            // Operadores unarios
            if (token === '~' || token === '!') {
                const a = stack.pop();
                stack.push(`${token}${a}`);           // ~t  o  !t
                continue;
            }

            // Operadores binarios
            const b = stack.pop();
            const a = stack.pop();

            let expr;
            switch (token) {
            case '+': case '-': case '*': case '/': case '%':
            case '&': case '|': case '^':
            case '<<': case '>>': case '>>>':
                // Le damos paréntesis a todo para que sea 100% inequívoco
                expr = `(${a}${token}${b})`;
                break;

                // Operadores con nombres más largos (opcional, podés dejarlos como símbolos)
            case '&&': expr = `(${a} && ${b})`; break;
            case '||': expr = `(${a} || ${b})`; break;

            default:
                expr = `(${a}${token}${b})`;
            }
            stack.push(expr);
        } else {
            // Operando (número o variable)
            stack.push(token);
        }
    }

    // Al final queda una sola expresión en la pila
    return stack[0];
}




class Bytebeat {
    constructor(expr='', modeRpn = true, autoPlay = false, rate = 8000) {
        _ensureWorkletLoaded();
        this._mode_rpn = modeRpn;
        this._setExpr(expr)
        this._active = false;
        this._gain = _audioContextBB.createGain();
        this._panner = new StereoPannerNode(_audioContextBB, { pan: 0 });
        this.rate(rate);
        if(autoPlay) { this.play(); }
    }

    _createNodes() {
        return _ensureWorkletLoaded().then(() => {
            this._processor = new AudioWorkletNode(_audioContextBB, 'bytebeat-processor');
            this._processor.connect(this._panner);
            this._panner.connect(this._gain);
            this._gain.connect(_audioContextBB.destination);
            this._processor.port.postMessage({ cmd: 'expr', expr: this._expr });
            this._processor.port.postMessage({ cmd: 'rate', value: this._rate });
            this._active = true;
        });
    }

    _setExpr(expr) {
        if (expr !== undefined){
            this._expr = this._mode_rpn ? _rpn2infix(expr) : expr;
        }
    }

    play(expr) {
        this._setExpr(expr);
        if (this._active) {
            return this.code(this._expr);
        } else {
            return this._createNodes().then(() => this);
        }
    }

    code(expr) {
        this._setExpr(expr);
        if (this._active) {
            let dat = { cmd: 'expr', expr: this._expr };
            this._processor.port.postMessage(dat);
        } else {
            this._pendingExpr = this._expr;
        }
        return this;
    }


    vol(v=0.8) {
        this._gain.gain.value = Math.max(0, Math.min(1, v));
        return this;
    }

    pan(v=0) {
        this._panner.pan.value = Math.max(-1, Math.min(1, v));
        return this;
    }

    rate(v=8000) {
        this._rate = v / 44100;
        if (this._active) {
            this._processor.port.postMessage({ cmd: 'rate', value: this._rate });
        }
        return this;
    }

    seek(v=0) {
        if (this._active) {
            this._processor.port.postMessage({ cmd: 'seek', value: v });
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
