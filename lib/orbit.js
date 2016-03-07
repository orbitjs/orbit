import Orbit from 'orbit/main';
import Action from 'orbit/action';
import ActionQueue from 'orbit/action-queue';
import Document from 'orbit/document';
import Evented from 'orbit/evented';
import Notifier from 'orbit/notifier';
import Fetchable from 'orbit/fetchable';
import Queryable from 'orbit/queryable';
import Transformable from 'orbit/transformable';
import Transform from 'orbit/transform';
import { assert } from 'orbit/lib/assert';
import { arrayToOptions } from 'orbit/lib/config';
import { deprecate } from 'orbit/lib/deprecate';
import { diffs } from 'orbit/lib/diffs';
import { eq } from 'orbit/lib/eq';
import { Exception, PathNotFoundException } from 'orbit/lib/exceptions';
import { spread } from 'orbit/lib/functions';
import { clone, expose, extend, isArray, toArray, isObject, isNone } from 'orbit/lib/objects';
import { joinPath, splitPath } from 'orbit/lib/paths';
import { capitalize, camelize, decamelize, dasherize, underscore } from 'orbit/lib/strings';
import { noop, required } from 'orbit/lib/stubs';
import { uuid } from 'orbit/lib/uuid';

if (typeof Promise !== 'undefined') {
  Orbit.Promise = Promise;
}

Orbit.Action = Action;
Orbit.ActionQueue = ActionQueue;
Orbit.Document = Document;
Orbit.Evented = Evented;
Orbit.Notifier = Notifier;
Orbit.Fetchable = Fetchable;
Orbit.Queryable = Queryable;
Orbit.Transformable = Transformable;
Orbit.Transform = Transform;
// lib fns
Orbit.assert = assert;
Orbit.arrayToOptions = arrayToOptions;
Orbit.deprecate = deprecate;
Orbit.diffs = diffs;
Orbit.eq = eq;
Orbit.Exception = Exception;
Orbit.PathNotFoundException = PathNotFoundException;
Orbit.spread = spread;
Orbit.clone = clone;
Orbit.expose = expose;
Orbit.extend = extend;
Orbit.isArray = isArray;
Orbit.toArray = toArray;
Orbit.isObject = isObject;
Orbit.isNone = isNone;
Orbit.joinPath = joinPath;
Orbit.splitPath = splitPath;
Orbit.capitalize = capitalize;
Orbit.camelize = camelize;
Orbit.decamelize = decamelize;
Orbit.dasherize = dasherize;
Orbit.underscore = underscore;
Orbit.noop = noop;
Orbit.required = required;
Orbit.uuid = uuid;

export default Orbit;
