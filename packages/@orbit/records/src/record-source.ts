import { RecordKeyMap } from './record-key-map';
import { RecordSchema } from './record-schema';
import { RecordQueryBuilder } from './record-query-builder';
import { RecordTransformBuilder } from './record-transform-builder';
import { Source, SourceSettings } from '@orbit/data';

export interface RecordSourceSettings
  extends SourceSettings<RecordQueryBuilder, RecordTransformBuilder> {
  schema?: RecordSchema;
  keyMap?: RecordKeyMap;
  autoUpgrade?: boolean;
}

/**
 * Abstract base class for record-based sources.
 */
export abstract class RecordSource extends Source<
  RecordQueryBuilder,
  RecordTransformBuilder
> {
  protected _keyMap?: RecordKeyMap;
  protected _schema?: RecordSchema;

  constructor(settings: RecordSourceSettings = {}) {
    const autoActivate =
      settings.autoActivate === undefined || settings.autoActivate;

    super({ ...settings, autoActivate: false });

    this._schema = settings.schema;
    this._keyMap = settings.keyMap;

    if (
      this._schema &&
      (settings.autoUpgrade === undefined || settings.autoUpgrade)
    ) {
      this._schema.on('upgrade', () => this.upgrade());
    }

    if (autoActivate) {
      this.activate();
    }
  }

  get schema(): RecordSchema | undefined {
    return this._schema;
  }

  get keyMap(): RecordKeyMap | undefined {
    return this._keyMap;
  }

  /**
   * Upgrade source as part of a schema upgrade.
   */
  upgrade(): Promise<void> {
    return Promise.resolve();
  }
}
