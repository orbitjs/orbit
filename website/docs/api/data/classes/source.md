---
id: "Source"
title: "Class: Source<QueryOptions, TransformOptions, QueryBuilder, TransformBuilder>"
sidebar_label: "Source"
sidebar_position: 0
custom_edit_url: null
---

Base class for sources.

## Type parameters

| Name | Type |
| :------ | :------ |
| `QueryOptions` | extends [`RequestOptions`](../interfaces/RequestOptions.md)[`RequestOptions`](../interfaces/RequestOptions.md) |
| `TransformOptions` | extends [`RequestOptions`](../interfaces/RequestOptions.md)[`RequestOptions`](../interfaces/RequestOptions.md) |
| `QueryBuilder` | `unknown` |
| `TransformBuilder` | `unknown` |

## Hierarchy

- `Evented`

- `Performer`

  ↳ **`Source`**

## Constructors

### constructor

• **new Source**<`QueryOptions`, `TransformOptions`, `QueryBuilder`, `TransformBuilder`\>(`settings?`)

#### Type parameters

| Name | Type |
| :------ | :------ |
| `QueryOptions` | extends [`RequestOptions`](../interfaces/RequestOptions.md)[`RequestOptions`](../interfaces/RequestOptions.md) |
| `TransformOptions` | extends [`RequestOptions`](../interfaces/RequestOptions.md)[`RequestOptions`](../interfaces/RequestOptions.md) |
| `QueryBuilder` | `unknown` |
| `TransformBuilder` | `unknown` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `settings` | [`SourceSettings`](../interfaces/SourceSettings.md)<`QueryOptions`, `TransformOptions`, `QueryBuilder`, `TransformBuilder`\> |

#### Inherited from

Evented.constructor

#### Defined in

[packages/@orbit/data/src/source.ts:77](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/data/src/source.ts#L77)

## Accessors

### activated

• `get` **activated**(): `Promise`<`void`\>

#### Returns

`Promise`<`void`\>

#### Defined in

[packages/@orbit/data/src/source.ts:224](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/data/src/source.ts#L224)

___

### bucket

• `get` **bucket**(): `undefined` \| `Bucket`<`unknown`\>

#### Returns

`undefined` \| `Bucket`<`unknown`\>

#### Defined in

[packages/@orbit/data/src/source.ts:130](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/data/src/source.ts#L130)

___

### defaultQueryOptions

• `get` **defaultQueryOptions**(): `undefined` \| [`DefaultRequestOptions`](../modules.md#defaultrequestoptions)<`QueryOptions`\>

#### Returns

`undefined` \| [`DefaultRequestOptions`](../modules.md#defaultrequestoptions)<`QueryOptions`\>

#### Defined in

[packages/@orbit/data/src/source.ts:154](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/data/src/source.ts#L154)

• `set` **defaultQueryOptions**(`options`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `options` | `undefined` \| [`DefaultRequestOptions`](../modules.md#defaultrequestoptions)<`QueryOptions`\> |

#### Returns

`void`

#### Defined in

[packages/@orbit/data/src/source.ts:158](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/data/src/source.ts#L158)

___

### defaultTransformOptions

• `get` **defaultTransformOptions**(): `undefined` \| [`DefaultRequestOptions`](../modules.md#defaultrequestoptions)<`TransformOptions`\>

#### Returns

`undefined` \| [`DefaultRequestOptions`](../modules.md#defaultrequestoptions)<`TransformOptions`\>

#### Defined in

[packages/@orbit/data/src/source.ts:164](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/data/src/source.ts#L164)

• `set` **defaultTransformOptions**(`options`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `options` | `undefined` \| [`DefaultRequestOptions`](../modules.md#defaultrequestoptions)<`TransformOptions`\> |

#### Returns

`void`

#### Defined in

[packages/@orbit/data/src/source.ts:170](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/data/src/source.ts#L170)

___

### name

• `get` **name**(): `undefined` \| `string`

#### Returns

`undefined` \| `string`

#### Defined in

[packages/@orbit/data/src/source.ts:126](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/data/src/source.ts#L126)

___

### queryBuilder

• `get` **queryBuilder**(): `undefined` \| `QueryBuilder`

#### Returns

`undefined` \| `QueryBuilder`

#### Defined in

[packages/@orbit/data/src/source.ts:146](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/data/src/source.ts#L146)

___

### requestQueue

• `get` **requestQueue**(): `TaskQueue`<`string`, `unknown`, `unknown`, `unknown`\>

#### Returns

`TaskQueue`<`string`, `unknown`, `unknown`, `unknown`\>

#### Defined in

[packages/@orbit/data/src/source.ts:138](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/data/src/source.ts#L138)

___

### syncQueue

• `get` **syncQueue**(): `TaskQueue`<`string`, `unknown`, `unknown`, `unknown`\>

#### Returns

`TaskQueue`<`string`, `unknown`, `unknown`, `unknown`\>

#### Defined in

[packages/@orbit/data/src/source.ts:142](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/data/src/source.ts#L142)

___

### transformBuilder

• `get` **transformBuilder**(): `undefined` \| `TransformBuilder`

#### Returns

`undefined` \| `TransformBuilder`

#### Defined in

[packages/@orbit/data/src/source.ts:150](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/data/src/source.ts#L150)

___

### transformLog

• `get` **transformLog**(): `Log`

#### Returns

`Log`

#### Defined in

[packages/@orbit/data/src/source.ts:134](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/data/src/source.ts#L134)

## Methods

### activate

▸ **activate**(): `Promise`<`void`\>

#### Returns

`Promise`<`void`\>

#### Defined in

[packages/@orbit/data/src/source.ts:231](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/data/src/source.ts#L231)

___

### deactivate

▸ **deactivate**(): `Promise`<`void`\>

#### Returns

`Promise`<`void`\>

#### Defined in

[packages/@orbit/data/src/source.ts:238](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/data/src/source.ts#L238)

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

Evented.emit

#### Defined in

packages/@orbit/core/dist/modules/evented.d.ts:23

___

### getQueryOptions

▸ **getQueryOptions**(`query`, `expression?`): `undefined` \| `QueryOptions`

#### Parameters

| Name | Type |
| :------ | :------ |
| `query` | [`Query`](../interfaces/Query.md)<[`QueryExpression`](../interfaces/QueryExpression.md)\> |
| `expression?` | [`QueryExpression`](../interfaces/QueryExpression.md) |

#### Returns

`undefined` \| `QueryOptions`

#### Defined in

[packages/@orbit/data/src/source.ts:176](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/data/src/source.ts#L176)

___

### getTransformOptions

▸ **getTransformOptions**(`transform`, `operation?`): `undefined` \| `TransformOptions`

#### Parameters

| Name | Type |
| :------ | :------ |
| `transform` | [`Transform`](../interfaces/Transform.md)<[`Operation`](../interfaces/Operation.md)\> |
| `operation?` | [`Operation`](../interfaces/Operation.md) |

#### Returns

`undefined` \| `TransformOptions`

#### Defined in

[packages/@orbit/data/src/source.ts:190](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/data/src/source.ts#L190)

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

Evented.listeners

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

Evented.off

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

Evented.on

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

Evented.one

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

Performer.perform

#### Defined in

[packages/@orbit/data/src/source.ts:205](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/data/src/source.ts#L205)

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
| `transforms` | [`Transform`](../interfaces/Transform.md)<[`Operation`](../interfaces/Operation.md)\>[] |

#### Returns

`Promise`<`void`\>

#### Defined in

[packages/@orbit/data/src/source.ts:254](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/data/src/source.ts#L254)

___

### upgrade

▸ **upgrade**(): `Promise`<`void`\>

Upgrade source as part of a schema upgrade.

#### Returns

`Promise`<`void`\>

#### Defined in

[packages/@orbit/data/src/source.ts:220](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/data/src/source.ts#L220)
