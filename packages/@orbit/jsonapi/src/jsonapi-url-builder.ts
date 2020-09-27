import Orbit from '@orbit/core';
import {
  AttributeFilterSpecifier,
  AttributeSortSpecifier,
  FilterSpecifier,
  KeyMap,
  PageSpecifier,
  QueryExpressionParseError,
  RelatedRecordFilterSpecifier,
  RelatedRecordsFilterSpecifier,
  SortSpecifier
} from '@orbit/data';
import { clone, Dict } from '@orbit/utils';
import { JSONAPISerializer } from './jsonapi-serializer';
import { Filter } from './lib/jsonapi-request-options';
import { appendQueryParams } from './lib/query-params';
import { SerializerForFn, StringSerializer } from '@orbit/serializers';
import { JSONAPISerializers } from './serializers/jsonapi-serializers';
import { ResourceIdentity } from './resources';
import { JSONAPIResourceIdentitySerializer } from './serializers/jsonapi-resource-identity-serializer';
import { JSONAPIResourceFieldSerializer } from './serializers/jsonapi-resource-field-serializer';

const { deprecate } = Orbit;

export interface JSONAPIURLBuilderSettings {
  host?: string;
  namespace?: string;
  serializer?: JSONAPISerializer;
  serializerFor: SerializerForFn;
  keyMap?: KeyMap;
}

export class JSONAPIURLBuilder {
  host?: string;
  namespace?: string;
  serializerFor: SerializerForFn;
  serializer?: JSONAPISerializer;
  keyMap?: KeyMap;

  constructor(settings: JSONAPIURLBuilderSettings) {
    this.host = settings.host;
    this.namespace = settings.namespace;
    this.serializerFor = settings.serializerFor;
    if (settings.serializer) {
      this.serializer = settings.serializer;
      deprecate(
        "The 'serializer' setting for 'JSONAPIURLBuilder' has been deprecated. Pass 'serializerFor' instead."
      );
    }
    this.keyMap = settings.keyMap;
  }

  /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
  resourceNamespace(type?: string): string | undefined {
    return this.namespace;
  }

  /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
  resourceHost(type?: string): string | undefined {
    return this.host;
  }

  resourceURL(type: string, id?: string): string {
    let host = this.resourceHost(type);
    let namespace = this.resourceNamespace(type);
    let url: string[] = [];

    if (host) {
      url.push(host);
    }
    if (namespace) {
      url.push(namespace);
    }
    url.push(this.resourcePath(type, id));

    if (!host) {
      url.unshift('');
    }

    return url.join('/');
  }

  resourcePath(type: string, id?: string): string {
    let resourceType, resourceId;
    if (this.serializer) {
      resourceType = this.serializer.resourceType(type);
      if (id) {
        resourceId = this.serializer.resourceId(type, id);
      }
    } else {
      const resourceTypeSerializer = this.serializerFor(
        JSONAPISerializers.ResourceTypePath
      ) as StringSerializer;
      resourceType = resourceTypeSerializer.serialize(type);
      if (id) {
        const resourceIdentitySerializer = this.serializerFor(
          JSONAPISerializers.ResourceIdentity
        ) as JSONAPIResourceIdentitySerializer;
        const identity = resourceIdentitySerializer.serialize({
          type,
          id
        }) as ResourceIdentity;
        resourceId = identity.id;
      }
    }

    let path = [resourceType];
    if (resourceId) {
      path.push(resourceId);
    }
    return path.join('/');
  }

  resourceRelationshipURL(
    type: string,
    id: string,
    relationship: string
  ): string {
    return (
      this.resourceURL(type, id) +
      '/relationships/' +
      this.serializeRelationshipInPath(type, relationship)
    );
  }

  relatedResourceURL(type: string, id: string, relationship: string): string {
    return (
      this.resourceURL(type, id) +
      '/' +
      this.serializeRelationshipInPath(type, relationship)
    );
  }

  buildFilterParam(filterSpecifiers: FilterSpecifier[]): Filter[] {
    const filters: Filter[] = [];

    filterSpecifiers.forEach((filterSpecifier) => {
      if (
        filterSpecifier.kind === 'attribute' &&
        filterSpecifier.op === 'equal'
      ) {
        const attributeFilter = filterSpecifier as AttributeFilterSpecifier;

        // Note: We don't know the `type` of the attribute here, so passing `undefined`
        const resourceAttribute = this.serializeAttributeAsParam(
          undefined,
          attributeFilter.attribute
        );
        filters.push({ [resourceAttribute]: attributeFilter.value });
      } else if (filterSpecifier.kind === 'relatedRecord') {
        const relatedRecordFilter = filterSpecifier as RelatedRecordFilterSpecifier;
        if (Array.isArray(relatedRecordFilter.record)) {
          filters.push({
            [relatedRecordFilter.relation]: relatedRecordFilter.record
              .map((e) => e.id)
              .join(',')
          });
        } else {
          filters.push({
            [relatedRecordFilter.relation]: relatedRecordFilter?.record?.id
          });
        }
      } else if (filterSpecifier.kind === 'relatedRecords') {
        if (filterSpecifier.op !== 'equal') {
          throw new Error(
            `Operation "${filterSpecifier.op}" is not supported in JSONAPI for relatedRecords filtering`
          );
        }
        const relatedRecordsFilter = filterSpecifier as RelatedRecordsFilterSpecifier;
        filters.push({
          [relatedRecordsFilter.relation]: relatedRecordsFilter.records
            .map((e) => e.id)
            .join(',')
        });
      } else {
        throw new QueryExpressionParseError(
          `Filter operation ${filterSpecifier.op} not recognized for JSONAPISource.`
        );
      }
    });

    return filters;
  }

  buildSortParam(sortSpecifiers: SortSpecifier[]): string {
    return sortSpecifiers
      .map((sortSpecifier) => {
        if (sortSpecifier.kind === 'attribute') {
          const attributeSort = sortSpecifier as AttributeSortSpecifier;

          // Note: We don't know the `type` of the attribute here, so passing `undefined`
          const resourceAttribute = this.serializeAttributeAsParam(
            undefined,
            attributeSort.attribute
          );
          return (
            (sortSpecifier.order === 'descending' ? '-' : '') +
            resourceAttribute
          );
        }
        throw new QueryExpressionParseError(
          `Sort specifier ${sortSpecifier.kind} not recognized for JSONAPISource.`
        );
      })
      .join(',');
  }

  buildPageParam(pageSpecifier: PageSpecifier): Dict<any> {
    let pageParam = clone(pageSpecifier);
    delete pageParam.kind;
    return pageParam;
  }

  appendQueryParams(url: string, params: Dict<string>): string {
    let fullUrl = url;
    if (params) {
      fullUrl = appendQueryParams(fullUrl, params);
    }
    return fullUrl;
  }

  protected serializeAttributeAsParam(
    type: string | undefined,
    attribute: string
  ): string {
    if (this.serializer) {
      return this.serializer.resourceAttribute(type, attribute);
    } else {
      const serializer = this.serializerFor(
        JSONAPISerializers.ResourceFieldParam
      ) as JSONAPIResourceFieldSerializer;
      return serializer.serialize(attribute, { type }) as string;
    }
  }

  protected serializeRelationshipAsParam(
    type: string,
    relationship: string
  ): string {
    if (this.serializer) {
      return this.serializer.resourceRelationship(type, relationship);
    } else {
      const serializer = this.serializerFor(
        JSONAPISerializers.ResourceFieldParam
      ) as JSONAPIResourceFieldSerializer;
      return serializer.serialize(relationship, { type }) as string;
    }
  }

  protected serializeRelationshipInPath(
    type: string,
    relationship: string
  ): string {
    if (this.serializer) {
      return this.serializer.resourceRelationship(type, relationship);
    } else {
      const serializer = this.serializerFor(
        JSONAPISerializers.ResourceFieldPath
      ) as JSONAPIResourceFieldSerializer;
      return serializer.serialize(relationship, { type }) as string;
    }
  }
}
