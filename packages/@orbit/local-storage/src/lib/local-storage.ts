declare const self: any;

export function supportsLocalStorage(): boolean {
  try {
    return 'localStorage' in self && self['localStorage'] !== null;
  } catch (e) {
    return false;
  }
}
