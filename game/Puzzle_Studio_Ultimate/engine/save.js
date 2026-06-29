// engine/save.js
export class SaveSystem {
  constructor(key = "puzzle_save") {
    this.key = key;
  }

  save(data) {
    localStorage.setItem(this.key, JSON.stringify(data));
  }

  load() {
    const d = localStorage.getItem(this.key);
    return d ? JSON.parse(d) : null;
  }

  clear() {
    localStorage.removeItem(this.key);
  }
}