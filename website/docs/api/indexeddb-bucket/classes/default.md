---
id: "default"
title: "Class: default"
sidebar_label: "default"
sidebar_position: 0
custom_edit_url: null
---

Bucket for persisting transient data in IndexedDB.

## Hierarchy

- `Bucket`

  ↳ **`default`**

## Constructors

### constructor

• **new default**(`settings?`)

Create a new IndexedDBBucket.

#### Parameters

| Name | Type |
| :------ | :------ |
| `settings` | [`IndexedDBBucketSettings`](../interfaces/IndexedDBBucketSettings.md) |

#### Overrides

Bucket.constructor

#### Defined in

[indexeddb-bucket/src/bucket.ts:25](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/indexeddb-bucket/src/bucket.ts#L25)

## Accessors

### dbName

• `get` **dbName**(): `string`

IndexedDB database name.

Defaults to 'orbit-bucket', which can be overridden in the constructor.

#### Returns

`string`

#### Defined in

[indexeddb-bucket/src/bucket.ts:61](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/indexeddb-bucket/src/bucket.ts#L61)

___

### dbStoreName

• `get` **dbStoreName**(): `string`

IndexedDB ObjectStore name.

Defaults to 'settings', which can be overridden in the constructor.

#### Returns

`string`

#### Defined in

[indexeddb-bucket/src/bucket.ts:70](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/indexeddb-bucket/src/bucket.ts#L70)

___

### dbVersion

• `get` **dbVersion**(): `number`

The version to specify when opening the IndexedDB database.

IndexedDB's default verions is 1.

#### Returns

`number`

#### Defined in

[indexeddb-bucket/src/bucket.ts:52](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/indexeddb-bucket/src/bucket.ts#L52)

___

### isDBOpen

• `get` **isDBOpen**(): `boolean`

#### Returns

`boolean`

#### Defined in

[indexeddb-bucket/src/bucket.ts:74](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/indexeddb-bucket/src/bucket.ts#L74)

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

### \_applySettings

▸ **_applySettings**(`settings`): `Promise`<`void`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `settings` | [`IndexedDBBucketSettings`](../interfaces/IndexedDBBucketSettings.md) |

#### Returns

`Promise`<`void`\>

#### Overrides

Bucket.\_applySettings

#### Defined in

[indexeddb-bucket/src/bucket.ts:40](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/indexeddb-bucket/src/bucket.ts#L40)

___

### clear

▸ **clear**(): `Promise`<`void`\>

#### Returns

`Promise`<`void`\>

#### Overrides

Bucket.clear

#### Defined in

[indexeddb-bucket/src/bucket.ts:216](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/indexeddb-bucket/src/bucket.ts#L216)

___

### closeDB

▸ **closeDB**(): `void`

#### Returns

`void`

#### Defined in

[indexeddb-bucket/src/bucket.ts:109](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/indexeddb-bucket/src/bucket.ts#L109)

___

### createDB

▸ **createDB**(`db`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `db` | `IDBDatabase` |

#### Returns

`void`

#### Defined in

[indexeddb-bucket/src/bucket.ts:121](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/indexeddb-bucket/src/bucket.ts#L121)

___

### deleteDB

▸ **deleteDB**(): `Promise`<`void`\>

#### Returns

`Promise`<`void`\>

#### Defined in

[indexeddb-bucket/src/bucket.ts:137](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/indexeddb-bucket/src/bucket.ts#L137)

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

### getItem

▸ **getItem**(`key`): `Promise`<`any`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `key` | `string` |

#### Returns

`Promise`<`any`\>

#### Overrides

Bucket.getItem

#### Defined in

[indexeddb-bucket/src/bucket.ts:156](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/indexeddb-bucket/src/bucket.ts#L156)

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

### migrateDB

▸ **migrateDB**(`db`, `event`): `void`

Migrate database.

#### Parameters

| Name | Type |
| :------ | :------ |
| `db` | `IDBDatabase` |
| `event` | `IDBVersionChangeEvent` |

#### Returns

`void`

#### Defined in

[indexeddb-bucket/src/bucket.ts:128](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/indexeddb-bucket/src/bucket.ts#L128)

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

### openDB

▸ **openDB**(): `Promise`<`IDBDatabase`\>

#### Returns

`Promise`<`IDBDatabase`\>

#### Defined in

[indexeddb-bucket/src/bucket.ts:78](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/indexeddb-bucket/src/bucket.ts#L78)

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

[indexeddb-bucket/src/bucket.ts:197](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/indexeddb-bucket/src/bucket.ts#L197)

___

### reopenDB

▸ **reopenDB**(): `Promise`<`IDBDatabase`\>

#### Returns

`Promise`<`IDBDatabase`\>

#### Defined in

[indexeddb-bucket/src/bucket.ts:116](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/indexeddb-bucket/src/bucket.ts#L116)

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

[indexeddb-bucket/src/bucket.ts:176](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/indexeddb-bucket/src/bucket.ts#L176)

___

### upgrade

▸ **upgrade**(`settings`): `Promise`<`void`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `settings` | [`IndexedDBBucketSettings`](../interfaces/IndexedDBBucketSettings.md) |

#### Returns

`Promise`<`void`\>

#### Overrides

Bucket.upgrade

#### Defined in

[indexeddb-bucket/src/bucket.ts:34](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/indexeddb-bucket/src/bucket.ts#L34)
