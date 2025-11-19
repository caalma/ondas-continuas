function note2freq(note) {
    const match = note.trim().match(/^([A-G])([#b]?)(-?\d+)$/i);
    if (!match) {
        throw new Error(`Formato de nota inválido: ${note}`);
    }

    const noteName = match[1].toUpperCase();
    const accidental = match[2];
    const octave = parseInt(match[3], 10);

    // Número de semitonos respecto a C (en la misma octava)
    const noteSemitones = {'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11};

    let semitones = noteSemitones[noteName];
    if (accidental === '#') semitones += 1;
    else if (accidental === 'b') semitones -= 1;

    // Calcular la nota MIDI (C-1 = 0, C4 = 60, A4 = 69)
    const midiNote = 12 * (octave + 1) + semitones;

    // A4 = 69 → 440 Hz
    const a4Midi = 69;
    const a4Freq = 440;

    const frequency = a4Freq * Math.pow(2, (midiNote - a4Midi) / 12);
    return frequency;
}



function freq2note(frequency, useCents = false) {
    if (frequency <= 0) {
        throw new Error("La frecuencia debe ser un número positivo.");
    }

    const a4Freq = 440;
    const a4Midi = 69;

    // Número MIDI continuo
    const midiNote = 12 * Math.log2(frequency / a4Freq) + a4Midi;

    // Nota más cercana (entera)
    const midiRounded = Math.round(midiNote);

    // Nombre de la nota
    const noteIndex = ((midiRounded % 12) + 12) % 12;
    const octave = Math.floor(midiRounded / 12) - 1;
    const noteNames = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
    const noteName = noteNames[noteIndex];

    // Frecuencia afinada exacta de esa nota
    const exactFreq = a4Freq * Math.pow(2, (midiRounded - a4Midi) / 12);

    // Desviación en Hz
    let deviation = frequency - exactFreq;

    if (useCents){
        deviation = (midiNote - midiRounded) * 100; // 1 semitono = 100 cents
    }

    return [noteName + octave, deviation];
}
