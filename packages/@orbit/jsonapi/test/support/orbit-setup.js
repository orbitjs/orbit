import Orbit from '@orbit/core';
import { Promise } from 'rsvp';

Orbit.Promise = Promise;

// Polyfill environment Promise to keep whatwg-fetch polyfill happy
self.Promise = self.Promise || Promise;

// Use polyfilled fetch
Orbit.fetch = self.fetch;
