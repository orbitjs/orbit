---
id: "default"
title: "Class: default"
sidebar_label: "default"
sidebar_position: 0
custom_edit_url: null
---

Bucket for persisting transient data in localStorage.

## Hierarchy

- `Bucket`

  ↳ **`default`**

## Constructors

### constructor

• **new default**(`settings?`)

Create a new LocalStorageBucket.

#### Parameters

| Name | Type |
| :------ | :------ |
| `settings` | [`LocalStorageBucketSettings`](../interfaces/LocalStorageBucketSettings.md) |

#### Overrides

Bucket.constructor

#### Defined in

[local-storage-bucket/src/bucket.ts:19](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/local-storage-bucket/src/bucket.ts#L19)

## Accessors

### delimiter

• `get` **delimiter**(): `string`

#### Returns

`string`

#### Defined in

[local-storage-bucket/src/bucket.ts:32](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/local-storage-bucket/src/bucket.ts#L32)

___

### name

• `get` **name**(): `undefined` \| `string`

Name used for tracking and debugging a bucket instance.

#### Returns

`undefined` \| `string`

#### Defined in

core/dist/modules/bucket.d.ts:63

___

### namespace

• `get` **namespace**(): `string`

The namespace used by the bucket when accessing any items.

This is used to distinguish one bucket's contents from another.

#### Returns

`string`

#### Defined in

core/dist/modules/bucket.d.ts:69

___

### version

• `get` **version**(): `number`

The current version of the bucket.

This is read-only. To change versions, `upgrade` should be invoked.

#### Returns

`number`

#### Defined in

core/dist/modules/bucket.d.ts:75

## Methods

### clear

▸ **clear**(): `Promise`<`void`\>

#### Returns

`Promise`<`void`\>

#### Overrides

Bucket.clear

#### Defined in

[local-storage-bucket/src/bucket.ts:59](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/local-storage-bucket/src/bucket.ts#L59)

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

Bucket.emit

#### Defined in

core/dist/modules/evented.d.ts:23

___

### getFullKeyForItem

▸ **getFullKeyForItem**(`key`): `string`

#### Parameters

| Name | Type |
| :------ | :------ |
| `key` | `string` |

#### Returns

`string`

#### Defined in

[local-storage-bucket/src/bucket.ts:36](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/local-storage-bucket/src/bucket.ts#L36)

___

### getItem

▸ **getItem**(`key`): `Promise`<`unknown`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `key` | `string` |

#### Returns

`Promise`<`unknown`\>

#### Overrides

Bucket.getItem

#### Defined in

[local-storage-bucket/src/bucket.ts:40](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/local-storage-bucket/src/bucket.ts#L40)

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

Bucket.listeners

#### Defined in

core/dist/modules/evented.d.ts:24

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

Bucket.off

#### Defined in

core/dist/modules/evented.d.ts:21

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

Bucket.on

#### Defined in

core/dist/modules/evented.d.ts:20

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

Bucket.one

#### Defined in

core/dist/modules/evented.d.ts:22

___

### removeItem

▸ **removeItem**(`key`): `Promise`<`void`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `key` | `string` |

#### Returns

`Promise`<`void`\>

#### Overrides

Bucket.removeItem

#### Defined in

[local-storage-bucket/src/bucket.ts:53](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/local-storage-bucket/src/bucket.ts#L53)

___

### setItem

▸ **setItem**(`key`, `value`): `Promise`<`void`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `key` | `string` |
| `value` | `unknown` |

#### Returns

`Promise`<`void`\>

#### Overrides

Bucket.setItem

#### Defined in

[local-storage-bucket/src/bucket.ts:47](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/local-storage-bucket/src/bucket.ts#L47)

___

### upgrade

▸ **upgrade**(`settings?`): `Promise`<`void`\>

Upgrades Bucket to a new version with new settings.

Settings, beyond `version`, are bucket-specific.

#### Parameters

| Name | Type |
| :------ | :------ |
| `settings?` | `BucketSettings` |

#### Returns

`Promise`<`void`\>

#### Inherited from

Bucket.upgrade

#### Defined in

core/dist/modules/bucket.d.ts:81
