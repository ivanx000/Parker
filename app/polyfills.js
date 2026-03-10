// FormData polyfill for React Native
// This must be loaded before any other code that might use FormData

(function() {
  'use strict';
  
  if (typeof global !== 'undefined' && typeof global.FormData === 'undefined') {
    global.FormData = class FormData {
      constructor() {
        this._data = [];
      }
      
      append(key, value) {
        this._data.push([key, value]);
      }
      
      get(key) {
        const entry = this._data.find(([k]) => k === key);
        return entry ? entry[1] : null;
      }
      
      getAll(key) {
        return this._data.filter(([k]) => k === key).map(([, v]) => v);
      }
      
      has(key) {
        return this._data.some(([k]) => k === key);
      }
      
      set(key, value) {
        const index = this._data.findIndex(([k]) => k === key);
        if (index !== -1) {
          this._data[index] = [key, value];
        } else {
          this._data.push([key, value]);
        }
      }
      
      delete(key) {
        this._data = this._data.filter(([k]) => k !== key);
      }
      
      forEach(callback, thisArg) {
        this._data.forEach(([key, value]) => {
          callback.call(thisArg, value, key, this);
        });
      }
      
      keys() {
        return this._data.map(([key]) => key);
      }
      
      values() {
        return this._data.map(([, value]) => value);
      }
      
      entries() {
        return this._data;
      }
    };
  }
})();
