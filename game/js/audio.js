// MOTHLIGHT sound: everything is synthesized with WebAudio, no audio files.
// Footsteps tell you where a Warden is; a rising hum warns you are being seen.

export function createAudio() {
  const audio = {
    ctx: null,
    muted: false,
    master: null,
    stepTimer: 0,
    guardStepTimer: 0,
    humNodes: null,
  };

  function ensureContext() {
    if (audio.ctx) return audio.ctx;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    audio.ctx = new AC();
    audio.master = audio.ctx.createGain();
    audio.master.gain.value = 0.5;
    audio.master.connect(audio.ctx.destination);
    return audio.ctx;
  }

  // Short filtered noise burst: a footstep on wooden floor.
  function stepSound(volume, pitch) {
    const ctx = ensureContext();
    if (!ctx || audio.muted) return;
    const dur = 0.07;
    const buffer = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
    }
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = pitch;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    src.connect(filter).connect(gain).connect(audio.master);
    src.start();
  }

  // A soft two-note chime when an ember is stolen.
  function chime() {
    const ctx = ensureContext();
    if (!ctx || audio.muted) return;
    [880, 1318.5].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const gain = ctx.createGain();
      const t0 = ctx.currentTime + i * 0.09;
      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.exponentialRampToValueAtTime(0.22, t0 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.5);
      osc.connect(gain).connect(audio.master);
      osc.start(t0);
      osc.stop(t0 + 0.55);
    });
  }

  // A low alarm sting when the alarm trips.
  function alarmSting() {
    const ctx = ensureContext();
    if (!ctx || audio.muted) return;
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(440, ctx.currentTime + 0.35);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.16, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
    osc.connect(gain).connect(audio.master);
    osc.start();
    osc.stop(ctx.currentTime + 0.65);
  }

  // A breathy puff when a lantern is snuffed.
  function snuffPuff() {
    const ctx = ensureContext();
    if (!ctx || audio.muted) return;
    const dur = 0.25;
    const buffer = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / data.length) * 0.6;
    }
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 900;
    const gain = ctx.createGain();
    gain.gain.value = 0.25;
    src.connect(filter).connect(gain).connect(audio.master);
    src.start();
  }

  // The "being seen" hum: a quiet rising tone while any Warden watches you.
  function setHum(on, level) {
    const ctx = audio.ctx;
    if (!ctx) return;
    if (on && !audio.muted) {
      if (!audio.humNodes) {
        const osc = ctx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.value = 196;
        const gain = ctx.createGain();
        gain.gain.value = 0;
        osc.connect(gain).connect(audio.master);
        osc.start();
        audio.humNodes = { osc, gain };
      }
      audio.humNodes.gain.gain.setTargetAtTime(0.03 + level * 0.06, ctx.currentTime, 0.1);
      audio.humNodes.osc.frequency.setTargetAtTime(196 + level * 120, ctx.currentTime, 0.1);
    } else if (audio.humNodes) {
      audio.humNodes.gain.gain.setTargetAtTime(0, ctx.currentTime, 0.05);
    }
  }

  // Called every frame: player steps, Warden steps (louder when closer).
  function tick(player, nearestGuardDist, dt) {
    if (!audio.ctx || audio.muted) return;
    if (player.moving) {
      audio.stepTimer -= dt;
      if (audio.stepTimer <= 0) {
        stepSound(player.sneaking ? 0.05 : 0.12, player.sneaking ? 700 : 420);
        audio.stepTimer = player.sneaking ? 0.42 : 0.3;
      }
    }
    if (nearestGuardDist < 300) {
      audio.guardStepTimer -= dt;
      if (audio.guardStepTimer <= 0) {
        const vol = 0.16 * (1 - nearestGuardDist / 300);
        stepSound(vol, 300);
        audio.guardStepTimer = 0.42;
      }
    }
  }

  function toggleMute() {
    audio.muted = !audio.muted;
    if (audio.master) audio.master.gain.value = audio.muted ? 0 : 0.5;
    return audio.muted;
  }

  return { ensureContext, tick, chime, alarmSting, snuffPuff, setHum, toggleMute };
}
