/**
 * drumSounds.js - Web Audio API drum synthesizer
 * Each function creates oscillator/noise nodes for a specific drum sound.
 * All functions share the signature: (ctx, now, gainNode)
 *   ctx      = AudioContext
 *   now      = ctx.currentTime (schedule start)
 *   gainNode = shared GainNode for volume control
 */

/** Kick drum — sine wave with rapid frequency sweep */
export const playKick = (ctx, now, gainNode) => {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(gainNode);
  
  osc.type = 'sine';
  osc.frequency.setValueAtTime(180, now);
  osc.frequency.exponentialRampToValueAtTime(0.01, now + 0.6);
  gain.gain.setValueAtTime(1, now);
  gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);
  
  osc.start(now);
  osc.stop(now + 0.6);
};

/** Snare — bit-crushed noise through highpass filter */
export const playSnare = (ctx, now, gainNode) => {
  const noise = ctx.createBufferSource();
  const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 0.15, ctx.sampleRate);
  const output = noiseBuffer.getChannelData(0);
  
  const bitDepth = 4;
  for (let i = 0; i < noiseBuffer.length; i++) {
    const random = Math.random() * 2 - 1;
    output[i] = Math.round(random * bitDepth) / bitDepth;
  }
  noise.buffer = noiseBuffer;
  
  const filter = ctx.createBiquadFilter();
  filter.type = 'highpass';
  filter.frequency.value = 5000;
  
  const gain = ctx.createGain();
  noise.connect(filter);
  filter.connect(gain);
  gain.connect(gainNode);
  
  gain.gain.setValueAtTime(0.9, now);
  gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
  
  noise.start(now);
  noise.stop(now + 0.15);
};

/** Hi-hat — short noise burst with highpass sweep */
export const playHiHat = (ctx, now, gainNode) => {
  const noise = ctx.createBufferSource();
  const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 0.08, ctx.sampleRate);
  const output = noiseBuffer.getChannelData(0);
  
  for (let i = 0; i < noiseBuffer.length; i++) {
    output[i] = Math.random() * 2 - 1;
  }
  noise.buffer = noiseBuffer;
  
  const filter = ctx.createBiquadFilter();
  filter.type = 'highpass';
  filter.frequency.setValueAtTime(10000, now);
  filter.frequency.exponentialRampToValueAtTime(7000, now + 0.08);
  
  const gain = ctx.createGain();
  noise.connect(filter);
  filter.connect(gain);
  gain.connect(gainNode);
  
  gain.gain.setValueAtTime(0.6, now);
  gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
  
  noise.start(now);
  noise.stop(now + 0.08);
};

/** Clap — bit-crushed noise, no filter */
export const playClap = (ctx, now, gainNode) => {
  const noise = ctx.createBufferSource();
  const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 0.12, ctx.sampleRate);
  const output = noiseBuffer.getChannelData(0);
  
  const bitDepth = 3;
  for (let i = 0; i < noiseBuffer.length; i++) {
    const random = Math.random() * 2 - 1;
    output[i] = Math.round(random * bitDepth) / bitDepth;
  }
  noise.buffer = noiseBuffer;
  
  const gain = ctx.createGain();
  noise.connect(gain);
  gain.connect(gainNode);
  
  gain.gain.setValueAtTime(1, now);
  gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
  
  noise.start(now);
  noise.stop(now + 0.12);
};

/** Tom — triangle wave with frequency drop */
export const playTom = (ctx, now, gainNode) => {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(gainNode);
  
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(500, now);
  osc.frequency.exponentialRampToValueAtTime(120, now + 0.12);
  gain.gain.setValueAtTime(0.7, now);
  gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
  
  osc.start(now);
  osc.stop(now + 0.12);
};

/** Cowbell — two detuned square waves */
export const playCowbell = (ctx, now, gainNode) => {
  const osc1 = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  const gain = ctx.createGain();
  
  osc1.type = 'square';
  osc2.type = 'square';
  
  osc1.frequency.setValueAtTime(700, now);
  osc2.frequency.setValueAtTime(1100, now);
  
  osc1.connect(gain);
  osc2.connect(gain);
  gain.connect(gainNode);
  
  gain.gain.setValueAtTime(0.5, now);
  gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
  
  osc1.start(now);
  osc2.start(now);
  osc1.stop(now + 0.25);
  osc2.stop(now + 0.25);
};

/** Blip — very short sine ping */
export const playBlip = (ctx, now, gainNode) => {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(gainNode);
  
  osc.type = 'sine';
  osc.frequency.setValueAtTime(800, now);
  gain.gain.setValueAtTime(0.8, now);
  gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
  
  osc.start(now);
  osc.stop(now + 0.05);
};

/** Perc — square wave with pitch drop */
export const playPerc = (ctx, now, gainNode) => {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(gainNode);
  
  osc.type = 'square';
  osc.frequency.setValueAtTime(220, now);
  osc.frequency.exponentialRampToValueAtTime(50, now + 0.1);
  gain.gain.setValueAtTime(0.7, now);
  gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
  
  osc.start(now);
  osc.stop(now + 0.1);
};

/** Sweep — sine wave rising then falling */
export const playSweep = (ctx, now, gainNode) => {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(gainNode);
  
  osc.type = 'sine';
  osc.frequency.setValueAtTime(100, now);
  osc.frequency.exponentialRampToValueAtTime(400, now + 0.08);
  osc.frequency.exponentialRampToValueAtTime(50, now + 0.15);
  gain.gain.setValueAtTime(0.6, now);
  gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
  
  osc.start(now);
  osc.stop(now + 0.15);
};

/** Buzz — square wave with LFO frequency modulation */
export const playBuzz = (ctx, now, gainNode) => {
  const osc = ctx.createOscillator();
  const modOsc = ctx.createOscillator();
  const gain = ctx.createGain();
  const modGain = ctx.createGain();
  
  modOsc.frequency.setValueAtTime(5, now);
  modGain.gain.setValueAtTime(20, now);
  
  modOsc.connect(modGain);
  modGain.connect(osc.frequency);
  
  osc.type = 'square';
  osc.frequency.setValueAtTime(150, now);
  osc.connect(gain);
  gain.connect(gainNode);
  
  gain.gain.setValueAtTime(0.6, now);
  gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
  
  osc.start(now);
  modOsc.start(now);
  osc.stop(now + 0.2);
  modOsc.stop(now + 0.2);
};

/** Pluck — triangle wave through bandpass filter */
export const playPluck = (ctx, now, gainNode) => {
  const osc = ctx.createOscillator();
  const filter = ctx.createBiquadFilter();
  const gain = ctx.createGain();
  
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(300, now);
  osc.connect(filter);
  
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(800, now);
  filter.Q.setValueAtTime(8, now);
  filter.connect(gain);
  gain.connect(gainNode);
  
  gain.gain.setValueAtTime(0.5, now);
  gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
  
  osc.start(now);
  osc.stop(now + 0.25);
};

/** Bass — low square wave with slow decay */
export const playBass = (ctx, now, gainNode) => {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(gainNode);
  
  osc.type = 'square';
  osc.frequency.setValueAtTime(55, now);
  osc.frequency.exponentialRampToValueAtTime(30, now + 0.3);
  gain.gain.setValueAtTime(0.8, now);
  gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
  
  osc.start(now);
  osc.stop(now + 0.3);
};

/** Chime — three layered harmonics (440/880/1320 Hz) */
export const playChime = (ctx, now, gainNode) => {
  const frequencies = [440, 880, 1320];
  
  frequencies.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(gainNode);
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);
    gain.gain.setValueAtTime(0.3 / (idx + 1), now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
    
    osc.start(now);
    osc.stop(now + 0.4);
  });
};

/** Zap — sawtooth with fast downward sweep */
export const playZap = (ctx, now, gainNode) => {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(gainNode);
  
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(1200, now);
  osc.frequency.exponentialRampToValueAtTime(50, now + 0.1);
  gain.gain.setValueAtTime(0.5, now);
  gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
  
  osc.start(now);
  osc.stop(now + 0.1);
};

// Name → function lookup for dynamic dispatch
export const SOUND_FUNCTIONS = {
  Kick: playKick,
  Snare: playSnare,
  HiHat: playHiHat,
  Clap: playClap,
  Tom: playTom,
  Cowbell: playCowbell,
  Blip: playBlip,
  Perc: playPerc,
  Sweep: playSweep,
  Buzz: playBuzz,
  Pluck: playPluck,
  Bass: playBass,
  Chime: playChime,
  Zap: playZap
};

// Pad layout: id, keyboard shortcut, original sample URL (unused — sounds are synthesized)
export const PADS = [
  { id: 'Kick', key: 'Q', url: '/drums/kick.wav' },
  { id: 'Snare', key: 'W', url: '/drums/snare.wav' },
  { id: 'HiHat', key: 'E', url: '/drums/hihat.wav' },
  { id: 'Clap', key: 'A', url: '/drums/clap.wav' },
  { id: 'Tom', key: 'S', url: '/drums/tom.wav' },
  { id: 'Cowbell', key: 'D', url: '/drums/cowbell.wav' },
  { id: 'Blip', key: '1', url: '/drums/blip.wav' },
  { id: 'Perc', key: '2', url: '/drums/perc.wav' },
  { id: 'Sweep', key: '3', url: '/drums/sweep.wav' },
  { id: 'Buzz', key: '4', url: '/drums/buzz.wav' },
  { id: 'Pluck', key: '5', url: '/drums/pluck.wav' },
  { id: 'Bass', key: '6', url: '/drums/bass.wav' },
  { id: 'Chime', key: '7', url: '/drums/chime.wav' },
  { id: 'Zap', key: '8', url: '/drums/zap.wav' },
];
