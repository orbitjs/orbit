import { matching } from 'orbit-common/rxjs/operator/matching';
import { Observable } from 'rxjs/Observable';

Observable.prototype.matching = matching;
