---
id: "default"
title: "Class: default<QO, TO, QB, TB>"
sidebar_label: "default"
sidebar_position: 0
custom_edit_url: null
---

Source for accessing a JSON API compliant RESTful API with a network fetch
request.

If a single transform or query requires more than one fetch request,
requests will be performed sequentially and resolved together. From the
perspective of Orbit, these operations will all succeed or fail together. The
`maxRequestsPerTransform` and `maxRequestsPerQuery` settings allow limits to be
set on this behavior. These settings should be set to `1` if your client/server
configuration is unable to resolve partially successful transforms / queries.

## Type parameters

| Name | Type |
| :------ | :------ |
| `QO` | extends [`JSONAPIQueryOptions`](../interfaces/JSONAPIQueryOptions.md)[`JSONAPIQueryOptions`](../interfaces/JSONAPIQueryOptions.md) |
| `TO` | extends [`JSONAPITransformOptions`](../interfaces/JSONAPITransformOptions.md)[`JSONAPITransformOptions`](../interfaces/JSONAPITransformOptions.md) |
| `QB` | `RecordQueryBuilder` |
| `TB` | `RecordTransformBuilder` |

## Hierarchy

- `RecordSource`<`QO`, `TO`, `QB`, `TB`\>

- `RecordPullable`<[`JSONAPIResponse`](../interfaces/JSONAPIResponse.md)[]\>

- `RecordPushable`<[`JSONAPIResponse`](../interfaces/JSONAPIResponse.md)[]\>

- `RecordQueryable`<[`JSONAPIResponse`](../interfaces/JSONAPIResponse.md)[], `QB`, `QO`\>

- `RecordUpdatable`<[`JSONAPIResponse`](../interfaces/JSONAPIResponse.md)[], `TB`, `TO`\>

  ↳ **`default`**

## Implements

- `RecordPullable`<[`JSONAPIResponse`](../interfaces/JSONAPIResponse.md)[]\>
- `RecordPushable`<[`JSONAPIResponse`](../interfaces/JSONAPIResponse.md)[]\>
- `RecordQueryable`<[`JSONAPIResponse`](../interfaces/JSONAPIResponse.md)[], `QB`, `QO`\>
- `RecordUpdatable`<[`JSONAPIResponse`](../interfaces/JSONAPIResponse.md)[], `TB`, `TO`\>

## Constructors

### constructor

• **new default**<`QO`, `TO`, `QB`, `TB`\>(`settings`)

#### Type parameters

| Name | Type |
| :------ | :------ |
| `QO` | extends [`JSONAPIQueryOptions`](../interfaces/JSONAPIQueryOptions.md)[`JSONAPIQueryOptions`](../interfaces/JSONAPIQueryOptions.md) |
| `TO` | extends [`JSONAPITransformOptions`](../interfaces/JSONAPITransformOptions.md)[`JSONAPITransformOptions`](../interfaces/JSONAPITransformOptions.md) |
| `QB` | `RecordQueryBuilder`<`string`, `RecordIdentity`\> |
| `TB` | `RecordTransformBuilder`<`string`, `RecordIdentity`, `UninitializedRecord`\> |

#### Parameters

| Name | Type |
| :------ | :------ |
| `settings` | [`JSONAPISourceSettings`](../interfaces/JSONAPISourceSettings.md)<`QO`, `TO`, `QB`, `TB`\> |

#### Inherited from

RecordSource<QO, TO, QB, TB\>.constructor

#### Defined in

[packages/@orbit/jsonapi/src/jsonapi-source.ts:161](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/jsonapi/src/jsonapi-source.ts#L161)

## Properties

### requestProcessor

• **requestProcessor**: [`JSONAPIRequestProcessor`](JSONAPIRequestProcessor.md)

#### Defined in

[packages/@orbit/jsonapi/src/jsonapi-source.ts:159](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/jsonapi/src/jsonapi-source.ts#L159)

## Accessors

### activated

• `get` **activated**(): `Promise`<`void`\>

#### Returns

`Promise`<`void`\>

#### Defined in

packages/@orbit/data/dist/modules/source.d.ts:54

___

### bucket

• `get` **bucket**(): `undefined` \| `Bucket`<`unknown`\>

#### Returns

`undefined` \| `Bucket`<`unknown`\>

#### Defined in

packages/@orbit/data/dist/modules/source.d.ts:37

___

### defaultQueryOptions

• `get` **defaultQueryOptions**(): `undefined` \| `DefaultRequestOptions`<`QueryOptions`\>

#### Returns

`undefined` \| `DefaultRequestOptions`<`QueryOptions`\>

#### Defined in

packages/@orbit/data/dist/modules/source.d.ts:43

• `set` **defaultQueryOptions**(`options`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `options` | `undefined` \| `DefaultRequestOptions`<`QueryOptions`\> |

#### Returns

`void`

#### Defined in

packages/@orbit/data/dist/modules/source.d.ts:44

___

### defaultTransformOptions

• `get` **defaultTransformOptions**(): `undefined` \| `DefaultRequestOptions`<`TransformOptions`\>

#### Returns

`undefined` \| `DefaultRequestOptions`<`TransformOptions`\>

#### Defined in

packages/@orbit/data/dist/modules/source.d.ts:45

• `set` **defaultTransformOptions**(`options`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `options` | `undefined` \| `DefaultRequestOptions`<`TransformOptions`\> |

#### Returns

`void`

#### Defined in

packages/@orbit/data/dist/modules/source.d.ts:46

___

### keyMap

• `get` **keyMap**(): `undefined` \| `RecordKeyMap`

#### Returns

`undefined` \| `RecordKeyMap`

#### Defined in

packages/@orbit/records/dist/modules/record-source.d.ts:33

___

### maxRequestsPerQuery

• `get` **maxRequestsPerQuery**(): `undefined` \| `number`

Deprecated in favor of `defaultQueryOptions.maxRequests`

**`deprecated`** since v0.17, remove in v0.18

#### Returns

`undefined` \| `number`

#### Defined in

[packages/@orbit/jsonapi/src/jsonapi-source.ts:263](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/jsonapi/src/jsonapi-source.ts#L263)

• `set` **maxRequestsPerQuery**(`val`): `void`

Deprecated in favor of `defaultQueryOptions.maxRequests`

**`deprecated`** since v0.17, remove in v0.18

#### Parameters

| Name | Type |
| :------ | :------ |
| `val` | `undefined` \| `number` |

#### Returns

`void`

#### Defined in

[packages/@orbit/jsonapi/src/jsonapi-source.ts:275](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/jsonapi/src/jsonapi-source.ts#L275)

___

### maxRequestsPerTransform

• `get` **maxRequestsPerTransform**(): `undefined` \| `number`

Deprecated in favor of `defaultTransformOptions.maxRequests`

**`deprecated`** since v0.17, remove in v0.18

#### Returns

`undefined` \| `number`

#### Defined in

[packages/@orbit/jsonapi/src/jsonapi-source.ts:236](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/jsonapi/src/jsonapi-source.ts#L236)

• `set` **maxRequestsPerTransform**(`val`): `void`

Deprecated in favor of `defaultTransformOptions.maxRequests`

**`deprecated`** since v0.17, remove in v0.18

#### Parameters

| Name | Type |
| :------ | :------ |
| `val` | `undefined` \| `number` |

#### Returns

`void`

#### Defined in

[packages/@orbit/jsonapi/src/jsonapi-source.ts:248](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/jsonapi/src/jsonapi-source.ts#L248)

___

### name

• `get` **name**(): `undefined` \| `string`

#### Returns

`undefined` \| `string`

#### Defined in

packages/@orbit/data/dist/modules/source.d.ts:36

___

### queryBuilder

• `get` **queryBuilder**(): `QB`

#### Returns

`QB`

#### Defined in

packages/@orbit/records/dist/modules/record-source.d.ts:35

___

### requestQueue

• `get` **requestQueue**(): `TaskQueue`<`string`, `unknown`, `unknown`, `unknown`\>

#### Returns

`TaskQueue`<`string`, `unknown`, `unknown`, `unknown`\>

#### Defined in

packages/@orbit/data/dist/modules/source.d.ts:39

___

### schema

• `get` **schema**(): `RecordSchema`

#### Returns

`RecordSchema`

#### Defined in

packages/@orbit/records/dist/modules/record-source.d.ts:32

___

### syncQueue

• `get` **syncQueue**(): `TaskQueue`<`string`, `unknown`, `unknown`, `unknown`\>

#### Returns

`TaskQueue`<`string`, `unknown`, `unknown`, `unknown`\>

#### Defined in

packages/@orbit/data/dist/modules/source.d.ts:40

___

### transformBuilder

• `get` **transformBuilder**(): `TB`

#### Returns

`TB`

#### Defined in

packages/@orbit/records/dist/modules/record-source.d.ts:36

___

### transformLog

• `get` **transformLog**(): `Log`

#### Returns

`Log`

#### Defined in

packages/@orbit/data/dist/modules/source.d.ts:38

___

### validatorFor

• `get` **validatorFor**(): `undefined` \| `ValidatorForFn`<`Validator`<`unknown`[], `ArrayValidationOptions`, `ArrayValidationIssue`\> \| `Validator`<`boolean`, `undefined`, `TypeIssue`\> \| `Validator`<`Date`, `DateValidationOptions`, `DateValidationIssue`\> \| `Validator`<`number`, `NumberValidationOptions`, `NumberValidationIssue`\> \| `Validator`<`unknown`, `ValidationOptions`, `TypeIssue`\> \| `Validator`<`string`, `StringValidationOptions`, `StringValidationIssue`\> \| `Validator`<`InitializedRecord`, `RecordValidationOptions`, `RecordValidationIssue`\> \| `Validator`<`RecordAttributeInput`, `RecordAttributeValidationOptions`, `RecordAttributeValidationIssue`\> \| `Validator`<`RecordIdentity`, `RecordIdentityValidationOptions`, `RecordIdentityValidationIssue`\> \| `Validator`<`RecordKeyInput`, `RecordKeyValidationOptions`, `RecordKeyValidationIssue`\> \| `Validator`<`RecordOperation`, `RecordOperationValidationOptions`, `RecordOperationValidationIssue`\> \| `Validator`<`RecordQueryExpression`, `RecordQueryExpressionValidationOptions`, `RecordQueryExpressionValidationIssue`\> \| `Validator`<`RecordRelationshipInput`, `RecordRelationshipValidationOptions`, `RecordRelationshipValidationIssue`\> \| `Validator`<`string`, `RecordTypeValidationOptions`, `RecordTypeValidationIssue`\> \| `Validator`<`RelatedRecordInput`, `RelatedRecordValidationOptions`, `RelatedRecordValidationIssue`\> \| `Validator`<`RecordFieldDefinitionInput`, `RecordFieldDefinitionValidationOptions`, `RecordFieldDefinitionIssue`\>\>

#### Returns

`undefined` \| `ValidatorForFn`<`Validator`<`unknown`[], `ArrayValidationOptions`, `ArrayValidationIssue`\> \| `Validator`<`boolean`, `undefined`, `TypeIssue`\> \| `Validator`<`Date`, `DateValidationOptions`, `DateValidationIssue`\> \| `Validator`<`number`, `NumberValidationOptions`, `NumberValidationIssue`\> \| `Validator`<`unknown`, `ValidationOptions`, `TypeIssue`\> \| `Validator`<`string`, `StringValidationOptions`, `StringValidationIssue`\> \| `Validator`<`InitializedRecord`, `RecordValidationOptions`, `RecordValidationIssue`\> \| `Validator`<`RecordAttributeInput`, `RecordAttributeValidationOptions`, `RecordAttributeValidationIssue`\> \| `Validator`<`RecordIdentity`, `RecordIdentityValidationOptions`, `RecordIdentityValidationIssue`\> \| `Validator`<`RecordKeyInput`, `RecordKeyValidationOptions`, `RecordKeyValidationIssue`\> \| `Validator`<`RecordOperation`, `RecordOperationValidationOptions`, `RecordOperationValidationIssue`\> \| `Validator`<`RecordQueryExpression`, `RecordQueryExpressionValidationOptions`, `RecordQueryExpressionValidationIssue`\> \| `Validator`<`RecordRelationshipInput`, `RecordRelationshipValidationOptions`, `RecordRelationshipValidationIssue`\> \| `Validator`<`string`, `RecordTypeValidationOptions`, `RecordTypeValidationIssue`\> \| `Validator`<`RelatedRecordInput`, `RelatedRecordValidationOptions`, `RelatedRecordValidationIssue`\> \| `Validator`<`RecordFieldDefinitionInput`, `RecordFieldDefinitionValidationOptions`, `RecordFieldDefinitionIssue`\>\>

#### Defined in

packages/@orbit/records/dist/modules/record-source.d.ts:34

## Methods

### \_pull

▸ **_pull**(`query`): `Promise`<`FullResponse`<`undefined`, [`JSONAPIResponse`](../interfaces/JSONAPIResponse.md)[], `RecordOperation`\>\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `query` | `RecordQuery` |

#### Returns

`Promise`<`FullResponse`<`undefined`, [`JSONAPIResponse`](../interfaces/JSONAPIResponse.md)[], `RecordOperation`\>\>

#### Inherited from

RecordPullable.\_pull

#### Defined in

[packages/@orbit/jsonapi/src/jsonapi-source.ts:319](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/jsonapi/src/jsonapi-source.ts#L319)

___

### \_push

▸ **_push**(`transform`): `Promise`<`FullResponse`<`undefined`, [`JSONAPIResponse`](../interfaces/JSONAPIResponse.md)[], `RecordOperation`\>\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `transform` | `RecordTransform` |

#### Returns

`Promise`<`FullResponse`<`undefined`, [`JSONAPIResponse`](../interfaces/JSONAPIResponse.md)[], `RecordOperation`\>\>

#### Inherited from

RecordPushable.\_push

#### Defined in

[packages/@orbit/jsonapi/src/jsonapi-source.ts:289](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/jsonapi/src/jsonapi-source.ts#L289)

___

### \_query

▸ **_query**(`query`): `Promise`<`FullResponse`<`RecordQueryResult`<`InitializedRecord`\>, [`JSONAPIResponse`](../interfaces/JSONAPIResponse.md)[], `RecordOperation`\>\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `query` | `RecordQuery` |

#### Returns

`Promise`<`FullResponse`<`RecordQueryResult`<`InitializedRecord`\>, [`JSONAPIResponse`](../interfaces/JSONAPIResponse.md)[], `RecordOperation`\>\>

#### Inherited from

RecordQueryable.\_query

#### Defined in

[packages/@orbit/jsonapi/src/jsonapi-source.ts:345](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/jsonapi/src/jsonapi-source.ts#L345)

___

### \_update

▸ **_update**(`transform`): `Promise`<`FullResponse`<`RecordTransformResult`<`InitializedRecord`\>, [`JSONAPIResponse`](../interfaces/JSONAPIResponse.md)[], `RecordOperation`\>\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `transform` | `RecordTransform` |

#### Returns

`Promise`<`FullResponse`<`RecordTransformResult`<`InitializedRecord`\>, [`JSONAPIResponse`](../interfaces/JSONAPIResponse.md)[], `RecordOperation`\>\>

#### Inherited from

RecordUpdatable.\_update

#### Defined in

[packages/@orbit/jsonapi/src/jsonapi-source.ts:376](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/jsonapi/src/jsonapi-source.ts#L376)

___

### activate

▸ **activate**(): `Promise`<`void`\>

#### Returns

`Promise`<`void`\>

#### Inherited from

RecordSource.activate

#### Defined in

packages/@orbit/data/dist/modules/source.d.ts:55

___

### deactivate

▸ **deactivate**(): `Promise`<`void`\>

#### Returns

`Promise`<`void`\>

#### Inherited from

RecordSource.deactivate

#### Defined in

packages/@orbit/data/dist/modules/source.d.ts:56

___

### emit

▸ **emit**(`event`, ...`args`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | `Event` |
| `...args` | `unknown`[] |

#### Returns

`void`

#### Inherited from

RecordSource.emit

#### Defined in

packages/@orbit/core/dist/modules/evented.d.ts:23

___

### getQueryOptions

▸ **getQueryOptions**(`query`, `expression?`): `undefined` \| `QO`

#### Parameters

| Name | Type |
| :------ | :------ |
| `query` | `Query`<`QueryExpression`\> |
| `expression?` | `QueryExpression` |

#### Returns

`undefined` \| `QO`

#### Inherited from

RecordSource.getQueryOptions

#### Defined in

packages/@orbit/data/dist/modules/source.d.ts:47

___

### getTransformOptions

▸ **getTransformOptions**(`transform`, `operation?`): `undefined` \| `TO`

#### Parameters

| Name | Type |
| :------ | :------ |
| `transform` | `Transform`<`Operation`\> |
| `operation?` | `Operation` |

#### Returns

`undefined` \| `TO`

#### Inherited from

RecordSource.getTransformOptions

#### Defined in

packages/@orbit/data/dist/modules/source.d.ts:48

___

### listeners

▸ **listeners**(`event`): `Listener`[]

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | `Event` |

#### Returns

`Listener`[]

#### Inherited from

RecordSource.listeners

#### Defined in

packages/@orbit/core/dist/modules/evented.d.ts:24

___

### off

▸ **off**(`event`, `listener?`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | `Event` |
| `listener?` | `Listener` |

#### Returns

`void`

#### Inherited from

RecordSource.off

#### Defined in

packages/@orbit/core/dist/modules/evented.d.ts:21

___

### on

▸ **on**(`event`, `listener`): () => `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | `Event` |
| `listener` | `Listener` |

#### Returns

`fn`

▸ (): `void`

##### Returns

`void`

#### Inherited from

RecordSource.on

#### Defined in

packages/@orbit/core/dist/modules/evented.d.ts:20

___

### one

▸ **one**(`event`, `listener`): () => `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | `Event` |
| `listener` | `Listener` |

#### Returns

`fn`

▸ (): `void`

##### Returns

`void`

#### Inherited from

RecordSource.one

#### Defined in

packages/@orbit/core/dist/modules/evented.d.ts:22

___

### perform

▸ **perform**(`task`): `Promise`<`unknown`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `task` | `Task`<`string`, `unknown`, `unknown`\> |

#### Returns

`Promise`<`unknown`\>

#### Inherited from

RecordSource.perform

#### Defined in

packages/@orbit/data/dist/modules/source.d.ts:49

___

### pull

▸ **pull**<`RequestOperation`\>(`queryOrExpressions`, `options?`, `id?`): `Promise`<`Transform`<`RequestOperation`\>[]\>

The `pull` method accepts a query or expression(s) and returns a promise
that resolves to an array of `Transform` instances that represent the
changeset that resulted from applying the query. In other words, a `pull`
request retrieves the results of a query in `Transform` form.

#### Type parameters

| Name | Type |
| :------ | :------ |
| `RequestOperation` | extends `RecordOperation``RecordOperation` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `queryOrExpressions` | `QueryOrExpressions`<`RecordQueryExpression`, `RecordQueryBuilder`<`string`, `RecordIdentity`\>\> |
| `options?` | `DefaultRequestOptions`<`RequestOptions`\> |
| `id?` | `string` |

#### Returns

`Promise`<`Transform`<`RequestOperation`\>[]\>

#### Inherited from

RecordPullable.pull

#### Defined in

packages/@orbit/data/dist/modules/source-interfaces/pullable.d.ts:25

▸ **pull**<`RequestData`, `RequestDetails`, `RequestOperation`\>(`queryOrExpressions`, `options?`, `id?`): `Promise`<`FullResponse`<`RequestData`, `RequestDetails`, `RequestOperation`\>\>

#### Type parameters

| Name | Type |
| :------ | :------ |
| `RequestData` | extends `RecordQueryResult`<`InitializedRecord`\>`RecordQueryResult`<`InitializedRecord`\> |
| `RequestDetails` | extends [`JSONAPIResponse`](../interfaces/JSONAPIResponse.md)[][`JSONAPIResponse`](../interfaces/JSONAPIResponse.md)[] |
| `RequestOperation` | extends `RecordOperation``RecordOperation` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `queryOrExpressions` | `QueryOrExpressions`<`RecordQueryExpression`, `RecordQueryBuilder`<`string`, `RecordIdentity`\>\> |
| `options?` | `FullRequestOptions`<`RequestOptions`\> |
| `id?` | `string` |

#### Returns

`Promise`<`FullResponse`<`RequestData`, `RequestDetails`, `RequestOperation`\>\>

#### Inherited from

RecordPullable.pull

#### Defined in

packages/@orbit/data/dist/modules/source-interfaces/pullable.d.ts:26

___

### push

▸ **push**<`RequestOperation`\>(`transformOrOperations`, `options?`, `id?`): `Promise`<`Transform`<`RequestOperation`\>[]\>

The `push` method accepts a `Transform` instance as an argument and returns
a promise that resolves to an array of `Transform` instances that are
applied as a result. In other words, `push` captures the direct results
_and_ side effects of applying a `Transform` to a source.

#### Type parameters

| Name | Type |
| :------ | :------ |
| `RequestOperation` | extends `RecordOperation``RecordOperation` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `transformOrOperations` | `TransformOrOperations`<`RecordOperation`, `RecordTransformBuilder`<`string`, `RecordIdentity`, `UninitializedRecord`\>\> |
| `options?` | `DefaultRequestOptions`<`RequestOptions`\> |
| `id?` | `string` |

#### Returns

`Promise`<`Transform`<`RequestOperation`\>[]\>

#### Inherited from

RecordPushable.push

#### Defined in

packages/@orbit/data/dist/modules/source-interfaces/pushable.d.ts:23

▸ **push**<`RequestData`, `RequestDetails`, `RequestOperation`\>(`transformOrOperations`, `options`, `id?`): `Promise`<`FullResponse`<`RequestData`, `RequestDetails`, `RequestOperation`\>\>

#### Type parameters

| Name | Type |
| :------ | :------ |
| `RequestData` | extends `RecordTransformResult`<`InitializedRecord`\>`RecordTransformResult`<`InitializedRecord`\> |
| `RequestDetails` | extends [`JSONAPIResponse`](../interfaces/JSONAPIResponse.md)[][`JSONAPIResponse`](../interfaces/JSONAPIResponse.md)[] |
| `RequestOperation` | extends `RecordOperation``RecordOperation` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `transformOrOperations` | `TransformOrOperations`<`RecordOperation`, `RecordTransformBuilder`<`string`, `RecordIdentity`, `UninitializedRecord`\>\> |
| `options` | `FullRequestOptions`<`RequestOptions`\> |
| `id?` | `string` |

#### Returns

`Promise`<`FullResponse`<`RequestData`, `RequestDetails`, `RequestOperation`\>\>

#### Inherited from

RecordPushable.push

#### Defined in

packages/@orbit/data/dist/modules/source-interfaces/pushable.d.ts:24

___

### query

▸ **query**<`RequestData`\>(`queryOrExpressions`, `options?`, `id?`): `Promise`<`RequestData`\>

#### Type parameters

| Name | Type |
| :------ | :------ |
| `RequestData` | extends `RecordQueryResult`<`InitializedRecord`\>`RecordQueryResult`<`InitializedRecord`\> |

#### Parameters

| Name | Type |
| :------ | :------ |
| `queryOrExpressions` | `QueryOrExpressions`<`RecordQueryExpression`, `QB`\> |
| `options?` | `DefaultRequestOptions`<`QO`\> |
| `id?` | `string` |

#### Returns

`Promise`<`RequestData`\>

#### Inherited from

RecordQueryable.query

#### Defined in

packages/@orbit/data/dist/modules/queryable.d.ts:7

▸ **query**<`RequestData`, `RequestDetails`, `RequestOperation`\>(`queryOrExpressions`, `options`, `id?`): `Promise`<`FullResponse`<`RequestData`, `RequestDetails`, `RequestOperation`\>\>

#### Type parameters

| Name | Type |
| :------ | :------ |
| `RequestData` | extends `RecordQueryResult`<`InitializedRecord`\>`RecordQueryResult`<`InitializedRecord`\> |
| `RequestDetails` | extends [`JSONAPIResponse`](../interfaces/JSONAPIResponse.md)[][`JSONAPIResponse`](../interfaces/JSONAPIResponse.md)[] |
| `RequestOperation` | extends `RecordOperation``RecordOperation` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `queryOrExpressions` | `QueryOrExpressions`<`RecordQueryExpression`, `QB`\> |
| `options` | `FullRequestOptions`<`QO`\> |
| `id?` | `string` |

#### Returns

`Promise`<`FullResponse`<`RequestData`, `RequestDetails`, `RequestOperation`\>\>

#### Inherited from

RecordQueryable.query

#### Defined in

packages/@orbit/data/dist/modules/queryable.d.ts:8

___

### transformed

▸ **transformed**(`transforms`): `Promise`<`void`\>

Notifies listeners that this source has been transformed by emitting the
`transform` event.

Resolves when any promises returned to event listeners are resolved.

Also, adds an entry to the Source's `transformLog` for each transform.

#### Parameters

| Name | Type |
| :------ | :------ |
| `transforms` | `Transform`<`Operation`\>[] |

#### Returns

`Promise`<`void`\>

#### Inherited from

RecordSource.transformed

#### Defined in

packages/@orbit/data/dist/modules/source.d.ts:65

___

### update

▸ **update**<`RequestData`\>(`transformOrOperations`, `options?`, `id?`): `Promise`<`RequestData`\>

#### Type parameters

| Name | Type |
| :------ | :------ |
| `RequestData` | extends `RecordTransformResult`<`InitializedRecord`\>`RecordTransformResult`<`InitializedRecord`\> |

#### Parameters

| Name | Type |
| :------ | :------ |
| `transformOrOperations` | `TransformOrOperations`<`RecordOperation`, `TB`\> |
| `options?` | `DefaultRequestOptions`<`TO`\> |
| `id?` | `string` |

#### Returns

`Promise`<`RequestData`\>

#### Inherited from

RecordUpdatable.update

#### Defined in

packages/@orbit/data/dist/modules/updatable.d.ts:6

▸ **update**<`RequestData`, `RequestDetails`, `RequestOperation`\>(`transformOrOperations`, `options`, `id?`): `Promise`<`FullResponse`<`RequestData`, `RequestDetails`, `RequestOperation`\>\>

#### Type parameters

| Name | Type |
| :------ | :------ |
| `RequestData` | extends `RecordTransformResult`<`InitializedRecord`\>`RecordTransformResult`<`InitializedRecord`\> |
| `RequestDetails` | extends [`JSONAPIResponse`](../interfaces/JSONAPIResponse.md)[][`JSONAPIResponse`](../interfaces/JSONAPIResponse.md)[] |
| `RequestOperation` | extends `RecordOperation``RecordOperation` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `transformOrOperations` | `TransformOrOperations`<`RecordOperation`, `TB`\> |
| `options` | `FullRequestOptions`<`TO`\> |
| `id?` | `string` |

#### Returns

`Promise`<`FullResponse`<`RequestData`, `RequestDetails`, `RequestOperation`\>\>

#### Inherited from

RecordUpdatable.update

#### Defined in

packages/@orbit/data/dist/modules/updatable.d.ts:7

___

### upgrade

▸ **upgrade**(): `Promise`<`void`\>

Upgrade source as part of a schema upgrade.

#### Returns

`Promise`<`void`\>

#### Inherited from

RecordSource.upgrade

#### Defined in

packages/@orbit/records/dist/modules/record-source.d.ts:40
