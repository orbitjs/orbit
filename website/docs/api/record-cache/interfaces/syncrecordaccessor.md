---
id: "SyncRecordAccessor"
title: "Interface: SyncRecordAccessor"
sidebar_label: "SyncRecordAccessor"
sidebar_position: 0
custom_edit_url: null
---

## Hierarchy

- [`BaseRecordAccessor`](BaseRecordAccessor.md)

  ↳ **`SyncRecordAccessor`**

## Implemented by

- [`SyncRecordCache`](../classes/SyncRecordCache.md)

## Properties

### keyMap

• `Optional` **keyMap**: `RecordKeyMap`

#### Inherited from

[BaseRecordAccessor](BaseRecordAccessor.md).[keyMap](BaseRecordAccessor.md#keymap)

#### Defined in

[record-cache/src/record-accessor.ts:21](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/record-cache/src/record-accessor.ts#L21)

___

### name

• `Optional` **name**: `string`

#### Inherited from

[BaseRecordAccessor](BaseRecordAccessor.md).[name](BaseRecordAccessor.md#name)

#### Defined in

[record-cache/src/record-accessor.ts:20](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/record-cache/src/record-accessor.ts#L20)

___

### schema

• **schema**: `RecordSchema`

#### Inherited from

[BaseRecordAccessor](BaseRecordAccessor.md).[schema](BaseRecordAccessor.md#schema)

#### Defined in

[record-cache/src/record-accessor.ts:22](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/record-cache/src/record-accessor.ts#L22)

## Methods

### addInverseRelationshipsSync

▸ **addInverseRelationshipsSync**(`relationships`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `relationships` | [`RecordRelationshipIdentity`](RecordRelationshipIdentity.md)[] |

#### Returns

`void`

#### Defined in

[record-cache/src/record-accessor.ts:57](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/record-cache/src/record-accessor.ts#L57)

___

### applyRecordChangesetSync

▸ **applyRecordChangesetSync**(`changeset`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `changeset` | [`RecordChangeset`](RecordChangeset.md) |

#### Returns

`void`

#### Defined in

[record-cache/src/record-accessor.ts:63](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/record-cache/src/record-accessor.ts#L63)

___

### getInverseRelationshipsSync

▸ **getInverseRelationshipsSync**(`recordIdentityOrIdentities`): [`RecordRelationshipIdentity`](RecordRelationshipIdentity.md)[]

#### Parameters

| Name | Type |
| :------ | :------ |
| `recordIdentityOrIdentities` | `RecordIdentity` \| `RecordIdentity`[] |

#### Returns

[`RecordRelationshipIdentity`](RecordRelationshipIdentity.md)[]

#### Defined in

[record-cache/src/record-accessor.ts:46](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/record-cache/src/record-accessor.ts#L46)

___

### getRecordSync

▸ **getRecordSync**(`recordIdentity`): `RecordOperationResult`<`InitializedRecord`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `recordIdentity` | `RecordIdentity` |

#### Returns

`RecordOperationResult`<`InitializedRecord`\>

#### Defined in

[record-cache/src/record-accessor.ts:34](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/record-cache/src/record-accessor.ts#L34)

___

### getRecordsSync

▸ **getRecordsSync**(`typeOrIdentities?`): `InitializedRecord`[]

#### Parameters

| Name | Type |
| :------ | :------ |
| `typeOrIdentities?` | `string` \| `RecordIdentity`[] |

#### Returns

`InitializedRecord`[]

#### Defined in

[record-cache/src/record-accessor.ts:35](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/record-cache/src/record-accessor.ts#L35)

___

### getRelatedRecordSync

▸ **getRelatedRecordSync**(`identity`, `relationship`): `undefined` \| ``null`` \| `RecordIdentity`

#### Parameters

| Name | Type |
| :------ | :------ |
| `identity` | `RecordIdentity` |
| `relationship` | `string` |

#### Returns

`undefined` \| ``null`` \| `RecordIdentity`

#### Defined in

[record-cache/src/record-accessor.ts:38](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/record-cache/src/record-accessor.ts#L38)

___

### getRelatedRecordsSync

▸ **getRelatedRecordsSync**(`identity`, `relationship`): `undefined` \| `RecordIdentity`[]

#### Parameters

| Name | Type |
| :------ | :------ |
| `identity` | `RecordIdentity` |
| `relationship` | `string` |

#### Returns

`undefined` \| `RecordIdentity`[]

#### Defined in

[record-cache/src/record-accessor.ts:42](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/record-cache/src/record-accessor.ts#L42)

___

### removeInverseRelationshipsSync

▸ **removeInverseRelationshipsSync**(`relationships`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `relationships` | [`RecordRelationshipIdentity`](RecordRelationshipIdentity.md)[] |

#### Returns

`void`

#### Defined in

[record-cache/src/record-accessor.ts:60](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/record-cache/src/record-accessor.ts#L60)

___

### removeRecordSync

▸ **removeRecordSync**(`recordIdentity`): `RecordOperationResult`<`InitializedRecord`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `recordIdentity` | `RecordIdentity` |

#### Returns

`RecordOperationResult`<`InitializedRecord`\>

#### Defined in

[record-cache/src/record-accessor.ts:53](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/record-cache/src/record-accessor.ts#L53)

___

### removeRecordsSync

▸ **removeRecordsSync**(`recordIdentities`): `InitializedRecord`[]

#### Parameters

| Name | Type |
| :------ | :------ |
| `recordIdentities` | `RecordIdentity`[] |

#### Returns

`InitializedRecord`[]

#### Defined in

[record-cache/src/record-accessor.ts:56](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/record-cache/src/record-accessor.ts#L56)

___

### setRecordSync

▸ **setRecordSync**(`record`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `record` | `InitializedRecord` |

#### Returns

`void`

#### Defined in

[record-cache/src/record-accessor.ts:51](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/record-cache/src/record-accessor.ts#L51)

___

### setRecordsSync

▸ **setRecordsSync**(`records`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `records` | `InitializedRecord`[] |

#### Returns

`void`

#### Defined in

[record-cache/src/record-accessor.ts:52](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/record-cache/src/record-accessor.ts#L52)
