/* eslint-disable valid-jsdoc */
import Orbit, {
  KeyMap,
  Schema,
  Source, SourceSettings,
  Query, QueryOrExpression,
  Pullable, pullable,
  Pushable, pushable,
  Transform,
  TransformOrOperations,
  Queryable, queryable,
  Record
} from '@orbit/data';
import JSONAPIRequestProcessor, {
  JSONAPIRequestProcessorSettings,
  FetchSettings
} from './jsonapi-request-processor';
import { JSONAPISerializer, JSONAPISerializerSettings } from './jsonapi-serializer';
import { QueryOperator } from "./lib/query-operators";

const { assert, deprecate } = Orbit;

export interface JSONAPISourceSettings extends SourceSettings {
  maxRequestsPerTransform?: number;
  name?: string;
  namespace?: string;
  host?: string;
  defaultFetchHeaders?: object;
  defaultFetchTimeout?: number;
  defaultFetchSettings?: FetchSettings;
  allowedContentTypes?: string[];
  SerializerClass?: (new (settings: JSONAPISerializerSettings) => JSONAPISerializer);
  RequestProcessorClass?: (new (source: JSONAPISource, settings: JSONAPIRequestProcessorSettings) => JSONAPIRequestProcessor);
  schema?: Schema,
  keyMap?: KeyMap
}

/**
 Source for accessing a JSON API compliant RESTful API with a network fetch
 request.

 If a single transform or query requires more than one fetch request,
 requests will be performed sequentially and resolved together. From the
 perspective of Orbit, these operations will all succeed or fail together. The
 `maxRequestsPerTransform` and `maxRequestsPerQuery` settings allow limits to be
 set on this behavior. These settings should be set to `1` if your client/server
 configuration is unable to resolve partially successful transforms / queries.

 @class JSONAPISource
 @extends Source
 */
@pullable
@pushable
@queryable
export default class JSONAPISource extends Source implements Pullable, Pushable, Queryable {
  namespace: string;
  host: string;
  serializer: JSONAPISerializer;
  requestProcessor: JSONAPIRequestProcessor;

  // Pullable interface stubs
  pull: (queryOrExpression: QueryOrExpression, options?: object, id?: string) => Promise<Transform[]>;

  // Pushable interface stubs
  push: (transformOrOperations: TransformOrOperations, options?: object, id?: string) => Promise<Transform[]>;

  // Queryable interface stubs
  query: (queryOrExpression: QueryOrExpression, options?: object, id?: string) => Promise<any>;

  constructor(settings: JSONAPISourceSettings = {}) {
    assert('JSONAPISource\'s `schema` must be specified in `settings.schema` constructor argument', !!settings.schema);

    settings.name = settings.name || 'jsonapi';

    super(settings);

    this.namespace = settings.namespace;
    this.host = settings.host;

    const SerializerClass = settings.SerializerClass || JSONAPISerializer;
    this.serializer = new SerializerClass({
      schema: settings.schema,
      keyMap: settings.keyMap
    });

    const RequestProcessorClass = settings.RequestProcessorClass || JSONAPIRequestProcessor;
    this.requestProcessor = new RequestProcessorClass(this, {
      allowedContentTypes: settings.allowedContentTypes,
      defaultFetchSettings: settings.defaultFetchSettings,
      maxRequestsPerTransform: settings.maxRequestsPerTransform,
      namespace: settings.namespace,
      host: settings.host,
      schema: settings.schema,
      keyMap: settings.keyMap
    });
  }

  /////////////////////////////////////////////////////////////////////////////
  // Pushable interface implementation
  /////////////////////////////////////////////////////////////////////////////

  async _push(transform: Transform): Promise<Transform[]> {
    const requests = this.requestProcessor.getTransformRequests(transform);
    const transforms: Transform[] = [];

    for (let request of requests) {
      let processor = this.requestProcessor.getTransformRequestProcessor(request);

      let additionalTransforms: Transform[] = await processor(this, request);
      if (additionalTransforms) {
        Array.prototype.push.apply(transforms, additionalTransforms);
      }
    }

    transforms.unshift(transform);
    return transforms;
  }

  /////////////////////////////////////////////////////////////////////////////
  // Pullable interface implementation
  /////////////////////////////////////////////////////////////////////////////

  async _pull(query: Query): Promise<Transform[]> {
    const operator: QueryOperator = this.requestProcessor.getQueryOperator(query);
    const response = await operator(this, query);
    return response.transforms;
  }

  /////////////////////////////////////////////////////////////////////////////
  // Queryable interface implementation
  /////////////////////////////////////////////////////////////////////////////

  async _query(query: Query): Promise<Record|Record[]> {
    const operator: QueryOperator = this.requestProcessor.getQueryOperator(query);
    const response = await operator(this, query);
    await this._transformed(response.transforms);
    return response.primaryData;
  }

  /////////////////////////////////////////////////////////////////////////////
  // Publicly accessible methods particular to JSONAPISource
  /////////////////////////////////////////////////////////////////////////////

  /* DEPRECATED METHODS & PROPERTIES
   *
   * Note: In addition to deprecations below, the following methods
   * have moved to JSONAPIRequestProcessor:
   *
   *        appendQueryParams
   *        initFetchSettings
   *        initDefaultFetchSettings
   *        handleFetchResponse
   *        handleFetchResponseError
   *        handleFetchError
   *        resourceURL
   *        resourcePath
   *        resourceRelationshipURL
   *        relatedResourceURL
   *        resourceNamespace
   *        resourceHost
   */

  fetch(url: string, customSettings?: FetchSettings): Promise<any> {
    deprecate('JSONAPISource: fetch has moved to the requestProcessor', true);
    return this.requestProcessor.fetch(url, customSettings);
  }

  responseHasContent(response: Response): boolean {
    deprecate('JSONAPISource: responseHasContent has moved to the requestProcessor', true);
    return this.requestProcessor.responseHasContent(response);
  }

  initFetchSettings(customSettings: FetchSettings = {}): FetchSettings {
    deprecate('JSONAPISource: initFetchSettings has moved to the requestProcessor', true);
    return this.requestProcessor.initFetchSettings(customSettings);
  }

  get defaultFetchSettings(): FetchSettings {
    deprecate('JSONAPISource: Access `defaultFetchSettings` on requestProcessor instead of source`');
    return this.requestProcessor.defaultFetchSettings;
  }

  set defaultFetchSettings(settings: FetchSettings) {
    deprecate('JSONAPISource: Access `defaultFetchSettings` on requestProcessor instead of source');
    this.requestProcessor.defaultFetchSettings = settings;
  }

  get defaultFetchHeaders(): object {
    deprecate('JSONAPISource: Access `defaultFetchSettings.headers` instead of `defaultFetchHeaders`');
    return this.requestProcessor.defaultFetchSettings.headers;
  }

  set defaultFetchHeaders(headers: object) {
    deprecate('JSONAPISource: Access `defaultFetchSettings.headers` instead of `defaultFetchHeaders`');
    this.requestProcessor.defaultFetchSettings.headers = headers;
  }

  get defaultFetchTimeout() {
    deprecate('JSONAPISource: Access `defaultFetchSettings.timeout` instead of `defaultFetchTimeout`');
    return this.requestProcessor.defaultFetchSettings.timeout;
  }

  set defaultFetchTimeout(timeout: number) {
    deprecate('JSONAPISource: Access `defaultFetchSettings.timeout` instead of `defaultFetchTimeout`');
    this.requestProcessor.defaultFetchSettings.timeout = timeout;
  }

  get allowedContentTypes():string[] {
    deprecate('JSONAPISource: Access `requestProcessor.allowedContentTypes` instead of `allowedContentTypes`');
    return this.requestProcessor.allowedContentTypes;
  }

  set allowedContentTypes(val:string[]) {
    deprecate('JSONAPISource: Access `requestProcessor.allowedContentTypes` instead of `allowedContentTypes`');
    this.requestProcessor.allowedContentTypes = val;
  }

  get maxRequestsPerTransform():number {
    deprecate('JSONAPISource: Access `requestProcessor.maxRequestsPerTransform` instead of `maxRequestsPerTransform`');
    return this.requestProcessor.maxRequestsPerTransform;
  }

  set maxRequestsPerTransform(val:number) {
    deprecate('JSONAPISource: Access `requestProcessor.maxRequestsPerTransform` instead of `maxRequestsPerTransform`');
    this.requestProcessor.maxRequestsPerTransform = val;
  }
}
