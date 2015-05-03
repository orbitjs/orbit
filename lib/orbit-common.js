import OC from 'orbit-common/main';
import Cache from 'orbit-common/cache';
import Schema from 'orbit-common/schema';
import Serializer from 'orbit-common/serializer';
import Source from 'orbit-common/source';
import MemorySource from 'orbit-common/memory-source';
import { OperationNotAllowed, RecordNotFoundException, LinkNotFoundException, RecordAlreadyExistsException, ModelNotRegisteredException, LinkNotRegisteredException } from 'orbit-common/lib/exceptions';

OC.Cache = Cache;
OC.Schema = Schema;
OC.Serializer = Serializer;
OC.Source = Source;
OC.MemorySource = MemorySource;
// exceptions
OC.OperationNotAllowed = OperationNotAllowed;
OC.RecordNotFoundException = RecordNotFoundException;
OC.LinkNotFoundException = LinkNotFoundException;
OC.ModelNotRegisteredException = ModelNotRegisteredException;
OC.LinkNotRegisteredException = LinkNotRegisteredException;
OC.RecordAlreadyExistsException = RecordAlreadyExistsException;

export default OC;
