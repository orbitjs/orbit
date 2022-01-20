import { RequestOptions } from '@orbit/data';
import { FilterSpecifier, PageSpecifier, SortSpecifier } from '@orbit/records';
import { Dict } from '@orbit/utils';
import { FetchSettings } from '../jsonapi-request-processor';

export interface JSONAPIRequestOptions extends RequestOptions {
  raiseNotFoundExceptions?: boolean;
  filter?: FilterSpecifier[] | Dict<string | string[]>;
  sort?: (SortSpecifier | string)[] | string;
  page?: PageSpecifier;
  include?: string | string[] | string[][];
  fields?: Dict<string | string[]>;

  /**
   * Explicit control over whether the resultset in a successful response should
   * be interpreted as a partial set of related records. Currently, this option
   * only applies to requests for related records.
   *
   * Example usage: A request is made to a custom relationship `url` and you
   * want the records returned to be added to the relationship, rather than to
   * replace all existing members of that relationship.
   *
   * If this property is not set, then `data` will be implicitly treated as a
   * partial set of related records if:
   *
   * - a `filter` option is present in the request
   * - a `page` option is present in the request
   * - a `prev` or `next` link is present in the response document's top-level
   *   `links` object.
   */
  partialSet?: boolean;

  settings?: FetchSettings;
  url?: string;
}
