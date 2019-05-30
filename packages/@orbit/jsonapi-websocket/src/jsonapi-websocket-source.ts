import Orbit, {
  Source,
  SourceSettings,
  RecordOperation,
  buildTransform
} from '@orbit/data';
import { deepMerge } from '@orbit/utils';
import {
  JSONAPISerializer,
  JSONAPISerializerSettings,
  ResourceOperationsDocument
} from '@orbit/jsonapi';

import { Connection, ConnectionSettings } from './lib/connection';

const { assert } = Orbit;

export interface JSONAPIWebSocketSourceSettings extends SourceSettings {
  url?: string;
  defaultConnectionSettings?: ConnectionSettings;
  SerializerClass?: new (
    settings: JSONAPISerializerSettings
  ) => JSONAPISerializer;
}

/**
 Source for accessing a JSON API compliant RESTful API with a network fetch
 request.

 @class JSONAPIWebSocketSource
 @extends Source
 */
export default class JSONAPIWebSocketSource extends Source {
  url: string;
  defaultConnectionSettings: ConnectionSettings;
  connection: Connection;
  serializer: JSONAPISerializer;

  constructor(settings: JSONAPIWebSocketSourceSettings = {}) {
    assert(
      "JSONAPIWebSocketSource's `schema` must be specified in `settings.schema` constructor argument",
      !!settings.schema
    );
    assert(
      "JSONAPIWebSocketSource's `url` must be specified in `settings.url` constructor argument",
      !!settings.url
    );

    settings.name = settings.name || 'jsonapi-websocket';

    super(settings);

    this.url = settings.url;
    this.initDefaultWebSocketSettings(settings);

    const SerializerClass = settings.SerializerClass || JSONAPISerializer;
    this.serializer = new SerializerClass({
      schema: settings.schema,
      keyMap: settings.keyMap
    });

    this.onMessage = this.onMessage.bind(this);
  }

  connect() {
    this.connection = new Connection(this.url, this.defaultConnectionSettings);
    this.connection.on('message', this.onMessage);
    this.connection.ensureActiveConnection();
  }

  disconnect() {
    this.connection.off('message', this.onMessage);
    this.connection.disconnect();
    this.connection = undefined;
  }

  protected onMessage(document: ResourceOperationsDocument) {
    const operations = this.serializer.deserializeOperationsDocument(document);
    this.applyOperations(operations);
  }

  protected async applyOperations(
    operations: RecordOperation[]
  ): Promise<void> {
    const transforms = [buildTransform(operations)];
    await this._transformed(transforms);
  }

  protected initDefaultWebSocketSettings(
    settings: JSONAPIWebSocketSourceSettings
  ): void {
    this.defaultConnectionSettings = {
      protocols: ['jsonapi-v1.2']
    };

    if (settings.defaultConnectionSettings) {
      deepMerge(
        this.defaultConnectionSettings,
        settings.defaultConnectionSettings
      );
    }
  }
}
