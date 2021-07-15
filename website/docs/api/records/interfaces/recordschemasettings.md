---
id: "RecordSchemaSettings"
title: "Interface: RecordSchemaSettings"
sidebar_label: "RecordSchemaSettings"
sidebar_position: 0
custom_edit_url: null
---

Settings used to initialze and/or upgrade schemas.

## Properties

### models

• `Optional` **models**: `Dict`<[`ModelDefinition`](ModelDefinition.md)\>

Map of model definitions.

#### Defined in

[packages/@orbit/records/src/record-schema.ts:100](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-schema.ts#L100)

___

### version

• `Optional` **version**: `number`

Schema version. Defaults to 1.

#### Defined in

[packages/@orbit/records/src/record-schema.ts:76](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-schema.ts#L76)

## Methods

### generateId

▸ `Optional` **generateId**(`model?`): `string`

Function used to generate record IDs.

#### Parameters

| Name | Type |
| :------ | :------ |
| `model?` | `string` |

#### Returns

`string`

#### Defined in

[packages/@orbit/records/src/record-schema.ts:81](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-schema.ts#L81)

___

### pluralize

▸ `Optional` **pluralize**(`word`): `string`

Function used to pluralize names.

**`deprecated`**

#### Parameters

| Name | Type |
| :------ | :------ |
| `word` | `string` |

#### Returns

`string`

#### Defined in

[packages/@orbit/records/src/record-schema.ts:88](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-schema.ts#L88)

___

### singularize

▸ `Optional` **singularize**(`word`): `string`

Function used to singularize names.

**`deprecated`**

#### Parameters

| Name | Type |
| :------ | :------ |
| `word` | `string` |

#### Returns

`string`

#### Defined in

[packages/@orbit/records/src/record-schema.ts:95](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-schema.ts#L95)
