import { Orbit } from '@orbit/core';
import { QueryExpressionParseError } from '@orbit/data';
import {
  AttributeFilterSpecifier,
  AttributeSortSpecifier,
  FilterSpecifier,
  RecordKeyMap,
  PageSpecifier,
  RelatedRecordFilterSpecifier,
  RelatedRecordsFilterSpecifier,
  SortSpecifier
} from '@orbit/records';
import { clone, Dict } from '@orbit/utils';
import { JSONAPISerializer } from './jsonapi-serializer';
import { appendQueryParams } from './lib/query-params';
import { SerializerForFn, StringSerializer } from '@orbit/serializers';
import { JSONAPISerializers } from './serializers/jsonapi-serializers';
import { ResourceIdentity } from './resource-document';
import { JSONAPIResourceIdentitySerializer } from './serializers/jsonapi-resource-identity-serializer';
import { JSONAPIResourceFieldSerializer } from './serializers/jsonapi-resource-field-serializer';
import { RecordQueryRequest } from './lib/query-requests';
import { RecordTransformRequest } from './lib/transform-requests';

const { deprecate } = Orbit;

export interface JSONAPIURLBuilderSettings {
  host?: string;
  namespace?: string;
  serializer?: JSONAPISerializer;
  serializerFor: SerializerForFn;
  keyMap?: RecordKeyMap;
}

export class JSONAPIURLBuilder {
  host?: string;
  namespace?: string;
  serializerFor: SerializerForFn;
  serializer?: JSONAPISerializer;
  keyMap?: RecordKeyMap;

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
    return [
      this.resourceURL(type, id),
      'relationships',
      this.serializeRelationshipInPath(type, relationship)
    ].join('/');
  }

  relatedResourceURL(type: string, id: string, relationship: string): string {
    return [
      this.resourceURL(type, id),
      this.serializeRelationshipInPath(type, relationship)
    ].join('/');
  }

  buildFilterParam(
    filters: FilterSpecifier[] | Dict<unknown | unknown[]>,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    request?: RecordQueryRequest | RecordTransformRequest
  ): Dict<unknown>[] {
    const params: Dict<unknown>[] = [];

    if (Array.isArray(filters)) {
      for (let filterSpecifier of filters) {
        if (
          filterSpecifier.kind === 'attribute' &&
          filterSpecifier.op === 'equal'
        ) {
          const attributeFilter = filterSpecifier as AttributeFilterSpecifier;
          const field = this.serializeFieldParam(attributeFilter.attribute, {
            kind: 'attribute'
          });
          params.push({
            [field]: attributeFilter.value ?? null
          });
        } else if (filterSpecifier.kind === 'relatedRecord') {
          const relatedRecordFilter = filterSpecifier as RelatedRecordFilterSpecifier;
          if (relatedRecordFilter.op !== 'equal') {
            throw new QueryExpressionParseError(
              `Filter operation '${relatedRecordFilter.op}' not recognized by JSONAPIURLBuilder#buildFilterParam for relatedRecord filtering. Override this method to provide a custom handler.`
            );
          }
          const field = this.serializeFieldParam(relatedRecordFilter.relation, {
            kind: 'relationship'
          });
          if (Array.isArray(relatedRecordFilter.record)) {
            params.push({
              [field]: relatedRecordFilter.record
                .map((e) => e?.id ?? null)
                .join(',')
            });
          } else {
            params.push({
              [field]: relatedRecordFilter?.record?.id ?? null
            });
          }
        } else if (filterSpecifier.kind === 'relatedRecords') {
          const relatedRecordsFilter = filterSpecifier as RelatedRecordsFilterSpecifier;
          if (relatedRecordsFilter.op !== 'equal') {
            throw new QueryExpressionParseError(
              `Filter operation '${relatedRecordsFilter.op}' not recognized by JSONAPIURLBuilder#buildFilterParam for relatedRecords filtering. Override this method to provide a custom handler.`
            );
          }
          const field = this.serializeFieldParam(
            relatedRecordsFilter.relation,
            { kind: 'relationship' }
          );
          params.push({
            [field]: relatedRecordsFilter.records
              .map((e) => e?.id ?? null)
              .join(',')
          });
        } else {
          throw new QueryExpressionParseError(
            `Filter operation '${filterSpecifier.op}' not recognized by JSONAPIURLBuilder#buildFilterParam. Override this method to provide a custom handler.`
          );
        }
      }
    } else {
      for (let key in filters) {
        const value = filters[key];
        const fieldParam = this.serializeFieldParam(key);

        if (Array.isArray(value)) {
          for (let v of value) {
            params.push({ [fieldParam]: v });
          }
        } else {
          params.push({ [fieldParam]: value });
        }
      }
    }

    return params;
  }

  buildSortParam(
    sortSpecifiers: (SortSpecifier | string)[] | string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    request?: RecordQueryRequest | RecordTransformRequest
  ): string {
    if (Array.isArray(sortSpecifiers)) {
      return sortSpecifiers
        .map((sortSpecifier) => {
          let descending;
          let fieldName;
          if (typeof sortSpecifier === 'string') {
            descending = sortSpecifier.charAt(0) === '-';
            fieldName = descending ? sortSpecifier.substring(1) : sortSpecifier;
          } else if (sortSpecifier.kind === 'attribute') {
            const attributeSort = sortSpecifier as AttributeSortSpecifier;
            descending = attributeSort.order === 'descending';
            fieldName = attributeSort.attribute;
          }

          if (fieldName) {
            const field = this.serializeFieldParam(fieldName, {
              kind: 'attribute'
            });
            return `${descending ? '-' : ''}${field}`;
          }
        })
        .join(',');
    } else if (typeof sortSpecifiers === 'string') {
      return sortSpecifiers;
    }

    throw new QueryExpressionParseError(
      `Sort specifier not recognized for JSONAPISource.`
    );
  }

  buildPageParam(
    pageSpecifier: PageSpecifier,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    request?: RecordQueryRequest | RecordTransformRequest
  ): Dict<unknown> {
    let pageParam = clone(pageSpecifier);
    delete pageParam.kind;
    return pageParam;
  }

  buildIncludeParam(
    includeSpecifier: string | string[] | string[][],
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    request?: RecordQueryRequest | RecordTransformRequest
  ): string {
    if (Array.isArray(includeSpecifier)) {
      return includeSpecifier
        .map((s) => {
          const paths = Array.isArray(s) ? s : s.split('.');
          return paths
            .map((p) => this.serializeFieldParam(p, { kind: 'relationship' }))
            .join('.');
        })
        .join(',');
    } else {
      return includeSpecifier;
    }
  }

  buildFieldsParam(
    fieldsSpecifier: Dict<string | string[]>,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    request?: RecordQueryRequest | RecordTransformRequest
  ): Dict<string> {
    const params: Dict<string> = {};

    for (let type in fieldsSpecifier) {
      const value = fieldsSpecifier[type];

      const serializer = this.serializerFor(
        JSONAPISerializers.ResourceTypeParam
      ) as StringSerializer;
      const typeParam = serializer.serialize(type);

      const fields = Array.isArray(value) ? value : value.split(',');
      params[typeParam] = fields
        .map((f: string) => this.serializeFieldParam(f))
        .join(',');
    }

    return params;
  }

  appendQueryParams(url: string, params: Dict<string>): string {
    let fullUrl = url;
    if (params) {
      fullUrl = appendQueryParams(fullUrl, params);
    }
    return fullUrl;
  }

  protected serializeFieldParam(
    field: string,
    options?: {
      type?: string;
      // TODO: remove kind param when deprecated serializer is removed
      kind?: 'attribute' | 'relationship';
    }
  ): string {
    if (this.serializer) {
      if (options?.kind === 'attribute') {
        return this.serializer.resourceAttribute(options?.type, field);
      } else if (options?.kind === 'relationship') {
        return this.serializer.resourceRelationship(options?.type, field);
      } else {
        return field;
      }
    } else {
      const serializer = this.serializerFor(
        JSONAPISerializers.ResourceFieldParam
      ) as JSONAPIResourceFieldSerializer;
      return serializer.serialize(field, { type: options?.type }) as string;
    }
  }

  protected serializeRelationshipInPath(
    type: string | undefined,
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
