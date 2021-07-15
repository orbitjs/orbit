---
id: "modules"
title: "@orbit/data"
sidebar_label: "Exports"
sidebar_position: 0.5
custom_edit_url: null
---

## Classes

- [ClientError](classes/ClientError.md)
- [NetworkError](classes/NetworkError.md)
- [OperationTerm](classes/OperationTerm.md)
- [QueryExpressionParseError](classes/QueryExpressionParseError.md)
- [QueryNotAllowed](classes/QueryNotAllowed.md)
- [QueryTerm](classes/QueryTerm.md)
- [ServerError](classes/ServerError.md)
- [Source](classes/Source.md)
- [TransformNotAllowed](classes/TransformNotAllowed.md)

## Interfaces

- [AsyncQueryable](interfaces/AsyncQueryable.md)
- [AsyncUpdatable](interfaces/AsyncUpdatable.md)
- [FullResponse](interfaces/FullResponse.md)
- [NamedFullResponseMap](interfaces/NamedFullResponseMap.md)
- [Operation](interfaces/Operation.md)
- [Options](interfaces/Options.md)
- [Pullable](interfaces/Pullable.md)
- [Pushable](interfaces/Pushable.md)
- [Query](interfaces/Query.md)
- [QueryExpression](interfaces/QueryExpression.md)
- [Queryable](interfaces/Queryable.md)
- [RequestOptions](interfaces/RequestOptions.md)
- [Resettable](interfaces/Resettable.md)
- [ResponseHints](interfaces/ResponseHints.md)
- [SourceSettings](interfaces/SourceSettings.md)
- [SyncQueryable](interfaces/SyncQueryable.md)
- [SyncUpdatable](interfaces/SyncUpdatable.md)
- [Syncable](interfaces/Syncable.md)
- [Transform](interfaces/Transform.md)
- [Updatable](interfaces/Updatable.md)

## Type aliases

### DefaultRequestOptions

Ƭ **DefaultRequestOptions**<`RO`\>: `RO` & { `fullResponse?`: ``false``  }

#### Type parameters

| Name | Type |
| :------ | :------ |
| `RO` | extends [`RequestOptions`](interfaces/RequestOptions.md) |

#### Defined in

[packages/@orbit/data/src/request.ts:8](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/data/src/request.ts#L8)

___

### FullRequestOptions

Ƭ **FullRequestOptions**<`RO`\>: `RO` & { `fullResponse`: ``true``  }

#### Type parameters

| Name | Type |
| :------ | :------ |
| `RO` | extends [`RequestOptions`](interfaces/RequestOptions.md) |

#### Defined in

[packages/@orbit/data/src/request.ts:12](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/data/src/request.ts#L12)

___

### NamedFullResponse

Ƭ **NamedFullResponse**<`Data`, `Details`, `O`\>: [`string`, [`FullResponse`](interfaces/FullResponse.md)<`Data`, `Details`, `O`\>]

#### Type parameters

| Name | Type |
| :------ | :------ |
| `Data` | `Data` |
| `Details` | `unknown` |
| `O` | extends [`Operation`](interfaces/Operation.md)[`Operation`](interfaces/Operation.md) |

#### Defined in

[packages/@orbit/data/src/response.ts:4](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/data/src/response.ts#L4)

___

### QueryBuilderFunc

Ƭ **QueryBuilderFunc**<`QE`, `QB`\>: (`QueryBuilder`: `QB`) => `QE` \| `QE`[] \| [`QueryTerm`](classes/QueryTerm.md)<`QE`\> \| [`QueryTerm`](classes/QueryTerm.md)<`QE`\>[]

#### Type parameters

| Name | Type |
| :------ | :------ |
| `QE` | extends [`QueryExpression`](interfaces/QueryExpression.md) |
| `QB` | `QB` |

#### Type declaration

▸ (`QueryBuilder`): `QE` \| `QE`[] \| [`QueryTerm`](classes/QueryTerm.md)<`QE`\> \| [`QueryTerm`](classes/QueryTerm.md)<`QE`\>[]

##### Parameters

| Name | Type |
| :------ | :------ |
| `QueryBuilder` | `QB` |

##### Returns

`QE` \| `QE`[] \| [`QueryTerm`](classes/QueryTerm.md)<`QE`\> \| [`QueryTerm`](classes/QueryTerm.md)<`QE`\>[]

#### Defined in

[packages/@orbit/data/src/query.ts:19](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/data/src/query.ts#L19)

___

### QueryOrExpressions

Ƭ **QueryOrExpressions**<`QE`, `QB`\>: [`Query`](interfaces/Query.md)<`QE`\> \| `QE` \| `QE`[] \| [`QueryTerm`](classes/QueryTerm.md)<`QE`\> \| [`QueryTerm`](classes/QueryTerm.md)<`QE`\>[] \| [`QueryBuilderFunc`](modules.md#querybuilderfunc)<`QE`, `QB`\>

#### Type parameters

| Name | Type |
| :------ | :------ |
| `QE` | extends [`QueryExpression`](interfaces/QueryExpression.md) |
| `QB` | `QB` |

#### Defined in

[packages/@orbit/data/src/query.ts:23](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/data/src/query.ts#L23)

___

### SourceClass

Ƭ **SourceClass**<`QueryOptions`, `TransformOptions`, `QueryBuilder`, `TransformBuilder`\>: () => [`Source`](classes/Source.md)<`QueryOptions`, `TransformOptions`, `QueryBuilder`, `TransformBuilder`\>

#### Type parameters

| Name | Type |
| :------ | :------ |
| `QueryOptions` | extends [`RequestOptions`](interfaces/RequestOptions.md)[`RequestOptions`](interfaces/RequestOptions.md) |
| `TransformOptions` | extends [`RequestOptions`](interfaces/RequestOptions.md)[`RequestOptions`](interfaces/RequestOptions.md) |
| `QueryBuilder` | `unknown` |
| `TransformBuilder` | `unknown` |

#### Type declaration

• ()

#### Defined in

[packages/@orbit/data/src/source.ts:42](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/data/src/source.ts#L42)

___

### TransformBuilderFunc

Ƭ **TransformBuilderFunc**<`O`, `TB`\>: (`TransformBuilder`: `TB`) => `O` \| `O`[] \| [`OperationTerm`](classes/OperationTerm.md)<`O`\> \| [`OperationTerm`](classes/OperationTerm.md)<`O`\>[]

#### Type parameters

| Name | Type |
| :------ | :------ |
| `O` | extends [`Operation`](interfaces/Operation.md) |
| `TB` | `TB` |

#### Type declaration

▸ (`TransformBuilder`): `O` \| `O`[] \| [`OperationTerm`](classes/OperationTerm.md)<`O`\> \| [`OperationTerm`](classes/OperationTerm.md)<`O`\>[]

##### Parameters

| Name | Type |
| :------ | :------ |
| `TransformBuilder` | `TB` |

##### Returns

`O` \| `O`[] \| [`OperationTerm`](classes/OperationTerm.md)<`O`\> \| [`OperationTerm`](classes/OperationTerm.md)<`O`\>[]

#### Defined in

[packages/@orbit/data/src/transform.ts:7](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/data/src/transform.ts#L7)

___

### TransformOrOperations

Ƭ **TransformOrOperations**<`O`, `TB`\>: [`Transform`](interfaces/Transform.md)<`O`\> \| `O` \| `O`[] \| [`OperationTerm`](classes/OperationTerm.md)<`O`\> \| [`OperationTerm`](classes/OperationTerm.md)<`O`\>[] \| [`TransformBuilderFunc`](modules.md#transformbuilderfunc)<`O`, `TB`\>

#### Type parameters

| Name | Type |
| :------ | :------ |
| `O` | extends [`Operation`](interfaces/Operation.md) |
| `TB` | `TB` |

#### Defined in

[packages/@orbit/data/src/transform.ts:11](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/data/src/transform.ts#L11)

## Functions

### buildQuery

▸ **buildQuery**<`QE`, `QB`\>(`queryOrExpressions`, `queryOptions?`, `queryId?`, `queryBuilder?`): [`Query`](interfaces/Query.md)<`QE`\>

A builder function for creating a Query from its constituent parts.

If a `Query` is passed in with an `id` and `expression`, and no replacement
`id` or `options` are also passed in, then the `Query` will be returned
unchanged.

For all other cases, a new `Query` object will be created and returned.

Queries will be assigned the specified `queryId` as `id`. If none is
specified, a UUID will be generated.

#### Type parameters

| Name | Type |
| :------ | :------ |
| `QE` | extends [`QueryExpression`](interfaces/QueryExpression.md) |
| `QB` | `unknown` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `queryOrExpressions` | [`QueryOrExpressions`](modules.md#queryorexpressions)<`QE`, `QB`\> |
| `queryOptions?` | [`RequestOptions`](interfaces/RequestOptions.md) |
| `queryId?` | `string` |
| `queryBuilder?` | `QB` |

#### Returns

[`Query`](interfaces/Query.md)<`QE`\>

#### Defined in

[packages/@orbit/data/src/query.ts:43](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/data/src/query.ts#L43)

___

### buildTransform

▸ **buildTransform**<`O`, `TB`\>(`transformOrOperations`, `transformOptions?`, `transformId?`, `transformBuilder?`): [`Transform`](interfaces/Transform.md)<`O`\>

A builder function for creating a Transform from its constituent parts.

If a `Transform` is passed in with an `id` and `operations`, and no
replacement `id` or `options` are also passed in, then the `Transform`
will be returned unchanged.

For all other cases, a new `Transform` object will be created and returned.

Transforms will be assigned the specified `transformId` as `id`. If none
is specified, a UUID will be generated.

#### Type parameters

| Name | Type |
| :------ | :------ |
| `O` | extends [`Operation`](interfaces/Operation.md) |
| `TB` | `unknown` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `transformOrOperations` | [`TransformOrOperations`](modules.md#transformoroperations)<`O`, `TB`\> |
| `transformOptions?` | [`RequestOptions`](interfaces/RequestOptions.md) |
| `transformId?` | `string` |
| `transformBuilder?` | `TB` |

#### Returns

[`Transform`](interfaces/Transform.md)<`O`\>

#### Defined in

[packages/@orbit/data/src/transform.ts:40](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/data/src/transform.ts#L40)

___

### isPullable

▸ **isPullable**(`source`): `boolean`

Has a source been decorated as `@pullable`?

#### Parameters

| Name | Type |
| :------ | :------ |
| `source` | [`Source`](classes/Source.md) |

#### Returns

`boolean`

#### Defined in

[packages/@orbit/data/src/source-interfaces/pullable.ts:26](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/data/src/source-interfaces/pullable.ts#L26)

___

### isPushable

▸ **isPushable**(`source`): `boolean`

Has a source been decorated as `@pushable`?

#### Parameters

| Name | Type |
| :------ | :------ |
| `source` | [`Source`](classes/Source.md) |

#### Returns

`boolean`

#### Defined in

[packages/@orbit/data/src/source-interfaces/pushable.ts:24](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/data/src/source-interfaces/pushable.ts#L24)

___

### isQuery

▸ **isQuery**<`QE`, `QB`\>(`query`): query is Query<QE\>

#### Type parameters

| Name | Type |
| :------ | :------ |
| `QE` | extends [`QueryExpression`](interfaces/QueryExpression.md)[`QueryExpression`](interfaces/QueryExpression.md) |
| `QB` | `unknown` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `query` | [`QueryOrExpressions`](modules.md#queryorexpressions)<`QE`, `QB`\> |

#### Returns

query is Query<QE\>

#### Defined in

[packages/@orbit/data/src/query.ts:112](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/data/src/query.ts#L112)

___

### isQueryTerm

▸ **isQueryTerm**<`QE`\>(`expression`): expression is QueryTerm<QE\>

#### Type parameters

| Name | Type |
| :------ | :------ |
| `QE` | extends [`QueryExpression`](interfaces/QueryExpression.md)[`QueryExpression`](interfaces/QueryExpression.md) |

#### Parameters

| Name | Type |
| :------ | :------ |
| `expression` | `QE` \| [`QueryTerm`](classes/QueryTerm.md)<`QE`\> |

#### Returns

expression is QueryTerm<QE\>

#### Defined in

[packages/@orbit/data/src/query.ts:106](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/data/src/query.ts#L106)

___

### isQueryable

▸ **isQueryable**(`source`): `boolean`

Has a source been decorated as `@queryable`?

#### Parameters

| Name | Type |
| :------ | :------ |
| `source` | [`Source`](classes/Source.md) |

#### Returns

`boolean`

#### Defined in

[packages/@orbit/data/src/source-interfaces/queryable.ts:22](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/data/src/source-interfaces/queryable.ts#L22)

___

### isSyncable

▸ **isSyncable**(`source`): `boolean`

Has a source been decorated as `@syncable`?

#### Parameters

| Name | Type |
| :------ | :------ |
| `source` | [`Source`](classes/Source.md) |

#### Returns

`boolean`

#### Defined in

[packages/@orbit/data/src/source-interfaces/syncable.ts:13](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/data/src/source-interfaces/syncable.ts#L13)

___

### isUpdatable

▸ **isUpdatable**(`source`): `boolean`

Has a source been decorated as `@updatable`?

#### Parameters

| Name | Type |
| :------ | :------ |
| `source` | [`Source`](classes/Source.md) |

#### Returns

`boolean`

#### Defined in

[packages/@orbit/data/src/source-interfaces/updatable.ts:21](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/data/src/source-interfaces/updatable.ts#L21)

___

### mapNamedFullResponses

▸ **mapNamedFullResponses**<`Data`, `Details`, `O`\>(`responses`): [`NamedFullResponseMap`](interfaces/NamedFullResponseMap.md)<`Data`, `Details`, `O`\>

#### Type parameters

| Name | Type |
| :------ | :------ |
| `Data` | `unknown` |
| `Details` | `unknown` |
| `O` | extends [`Operation`](interfaces/Operation.md)[`Operation`](interfaces/Operation.md) |

#### Parameters

| Name | Type |
| :------ | :------ |
| `responses` | ([`NamedFullResponse`](modules.md#namedfullresponse)<`Data`, `Details`, `O`\> \| `undefined`)[] |

#### Returns

[`NamedFullResponseMap`](interfaces/NamedFullResponseMap.md)<`Data`, `Details`, `O`\>

#### Defined in

[packages/@orbit/data/src/response.ts:55](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/data/src/response.ts#L55)

___

### pullable

▸ **pullable**(`Klass`): `void`

Marks a source as "pullable" and adds an implementation of the `Pullable`
interface.

The `pull` method is part of the "request flow" in Orbit. Requests trigger
events before and after processing of each request. Observers can delay the
resolution of a request by returning a promise in an event listener.

A pullable source emits the following events:

- `beforePull` - emitted prior to the processing of `pull`, this event
includes the requested `Query` as an argument.

- `pull` - emitted after a `pull` has successfully been requested, this
event's arguments include both the requested `Query` and an array of the
resulting `Transform` instances.

- `pullFail` - emitted when an error has occurred processing a `pull`, this
event's arguments include both the requested `Query` and the error.

A pullable source must implement a private method `_pull`, which performs
the processing required for `pull` and returns a promise that resolves to an
array of `Transform` instances.

#### Parameters

| Name | Type |
| :------ | :------ |
| `Klass` | `unknown` |

#### Returns

`void`

#### Defined in

[packages/@orbit/data/src/source-interfaces/pullable.ts:92](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/data/src/source-interfaces/pullable.ts#L92)

___

### pushable

▸ **pushable**(`Klass`): `void`

Marks a source as "pushable" and adds an implementation of the `Pushable`
interface.

The `push` method is part of the "request flow" in Orbit. Requests trigger
events before and after processing of each request. Observers can delay the
resolution of a request by returning a promise in an event listener.

A pushable source emits the following events:

- `beforePush` - emitted prior to the processing of `push`, this event
includes the requested `Transform` as an argument.

- `push` - emitted after a `push` has successfully been applied, this event's
arguments include both the requested `Transform` and an array of the actual
applied `Transform` instances.

- `pushFail` - emitted when an error has occurred pushing a transform, this
event's arguments include both the requested `Transform` and the error.

A pushable source must implement a private method `_push`, which performs
the processing required for `push` and returns a promise that resolves to an
array of `Transform` instances.

#### Parameters

| Name | Type |
| :------ | :------ |
| `Klass` | `unknown` |

#### Returns

`void`

#### Defined in

[packages/@orbit/data/src/source-interfaces/pushable.ts:92](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/data/src/source-interfaces/pushable.ts#L92)

___

### queryable

▸ **queryable**(`Klass`): `void`

Marks a source as "queryable" and adds an implementation of the `Queryable`
interface.

The `query` method is part of the "request flow" in Orbit. Requests trigger
events before and after processing of each request. Observers can delay the
resolution of a request by returning a promise in an event listener.

The `Queryable` interface introduces the following events:

- `beforeQuery` - emitted prior to the processing of `query`, this event
includes the requested `Query` as an argument.

- `query` - emitted after a `query` has successfully returned, this event's
arguments include both the requested `Query` and the results.

- `queryFail` - emitted when an error has occurred processing a query, this
event's arguments include both the requested `Query` and the error.

A queryable source must implement a private method `_query`, which performs
the processing required for `query` and returns a promise that resolves to a
set of results.

#### Parameters

| Name | Type |
| :------ | :------ |
| `Klass` | `unknown` |

#### Returns

`void`

#### Defined in

[packages/@orbit/data/src/source-interfaces/queryable.ts:67](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/data/src/source-interfaces/queryable.ts#L67)

___

### requestOptionsForSource

▸ **requestOptionsForSource**<`RO`\>(`options`, `source?`): `RO` \| `undefined`

Merges general request options with those specific to a source. The more
specific options override the general options. If an array of options is
provided, they will be merged to a single set.

#### Type parameters

| Name | Type |
| :------ | :------ |
| `RO` | extends [`RequestOptions`](interfaces/RequestOptions.md) |

#### Parameters

| Name | Type |
| :------ | :------ |
| `options` | `RO` \| `undefined` \| (`RO` \| `undefined`)[] |
| `source?` | `string` |

#### Returns

`RO` \| `undefined`

#### Defined in

[packages/@orbit/data/src/request.ts:21](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/data/src/request.ts#L21)

___

### syncable

▸ **syncable**(`Klass`): `void`

Marks a source as "syncable" and adds an implementation of the `Syncable`
interface.

The `sync` method is part of the "sync flow" in Orbit. This flow is used to
synchronize the contents of sources.

Other sources can participate in the resolution of a `sync` by observing the
`transform` event, which is emitted whenever a new `Transform` is applied to
a source.

#### Parameters

| Name | Type |
| :------ | :------ |
| `Klass` | `unknown` |

#### Returns

`void`

#### Defined in

[packages/@orbit/data/src/source-interfaces/syncable.ts:48](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/data/src/source-interfaces/syncable.ts#L48)

___

### toQueryExpression

▸ **toQueryExpression**<`QE`\>(`expression`): `QE`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `QE` | extends [`QueryExpression`](interfaces/QueryExpression.md)[`QueryExpression`](interfaces/QueryExpression.md) |

#### Parameters

| Name | Type |
| :------ | :------ |
| `expression` | `QE` \| [`QueryTerm`](classes/QueryTerm.md)<`QE`\> |

#### Returns

`QE`

#### Defined in

[packages/@orbit/data/src/query.ts:96](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/data/src/query.ts#L96)

___

### updatable

▸ **updatable**(`Klass`): `void`

Marks a source as "updatable" and adds an implementation of the `Updatable`
interface.

The `update` method is part of the "request flow" in Orbit. Requests trigger
events before and after processing of each request. Observers can delay the
resolution of a request by returning a promise in an event listener.

An updatable source emits the following events:

- `beforeUpdate` - emitted prior to the processing of `update`, this event
includes the requested `Transform` as an argument.

- `update` - emitted after an `update` has successfully been applied, this
event includes the requested `Transform` as an argument.

- `updateFail` - emitted when an error has occurred applying an update, this
event's arguments include both the requested `Transform` and the error.

An updatable source must implement a private method `_update`, which performs
the processing required for `update` and returns a promise that resolves when
complete.

#### Parameters

| Name | Type |
| :------ | :------ |
| `Klass` | `unknown` |

#### Returns

`void`

#### Defined in

[packages/@orbit/data/src/source-interfaces/updatable.ts:65](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/data/src/source-interfaces/updatable.ts#L65)
