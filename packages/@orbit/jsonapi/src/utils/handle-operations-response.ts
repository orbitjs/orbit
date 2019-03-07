import { TransformBuilder } from '@orbit/data';
// import { pushPayload, localIdFromRecordIdentity } from 'react-orbitjs';

import { JSONAPIOperationsPayload } from '../lib/operations/types';
import { JSONAPIDocument } from '..';

export function handleOperationsResponse(store: Store, data: JSONAPIOperationsPayload | JSONAPIDocument) {
  if ((data as JSONAPIDocument).data) {
    // need a helper for adding things to the store, and normalizing them
    pushPayload(store, data);
  }

  if ((data as JSONAPIOperationsPayload).operations) {
    (data as JSONAPIOperationsPayload).operations.forEach((operation) => {
      let removedRecords: Record<any, any>[] = [];
      let operationData;

      switch (operation.op) {
        case 'get':
        case 'update':
        case 'add':
          // need a helper for adding things to the store, and normalizing them
          pushPayload(store, { ...operation });
          break;
        case 'remove':
          operationData = operation.data || operation.ref;
          removedRecords = Array.isArray(operationData) ? operationData : [operationData];

          // we probably just need a primitive for removing records from the store
          store.update(
            (t: TransformBuilder) =>
              removedRecords.map((record) => {
                // need a helper for ensuring that we get the local id
                // that we can pull the record out of the store
                let localId = localIdFromRecordIdentity(store, record);

                return t.removeRecord({ type: record.type, id: localId });
              }),
            { skipRemote: true }
          );
          break;
        default:
          throw new Error('op is not a valid operation');
      }
    });
  }
}
