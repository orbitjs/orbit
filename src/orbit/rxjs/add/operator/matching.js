import { matching } from 'orbit/rxjs/operator/matching';
import { Observable } from 'rxjs/Observable';

Observable.prototype.matching = matching;
