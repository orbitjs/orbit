import Orbit from '@orbit/core';

declare const RSVP: any;

Orbit.Promise = RSVP.Promise;

// Polyfill environment Promise to keep whatwg-fetch polyfill happy
Orbit.globals.Promise = Orbit.globals.Promise || RSVP.Promise;

// Use polyfilled fetch
Orbit.fetch = Orbit.globals.fetch;
