export class SaveManager {
  static save(key, data) {
    try {
      window.localStorage.setItem(key, JSON.stringify(data));
      return true;
    } catch (e) {
      console.error('Error writing to LocalStorage', e);
      return false;
    }
  }

  static load(key, defaultValue = null) {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (e) {
      console.error('Error reading from LocalStorage', e);
      return defaultValue;
    }
  }

  static remove(key) {
    try {
      window.localStorage.removeItem(key);
      return true;
    } catch (e) {
      console.error('Error removing from LocalStorage', e);
      return false;
    }
  }
}
