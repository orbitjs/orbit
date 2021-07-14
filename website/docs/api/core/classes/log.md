---
id: "Log"
title: "Class: Log"
sidebar_label: "Log"
sidebar_position: 0
custom_edit_url: null
---

Logs track a series of unique events that have occurred. Each event is
tracked based on its unique id. The log only tracks the ids but currently
does not track any details.

Logs can automatically be persisted by assigning them a bucket.

## Hierarchy

- [`Evented`](../interfaces/Evented.md)<``"append"`` \| ``"truncate"`` \| ``"rollback"`` \| ``"clear"`` \| ``"change"``\>

  ↳ **`Log`**

## Constructors

### constructor

• **new Log**(`options?`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `options` | [`LogOptions`](../interfaces/LogOptions.md) |

#### Inherited from

Evented<'append' \| 'truncate' \| 'rollback' \| 'clear' \| 'change'\>.constructor

#### Defined in

[packages/@orbit/core/src/log.ts:33](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/core/src/log.ts#L33)

## Properties

### reified

• **reified**: `Promise`<`void`\>

#### Defined in

[packages/@orbit/core/src/log.ts:31](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/core/src/log.ts#L31)

## Accessors

### bucket

• `get` **bucket**(): `undefined` \| [`Bucket`](Bucket.md)<`string`[]\>

#### Returns

`undefined` \| [`Bucket`](Bucket.md)<`string`[]\>

#### Defined in

[packages/@orbit/core/src/log.ts:48](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/core/src/log.ts#L48)

___

### entries

• `get` **entries**(): `string`[]

#### Returns

`string`[]

#### Defined in

[packages/@orbit/core/src/log.ts:56](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/core/src/log.ts#L56)

___

### head

• `get` **head**(): `string`

#### Returns

`string`

#### Defined in

[packages/@orbit/core/src/log.ts:52](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/core/src/log.ts#L52)

___

### length

• `get` **length**(): `number`

#### Returns

`number`

#### Defined in

[packages/@orbit/core/src/log.ts:60](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/core/src/log.ts#L60)

___

### name

• `get` **name**(): `undefined` \| `string`

#### Returns

`undefined` \| `string`

#### Defined in

[packages/@orbit/core/src/log.ts:44](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/core/src/log.ts#L44)

## Methods

### after

▸ **after**(`id`, `relativePosition?`): `string`[]

#### Parameters

| Name | Type | Default value |
| :------ | :------ | :------ |
| `id` | `string` | `undefined` |
| `relativePosition` | `number` | `0` |

#### Returns

`string`[]

#### Defined in

[packages/@orbit/core/src/log.ts:89](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/core/src/log.ts#L89)

___

### append

▸ **append**(...`ids`): `Promise`<`void`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `...ids` | `string`[] |

#### Returns

`Promise`<`void`\>

#### Defined in

[packages/@orbit/core/src/log.ts:64](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/core/src/log.ts#L64)

___

### before

▸ **before**(`id`, `relativePosition?`): `string`[]

#### Parameters

| Name | Type | Default value |
| :------ | :------ | :------ |
| `id` | `string` | `undefined` |
| `relativePosition` | `number` | `0` |

#### Returns

`string`[]

#### Defined in

[packages/@orbit/core/src/log.ts:75](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/core/src/log.ts#L75)

___

### clear

▸ **clear**(): `Promise`<`void`\>

#### Returns

`Promise`<`void`\>

#### Defined in

[packages/@orbit/core/src/log.ts:158](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/core/src/log.ts#L158)

___

### contains

▸ **contains**(`id`): `boolean`

#### Parameters

| Name | Type |
| :------ | :------ |
| `id` | `string` |

#### Returns

`boolean`

#### Defined in

[packages/@orbit/core/src/log.ts:170](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/core/src/log.ts#L170)

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

[Evented](../interfaces/Evented.md).[emit](../interfaces/Evented.md#emit)

#### Defined in

[packages/@orbit/core/src/evented.ts:29](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/core/src/evented.ts#L29)

___

### listeners

▸ **listeners**(`event`): [`Listener`](../modules.md#listener)[]

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | `Event` |

#### Returns

[`Listener`](../modules.md#listener)[]

#### Inherited from

[Evented](../interfaces/Evented.md).[listeners](../interfaces/Evented.md#listeners)

#### Defined in

[packages/@orbit/core/src/evented.ts:30](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/core/src/evented.ts#L30)

___

### off

▸ **off**(`event`, `listener?`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | `Event` |
| `listener?` | [`Listener`](../modules.md#listener) |

#### Returns

`void`

#### Inherited from

[Evented](../interfaces/Evented.md).[off](../interfaces/Evented.md#off)

#### Defined in

[packages/@orbit/core/src/evented.ts:27](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/core/src/evented.ts#L27)

___

### on

▸ **on**(`event`, `listener`): () => `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | `Event` |
| `listener` | [`Listener`](../modules.md#listener) |

#### Returns

`fn`

▸ (): `void`

##### Returns

`void`

#### Inherited from

[Evented](../interfaces/Evented.md).[on](../interfaces/Evented.md#on)

#### Defined in

[packages/@orbit/core/src/evented.ts:26](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/core/src/evented.ts#L26)

___

### one

▸ **one**(`event`, `listener`): () => `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | `Event` |
| `listener` | [`Listener`](../modules.md#listener) |

#### Returns

`fn`

▸ (): `void`

##### Returns

`void`

#### Inherited from

[Evented](../interfaces/Evented.md).[one](../interfaces/Evented.md#one)

#### Defined in

[packages/@orbit/core/src/evented.ts:28](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/core/src/evented.ts#L28)

___

### rollback

▸ **rollback**(`id`, `relativePosition?`): `Promise`<`void`\>

#### Parameters

| Name | Type | Default value |
| :------ | :------ | :------ |
| `id` | `string` | `undefined` |
| `relativePosition` | `number` | `0` |

#### Returns

`Promise`<`void`\>

#### Defined in

[packages/@orbit/core/src/log.ts:133](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/core/src/log.ts#L133)

___

### truncate

▸ **truncate**(`id`, `relativePosition?`): `Promise`<`void`\>

#### Parameters

| Name | Type | Default value |
| :------ | :------ | :------ |
| `id` | `string` | `undefined` |
| `relativePosition` | `number` | `0` |

#### Returns

`Promise`<`void`\>

#### Defined in

[packages/@orbit/core/src/log.ts:103](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/core/src/log.ts#L103)
