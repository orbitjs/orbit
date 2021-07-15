---
id: "JSONAPIQueryOptions"
title: "Interface: JSONAPIQueryOptions"
sidebar_label: "JSONAPIQueryOptions"
sidebar_position: 0
custom_edit_url: null
---

## Hierarchy

- `RecordSourceQueryOptions`

- `JSONAPISharedRequestOptions`

  ↳ **`JSONAPIQueryOptions`**

## Properties

### fullResponse

• `Optional` **fullResponse**: `boolean`

#### Inherited from

RecordSourceQueryOptions.fullResponse

#### Defined in

packages/@orbit/data/dist/modules/request.d.ts:3

___

### maxRequests

• `Optional` **maxRequests**: `number`

#### Inherited from

JSONAPISharedRequestOptions.maxRequests

#### Defined in

[packages/@orbit/jsonapi/src/jsonapi-source.ts:68](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/jsonapi/src/jsonapi-source.ts#L68)

___

### parallelRequests

• `Optional` **parallelRequests**: `boolean`

#### Inherited from

JSONAPISharedRequestOptions.parallelRequests

#### Defined in

[packages/@orbit/jsonapi/src/jsonapi-source.ts:69](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/jsonapi/src/jsonapi-source.ts#L69)

___

### raiseNotFoundExceptions

• `Optional` **raiseNotFoundExceptions**: `boolean`

#### Inherited from

RecordSourceQueryOptions.raiseNotFoundExceptions

#### Defined in

packages/@orbit/records/dist/modules/record-source.d.ts:11

___

### sources

• `Optional` **sources**: `Object`

#### Index signature

▪ [name: `string`]: `RequestOptions`

#### Inherited from

RecordSourceQueryOptions.sources

#### Defined in

packages/@orbit/data/dist/modules/request.d.ts:4
