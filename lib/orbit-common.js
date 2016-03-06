import OC from 'orbit-common/main';
import Cache from 'orbit-common/cache';
import Schema from 'orbit-common/schema';
import Serializer from 'orbit-common/serializer';
import Source from 'orbit-common/source';
import MemorySource from 'orbit-common/memory-source';
import Transaction from 'orbit-common/transaction';
import OperationProcessor from 'orbit-common/cache/operation-processors/operation-processor';
import CacheIntegrityProcessor from 'orbit-common/cache/operation-processors/cache-integrity-processor';
import DeletionTrackingProcessor from 'orbit-common/cache/operation-processors/deletion-tracking-processor';
import SchemaConsistencyProcessor from 'orbit-common/cache/operation-processors/schema-consistency-processor';
import {
  operationType,
  coalesceOperations,
  addRecordOperation,
  replaceRecordOperation,
  removeRecordOperation,
  replaceAttributeOperation,
  addToHasManyOperation,
  removeFromHasManyOperation,
  replaceHasManyOperation,
  replaceHasOneOperation
} from 'orbit-common/lib/operations';
import { toIdentifier, parseIdentifier, identity } from 'orbit-common/lib/identifiers';
import { OperationNotAllowed, RecordNotFoundException, RelationshipNotFoundException, RecordAlreadyExistsException, ModelNotRegisteredException, KeyNotRegisteredException, RelationshipNotRegisteredException } from 'orbit-common/lib/exceptions';

OC.Cache = Cache;
OC.Schema = Schema;
OC.Serializer = Serializer;
OC.Source = Source;
OC.MemorySource = MemorySource;
OC.Transaction = Transaction;
// operation processors
OC.OperationProcessor = OperationProcessor;
OC.CacheIntegrityProcessor = CacheIntegrityProcessor;
OC.DeletionTrackingProcessor = DeletionTrackingProcessor;
OC.SchemaConsistencyProcessor = SchemaConsistencyProcessor;
// identifiers
OC.toIdentifier = toIdentifier;
OC.parseIdentifier = parseIdentifier;
// operations
OC.operationType = operationType;
OC.coalesceOperations = coalesceOperations;
OC.addRecordOperation = addRecordOperation;
OC.replaceRecordOperation = replaceRecordOperation;
OC.removeRecordOperation = removeRecordOperation;
OC.replaceAttributeOperation = replaceAttributeOperation;
OC.addToHasManyOperation = addToHasManyOperation;
OC.removeFromHasManyOperation = removeFromHasManyOperation;
OC.replaceHasManyOperation = replaceHasManyOperation;
OC.replaceHasOneOperation = replaceHasOneOperation;
OC.identity = identity;
// exceptions
OC.OperationNotAllowed = OperationNotAllowed;
OC.RecordNotFoundException = RecordNotFoundException;
OC.RelationshipNotFoundException = RelationshipNotFoundException;
OC.RecordAlreadyExistsException = RecordAlreadyExistsException;
OC.ModelNotRegisteredException = ModelNotRegisteredException;
OC.KeyNotRegisteredException = KeyNotRegisteredException;
OC.RelationshipNotRegisteredException = RelationshipNotRegisteredException;

export default OC;
