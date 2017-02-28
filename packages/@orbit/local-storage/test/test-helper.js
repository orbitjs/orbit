import './support/orbit-setup';
import './support/rsvp';
import { on } from 'rsvp';

on('error', function(reason) {
  console.error('rsvp error', reason);
});
