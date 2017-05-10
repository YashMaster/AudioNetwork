// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

var
    DIGIT_BEFORE_THE_DOT = 5,
    DIGIT_AFTER_THE_DOT = 6,
    INITIAL_FREQUENCY = 1500,
    INITIAL_RX_WINDOW_SIZE = 2024,
    INITIAL_TX_AMPLITUDE = 0.01,
    INITIAL_TX_PHASE = 0,
    domLoopbackCheckbox,
    domRxWindowFunctionCheckbox,
    audioMonoIO,
    waveAnalyser,
    waveGenerate,
    txFrequency,
    txAmplitude,
    txPhase,
    rxFrequency,
    rxWindowSize,
    rxSampleCounter = 0;

function init() {
    domLoopbackCheckbox = document.getElementById('loopback-checkbox');
    txFrequency = new EditableFloatWidget(
        document.getElementById('tx-frequency'), INITIAL_FREQUENCY, DIGIT_BEFORE_THE_DOT, DIGIT_AFTER_THE_DOT, onTxFrequencyChange
    );
    txAmplitude = new EditableFloatWidget(
        document.getElementById('tx-amplitude'), INITIAL_TX_AMPLITUDE, DIGIT_BEFORE_THE_DOT, DIGIT_AFTER_THE_DOT, onTxAmplitudeChange
    );
    txPhase = new EditableFloatWidget(
        document.getElementById('tx-phase'), INITIAL_TX_PHASE, DIGIT_BEFORE_THE_DOT, DIGIT_AFTER_THE_DOT, onTxPhaseChange
    );
    rxFrequency = new EditableFloatWidget(
        document.getElementById('rx-frequency'), INITIAL_FREQUENCY, DIGIT_BEFORE_THE_DOT, DIGIT_AFTER_THE_DOT, onRxFrequencyChange
    );
    rxWindowSize = new EditableFloatWidget(
        document.getElementById('rx-window-size'), INITIAL_RX_WINDOW_SIZE, DIGIT_BEFORE_THE_DOT, 0, onRxWindowSizeChange
    );
    domRxWindowFunctionCheckbox = document.getElementById('rx-window-function');

    audioMonoIO = new AudioMonoIO();
    waveAnalyser = new WaveAnalyser(
        getSamplePerPeriod(audioMonoIO.getSampleRate(), rxFrequency.getValue()),
        rxWindowSize.getValue(),
        domRxWindowFunctionCheckbox.checked
    );
    waveGenerate = new WaveGenerate(
        getSamplePerPeriod(audioMonoIO.getSampleRate(), txFrequency.getValue())
    );
    waveGenerate.setAmplitude(txAmplitude.getValue());
    waveGenerate.setUnitPhase(txPhase.getValue());
    
    audioMonoIO.setSampleInHandler(sampleInHandler);
    audioMonoIO.setSampleOutHandler(sampleOutHandler);

    onLoopbackCheckboxChange();
}

function getSamplePerPeriod(samplePerOneCycle, cycle) {
    return samplePerOneCycle / cycle;
}

// -----------------------------------------------------------------------

function onLoopbackCheckboxChange() {
    if (audioMonoIO) {
        audioMonoIO.setLoopback(domLoopbackCheckbox.checked);
    }
}

function onTxFrequencyChange(value) {
    if (waveGenerate) {
        waveGenerate.setSamplePerPeriod(
            getSamplePerPeriod(audioMonoIO.getSampleRate(), value)
        );
    }
}

function onTxAmplitudeChange(value) {
    if (waveGenerate) {
        waveGenerate.setAmplitude(value)
    }
}

function onTxPhaseChange(value) {
    if (waveGenerate) {
        waveGenerate.setUnitPhase(value)
    }
}

function onRxFrequencyChange(value) {
    if (waveAnalyser) {
        waveAnalyser.setSamplePerPeriod(
            getSamplePerPeriod(audioMonoIO.getSampleRate(), value)
        );
    }
}

function onRxWindowSizeChange(value) {
    if (waveAnalyser) {
        waveAnalyser.setWindowSize(value);
    }
}

function onRxWindowFunctionChange() {
    waveAnalyser.setWindowFunction(
        domRxWindowFunctionCheckbox.checked
    );
}

// ------------------------

function sampleOutHandler(monoOut) {
    var i, sample;

    for (i = 0; i < monoOut.length; i++) {
        sample = waveGenerate.getSample();
        waveGenerate.nextSample();

        monoOut[i] = sample;
    }
}

function sampleInHandler(monoIn) {
    var i, sample;

    // waveAnalyser.setWindowFunction();
    for (i = 0; i < monoIn.length; i++) {
        sample = monoIn[i];
        waveAnalyser.handle(sample);
        rxSampleCounter++;

        if (rxSampleCounter % rxWindowSize.getValue() === 0) {
            var log =
                'Amplitude: ' + waveAnalyser.getAmplitude().toFixed(6) + '<br/>' +
                'Phase: ' + waveAnalyser.getUnitPhase().toFixed(3) + '<br/>' +
                'Decibel: ' + waveAnalyser.getDecibel().toFixed(3);

            document.getElementById('log').innerHTML = log;
        }
    }

}
