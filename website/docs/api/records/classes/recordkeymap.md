---
id: "RecordKeyMap"
title: "Class: RecordKeyMap"
sidebar_label: "RecordKeyMap"
sidebar_position: 0
custom_edit_url: null
---

Maintains a map between records' ids and keys.

## Constructors

### constructor

• **new RecordKeyMap**()

#### Defined in

[packages/@orbit/records/src/record-key-map.ts:11](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-key-map.ts#L11)

## Methods

### idFromKeys

▸ **idFromKeys**(`type`, `keys`): `undefined` \| `string`

Given a record, find the cached id if it exists.

#### Parameters

| Name | Type |
| :------ | :------ |
| `type` | `string` |
| `keys` | `Dict`<`string`\> |

#### Returns

`undefined` \| `string`

#### Defined in

[packages/@orbit/records/src/record-key-map.ts:59](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-key-map.ts#L59)

___

### idToKey

▸ **idToKey**(`type`, `keyName`, `idValue`): `undefined` \| `string`

Return a key value given a model type, key name, and id.

#### Parameters

| Name | Type |
| :------ | :------ |
| `type` | `string` |
| `keyName` | `string` |
| `idValue` | `string` |

#### Returns

`undefined` \| `string`

#### Defined in

[packages/@orbit/records/src/record-key-map.ts:26](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-key-map.ts#L26)

___

### keyToId

▸ **keyToId**(`type`, `keyName`, `keyValue`): `undefined` \| `string`

Return an id value given a model type, key name, and key value.

#### Parameters

| Name | Type |
| :------ | :------ |
| `type` | `string` |
| `keyName` | `string` |
| `keyValue` | `string` |

#### Returns

`undefined` \| `string`

#### Defined in

[packages/@orbit/records/src/record-key-map.ts:33](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-key-map.ts#L33)

___

### pushRecord

▸ **pushRecord**(`record`): `void`

Store the id and key values of a record in this key map.

#### Parameters

| Name | Type |
| :------ | :------ |
| `record` | [`InitializedRecord`](../interfaces/InitializedRecord.md) \| [`UninitializedRecord`](../interfaces/UninitializedRecord.md) |

#### Returns

`void`

#### Defined in

[packages/@orbit/records/src/record-key-map.ts:40](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-key-map.ts#L40)

___

### reset

▸ **reset**(): `void`

Resets the contents of the key map.

#### Returns

`void`

#### Defined in

[packages/@orbit/records/src/record-key-map.ts:18](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-key-map.ts#L18)
