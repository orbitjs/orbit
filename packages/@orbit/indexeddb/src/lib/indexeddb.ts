declare const self: any;

export function supportsIndexedDB() {
  try {
    return 'indexedDB' in self && self['indexedDB'] !== null;
  } catch (e) {
    return false;
  }
};
