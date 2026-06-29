// engine/audio.js (final polish)
export class AudioManager {
  constructor() {
    this.sounds = {};
    this.volume = 1;
  }

  register(name, src) {
    const a = new Audio(src);
    a.preload = "auto";
    this.sounds[name] = a;
  }

  play(name) {
    const s = this.sounds[name];
    if (!s) return;

    s.currentTime = 0;
    s.volume = this.volume;
    s.play().catch(() => {});
  }

  setVolume(v) {
    this.volume = v;
  }
}