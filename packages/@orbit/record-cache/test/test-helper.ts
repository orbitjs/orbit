import './support/orbit-setup';
import './support/rsvp';
export * from './support/matchers';

declare const RSVP: any;
declare const console: any;

RSVP.on('error', function(reason) {
  console.error('rsvp error', reason);
});
