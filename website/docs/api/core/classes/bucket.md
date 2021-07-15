---
id: "Bucket"
title: "Class: Bucket<Item>"
sidebar_label: "Bucket"
sidebar_position: 0
custom_edit_url: null
---

Buckets can persist state. The base `Bucket` class is abstract and should be
extended to create buckets with different persistence strategies.

Buckets have a simple map-like interface with methods like `getItem`,
`setItem`, and `removeItem`. All methods return promises to enable usage with
asynchronous stores like IndexedDB.

Buckets can be assigned a unique `namespace` in order to avoid collisions.

Buckets can be assigned a version, and can be "upgraded" to a new version.
The upgrade process allows buckets to migrate their data between versions.

## Type parameters

| Name |
| :------ |
| `Item` |

## Hierarchy

- [`Evented`](../interfaces/Evented.md)<``"upgrade"``\>

  ↳ **`Bucket`**

## Constructors

### constructor

• **new Bucket**<`Item`\>(`settings?`)

#### Type parameters

| Name | Type |
| :------ | :------ |
| `Item` | `unknown` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `settings` | [`BucketSettings`](../interfaces/BucketSettings.md) |

#### Inherited from

Evented<'upgrade'\>.constructor

#### Defined in

[packages/@orbit/core/src/bucket.ts:50](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/core/src/bucket.ts#L50)

## Accessors

### name

• `get` **name**(): `undefined` \| `string`

Name used for tracking and debugging a bucket instance.

#### Returns

`undefined` \| `string`

#### Defined in

[packages/@orbit/core/src/bucket.ts:85](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/core/src/bucket.ts#L85)

___

### namespace

• `get` **namespace**(): `string`

The namespace used by the bucket when accessing any items.

This is used to distinguish one bucket's contents from another.

#### Returns

`string`

#### Defined in

[packages/@orbit/core/src/bucket.ts:94](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/core/src/bucket.ts#L94)

___

### version

• `get` **version**(): `number`

The current version of the bucket.

This is read-only. To change versions, `upgrade` should be invoked.

#### Returns

`number`

#### Defined in

[packages/@orbit/core/src/bucket.ts:103](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/core/src/bucket.ts#L103)

## Methods

### clear

▸ `Abstract` **clear**(): `Promise`<`void`\>

Clears all items from the bucket.

#### Returns

`Promise`<`void`\>

#### Defined in

[packages/@orbit/core/src/bucket.ts:80](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/core/src/bucket.ts#L80)

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

### getItem

▸ `Abstract` **getItem**(`key`): `Promise`<`Item`\>

Retrieves an item from the bucket.

#### Parameters

| Name | Type |
| :------ | :------ |
| `key` | `string` |

#### Returns

`Promise`<`Item`\>

#### Defined in

[packages/@orbit/core/src/bucket.ts:65](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/core/src/bucket.ts#L65)

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

### removeItem

▸ `Abstract` **removeItem**(`key`): `Promise`<`void`\>

Removes an item from the bucket.

#### Parameters

| Name | Type |
| :------ | :------ |
| `key` | `string` |

#### Returns

`Promise`<`void`\>

#### Defined in

[packages/@orbit/core/src/bucket.ts:75](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/core/src/bucket.ts#L75)

___

### setItem

▸ `Abstract` **setItem**(`key`, `value`): `Promise`<`void`\>

Stores an item in the bucket.

#### Parameters

| Name | Type |
| :------ | :------ |
| `key` | `string` |
| `value` | `Item` |

#### Returns

`Promise`<`void`\>

#### Defined in

[packages/@orbit/core/src/bucket.ts:70](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/core/src/bucket.ts#L70)

___

### upgrade

▸ **upgrade**(`settings?`): `Promise`<`void`\>

Upgrades Bucket to a new version with new settings.

Settings, beyond `version`, are bucket-specific.

#### Parameters

| Name | Type |
| :------ | :------ |
| `settings` | [`BucketSettings`](../interfaces/BucketSettings.md) |

#### Returns

`Promise`<`void`\>

#### Defined in

[packages/@orbit/core/src/bucket.ts:112](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/core/src/bucket.ts#L112)
