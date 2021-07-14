---
id: "AsyncRecordAccessor"
title: "Interface: AsyncRecordAccessor"
sidebar_label: "AsyncRecordAccessor"
sidebar_position: 0
custom_edit_url: null
---

## Hierarchy

- [`BaseRecordAccessor`](BaseRecordAccessor.md)

  ↳ **`AsyncRecordAccessor`**

## Implemented by

- [`AsyncRecordCache`](../classes/AsyncRecordCache.md)

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

### addInverseRelationshipsAsync

▸ **addInverseRelationshipsAsync**(`relationships`): `Promise`<`void`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `relationships` | [`RecordRelationshipIdentity`](RecordRelationshipIdentity.md)[] |

#### Returns

`Promise`<`void`\>

#### Defined in

[record-cache/src/record-accessor.ts:95](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/record-cache/src/record-accessor.ts#L95)

___

### applyRecordChangesetAsync

▸ **applyRecordChangesetAsync**(`changeset`): `Promise`<`void`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `changeset` | [`RecordChangeset`](RecordChangeset.md) |

#### Returns

`Promise`<`void`\>

#### Defined in

[record-cache/src/record-accessor.ts:101](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/record-cache/src/record-accessor.ts#L101)

___

### getInverseRelationshipsAsync

▸ **getInverseRelationshipsAsync**(`recordIdentityOrIdentities`): `Promise`<[`RecordRelationshipIdentity`](RecordRelationshipIdentity.md)[]\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `recordIdentityOrIdentities` | `RecordIdentity` \| `RecordIdentity`[] |

#### Returns

`Promise`<[`RecordRelationshipIdentity`](RecordRelationshipIdentity.md)[]\>

#### Defined in

[record-cache/src/record-accessor.ts:82](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/record-cache/src/record-accessor.ts#L82)

___

### getRecordAsync

▸ **getRecordAsync**(`recordIdentity`): `Promise`<`RecordOperationResult`<`InitializedRecord`\>\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `recordIdentity` | `RecordIdentity` |

#### Returns

`Promise`<`RecordOperationResult`<`InitializedRecord`\>\>

#### Defined in

[record-cache/src/record-accessor.ts:68](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/record-cache/src/record-accessor.ts#L68)

___

### getRecordsAsync

▸ **getRecordsAsync**(`typeOrIdentities?`): `Promise`<`InitializedRecord`[]\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `typeOrIdentities?` | `string` \| `RecordIdentity`[] |

#### Returns

`Promise`<`InitializedRecord`[]\>

#### Defined in

[record-cache/src/record-accessor.ts:71](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/record-cache/src/record-accessor.ts#L71)

___

### getRelatedRecordAsync

▸ **getRelatedRecordAsync**(`identity`, `relationship`): `Promise`<`undefined` \| ``null`` \| `RecordIdentity`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `identity` | `RecordIdentity` |
| `relationship` | `string` |

#### Returns

`Promise`<`undefined` \| ``null`` \| `RecordIdentity`\>

#### Defined in

[record-cache/src/record-accessor.ts:74](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/record-cache/src/record-accessor.ts#L74)

___

### getRelatedRecordsAsync

▸ **getRelatedRecordsAsync**(`identity`, `relationship`): `Promise`<`undefined` \| `RecordIdentity`[]\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `identity` | `RecordIdentity` |
| `relationship` | `string` |

#### Returns

`Promise`<`undefined` \| `RecordIdentity`[]\>

#### Defined in

[record-cache/src/record-accessor.ts:78](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/record-cache/src/record-accessor.ts#L78)

___

### removeInverseRelationshipsAsync

▸ **removeInverseRelationshipsAsync**(`relationships`): `Promise`<`void`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `relationships` | [`RecordRelationshipIdentity`](RecordRelationshipIdentity.md)[] |

#### Returns

`Promise`<`void`\>

#### Defined in

[record-cache/src/record-accessor.ts:98](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/record-cache/src/record-accessor.ts#L98)

___

### removeRecordAsync

▸ **removeRecordAsync**(`recordIdentity`): `Promise`<`RecordOperationResult`<`InitializedRecord`\>\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `recordIdentity` | `RecordIdentity` |

#### Returns

`Promise`<`RecordOperationResult`<`InitializedRecord`\>\>

#### Defined in

[record-cache/src/record-accessor.ts:89](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/record-cache/src/record-accessor.ts#L89)

___

### removeRecordsAsync

▸ **removeRecordsAsync**(`recordIdentities`): `Promise`<`InitializedRecord`[]\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `recordIdentities` | `RecordIdentity`[] |

#### Returns

`Promise`<`InitializedRecord`[]\>

#### Defined in

[record-cache/src/record-accessor.ts:92](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/record-cache/src/record-accessor.ts#L92)

___

### setRecordAsync

▸ **setRecordAsync**(`record`): `Promise`<`void`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `record` | `InitializedRecord` |

#### Returns

`Promise`<`void`\>

#### Defined in

[record-cache/src/record-accessor.ts:87](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/record-cache/src/record-accessor.ts#L87)

___

### setRecordsAsync

▸ **setRecordsAsync**(`records`): `Promise`<`void`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `records` | `InitializedRecord`[] |

#### Returns

`Promise`<`void`\>

#### Defined in

[record-cache/src/record-accessor.ts:88](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/record-cache/src/record-accessor.ts#L88)
