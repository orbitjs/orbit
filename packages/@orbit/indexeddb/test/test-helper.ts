import './support/orbit-setup';
import './support/rsvp';

declare const RSVP: any;
declare const console: any;

RSVP.on('error', function(reason) {
  console.error('rsvp error', reason);
});
