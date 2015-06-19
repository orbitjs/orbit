// import { isArray, isObject } from 'orbit/lib/objects';
// import JSONAPISource from './jsonapi-source';
//
// /**
//  Source for accessing a JSON API compliant RESTful API with AJAX using the
//  official patch extension
//
//  @class JSONAPIPatchSource
//  @extends Source
//  @namespace OC
//  @param schema
//  @param options
//  @constructor
//  */
// export default JSONAPISource.extend({
//
//   /////////////////////////////////////////////////////////////////////////////
//   // Internals
//   /////////////////////////////////////////////////////////////////////////////
//
//   _transformAdd: function(operation) {
//     var _this = this;
//     var type = operation.path[0];
//     var id = operation.path[1];
//
//     var remoteOp = {
//       op: 'add',
//       path: '/-',
//       value: this.serializer.serializeRecord(type, operation.value)
//     };
//
//     return this.ajax(this.resourceURL(type), 'PATCH', {data: [ remoteOp ]}).then(
//       function(raw) {
//         if (raw && isArray(raw)) {
//           _this.deserialize(type, id, raw[0], operation);
//         } else {
//           _this._transformCache(operation);
//         }
//       }
//     );
//   },
//
//   _transformReplace: function(operation) {
//     var _this = this;
//     var type = operation.path[0];
//     var id = operation.path[1];
//     var value = operation.value;
//
//     var remoteOp = {
//       op: 'replace',
//       path: '/',
//       value: this.serializer.serializeRecord(type, value)
//     };
//
//     return this.ajax(this.resourceURL(type, id), 'PATCH', {data: [ remoteOp ]}).then(
//       function(raw) {
//         if (raw && isArray(raw)) {
//           _this.deserialize(type, id, raw[0], operation);
//         } else {
//           _this._transformCache(operation);
//         }
//       }
//     );
//   },
//
//   _transformRemove: function(operation) {
//     var _this = this;
//     var type = operation.path[0];
//     var id = operation.path[1];
//
//     var remoteOp = {
//       op: 'remove',
//       path: '/'
//     };
//
//     return this.ajax(this.resourceURL(type, id), 'PATCH', {data: [ remoteOp ]}).then(
//       function() {
//         _this._transformCache(operation);
//       }
//     );
//   },
//
//   _transformAddLink: function(operation) {
//     var _this = this;
//
//     var type = operation.path[0];
//     var id = operation.path[1];
//     var link = operation.path[3];
//     var relId = operation.path[4] || operation.value;
//     var linkDef = this.schema.linkDefinition(type, link);
//     var relType = linkDef.model;
//     var relResourceId = this.serializer.resourceId(relType, relId);
//     var remoteOp;
//
//     if (linkDef.type === 'hasMany') {
//       remoteOp = {
//         op: 'add',
//         path: '/-',
//         value: relResourceId
//       };
//     } else {
//       remoteOp = {
//         op: 'replace',
//         path: '/',
//         value: relResourceId
//       };
//     }
//
//     return this.ajax(this.resourceLinkURL(type, id, link), 'PATCH', {data: [ remoteOp ]}).then(
//       function() {
//         _this._transformCache(operation);
//       }
//     );
//   },
//
//   _transformRemoveLink: function(operation) {
//     var _this = this;
//
//     var type = operation.path[0];
//     var id = operation.path[1];
//     var link = operation.path[3];
//     var linkDef = this.schema.linkDefinition(type, link);
//     var remoteOp;
//
//     if (linkDef.type === 'hasMany') {
//       var relId = operation.path[4];
//       var relType = linkDef.model;
//       var relResourceId = this.serializer.resourceId(relType, relId);
//
//       remoteOp = {
//         op: 'remove',
//         path: '/' + relResourceId
//       };
//     } else {
//       remoteOp = {
//         op: 'remove',
//         path: '/'
//       };
//     }
//
//     return this.ajax(this.resourceLinkURL(type, id, link), 'PATCH', {data: [ remoteOp ]}).then(
//       function() {
//         _this._transformCache(operation);
//       }
//     );
//   },
//
//   _transformReplaceLink: function(operation) {
//     var _this = this;
//
//     var type = operation.path[0];
//     var id = operation.path[1];
//     var link = operation.path[3];
//     var relId = operation.path[4] || operation.value;
//
//     // Convert a map of ids to an array
//     if (isObject(relId)) {
//       relId = Object.keys(relId);
//     }
//
//     var linkDef = this.schema.linkDefinition(type, link);
//     var relType = linkDef.model;
//     var relResourceId = this.serializer.resourceId(relType, relId);
//     var remoteOp;
//
//     remoteOp = {
//       op: 'replace',
//       path: '/',
//       value: relResourceId
//     };
//
//     return this.ajax(this.resourceLinkURL(type, id, link), 'PATCH', {data: [ remoteOp ]}).then(
//       function() {
//         _this._transformCache(operation);
//       }
//     );
//   },
//
//   _transformUpdateAttribute: function(operation) {
//     var _this = this;
//     var type = operation.path[0];
//     var id = operation.path[1];
//     var attr = operation.path[2];
//
//     var remoteOp = {
//       op: 'replace',
//       path: '/' + attr,
//       value: operation.value
//     };
//
//     return this.ajax(this.resourceURL(type, id), 'PATCH', {data: [ remoteOp ]}).then(
//       function() {
//         _this._transformCache(operation);
//       }
//     );
//   },
//
//   ajaxContentType: function(url, method) {
//     return 'application/vnd.api+json; ext=jsonpatch; charset=utf-8';
//   }
// });
