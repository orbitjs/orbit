import { recordIdentityFrom } from './store-helpers';
import Store from '@orbit/store';
import { JSONAPISerializer } from '@orbit/jsonapi';
import { KeyMap, Schema } from '@orbit/data';

// NOTE: more may be added here
export enum PAYLOAD_OPERATION {
  ADD_RECORD = 'addRecord',
  REPLACE_RECORD = 'replaceRecord',
}

// TODO: payload should be a valid `{ json:api }` payload
export async function pushPayload(store: Store, payload: any, op = PAYLOAD_OPERATION.ADD_RECORD) {
  const { keyMap, schema } = store;
  const serializer = new JSONAPISerializer({ schema, keyMap });
  const normalized = serializer.deserializeDocument(payload);

  const datas = buildDatas(normalized);
  const included = buildIncluded(normalized);
  const resources = datas.concat(included);

  fixRelationships(store, resources);
  assignIdsToResources(resources, keyMap, schema);

  await store.update(
    q =>
      resources.map(resource => {
        return q[op](resource);
      }),
    { skipRemote: true }
  );
}

function buildIncluded(normalized: any) {
  const included = normalized.included || [];

  return included;
}

function buildDatas(normalized: any) {
  const data = normalized.data;
  const records = Array.isArray(data) ? data : [data];

  return records;
}

function fixRelationships(store: Store, resources: any[]) {
  resources.forEach(resource => {
    Object.keys(resource.relationships || {}).forEach(relationName => {
      const relation = resource.relationships[relationName] || {};

      if (!relation.data) {
        relation.data = [];
      }

      const isHasMany = Array.isArray(relation.data);
      const datas = isHasMany ? relation.data : [relation.data];

      datas.forEach((d: any) => {
        const recordIdentity = recordIdentityFrom(store, d.id, d.type);
        const localId = recordIdentity.id;

        d.id = localId;
      });
    });
  });
}

function assignIdsToResources(resources: any[], keyMap: KeyMap, schema: Schema) {
  resources.forEach(resource => assignIds(resource, keyMap, schema));
}

function assignIds(resource: any, keyMap: KeyMap, schema: Schema) {
  resource.keys = { remoteId: resource.id };
  resource.id = keyMap.idFromKeys(resource.type, resource.keys) || schema.generateId(resource.type);
}
