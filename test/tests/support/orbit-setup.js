import Orbit from 'orbit/main';
import { Promise } from 'rsvp';
import jQuery from 'jquery';

Orbit.Promise = Promise;
Orbit.ajax = jQuery.ajax;
