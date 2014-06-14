import OC from './orbit_common/main';
import Cache from './orbit_common/cache';
import IdMap from './orbit_common/id_map';
import Schema from './orbit_common/schema';
import Source from './orbit_common/source';
import MemorySource from './orbit_common/memory_source';
import { OperationNotAllowed, RecordNotFoundException, LinkNotFoundException, RecordAlreadyExistsException } from './orbit_common/lib/exceptions';

OC.Cache = Cache;
OC.Schema = Schema;
OC.Source = Source;
OC.MemorySource = MemorySource;
// exceptions
OC.OperationNotAllowed = OperationNotAllowed;
OC.RecordNotFoundException = RecordNotFoundException;
OC.LinkNotFoundException = LinkNotFoundException;
OC.RecordAlreadyExistsException = RecordAlreadyExistsException;

export default OC;
