---
id: "RecordSchema"
title: "Class: RecordSchema"
sidebar_label: "RecordSchema"
sidebar_position: 0
custom_edit_url: null
---

A `Schema` defines the models allowed in a source, including their keys,
attributes, and relationships. A single schema may be shared across multiple
sources.

## Hierarchy

- `Evented`<[`RecordSchemaEvent`](../modules.md#recordschemaevent)\>

  ↳ **`RecordSchema`**

## Constructors

### constructor

• **new RecordSchema**(`settings?`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `settings` | [`RecordSchemaSettings`](../interfaces/RecordSchemaSettings.md) |

#### Inherited from

Evented<RecordSchemaEvent\>.constructor

#### Defined in

[packages/@orbit/records/src/record-schema.ts:118](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-schema.ts#L118)

## Accessors

### models

• `get` **models**(): `Dict`<[`ModelDefinition`](../interfaces/ModelDefinition.md)\>

#### Returns

`Dict`<[`ModelDefinition`](../interfaces/ModelDefinition.md)\>

#### Defined in

[packages/@orbit/records/src/record-schema.ts:226](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-schema.ts#L226)

___

### version

• `get` **version**(): `number`

Version

#### Returns

`number`

#### Defined in

[packages/@orbit/records/src/record-schema.ts:133](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-schema.ts#L133)

## Methods

### \_deprecateRelationshipModel

▸ **_deprecateRelationshipModel**(`models`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `models` | `Dict`<[`ModelDefinition`](../interfaces/ModelDefinition.md)\> |

#### Returns

`void`

#### Defined in

[packages/@orbit/records/src/record-schema.ts:318](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-schema.ts#L318)

___

### eachAttribute

▸ **eachAttribute**(`type`, `callbackFn`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `type` | `string` |
| `callbackFn` | (`name`: `string`, `attribute`: [`AttributeDefinition`](../interfaces/AttributeDefinition.md)) => `void` |

#### Returns

`void`

#### Defined in

[packages/@orbit/records/src/record-schema.ts:285](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-schema.ts#L285)

___

### eachKey

▸ **eachKey**(`type`, `callbackFn`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `type` | `string` |
| `callbackFn` | (`name`: `string`, `key`: [`KeyDefinition`](../interfaces/KeyDefinition.md)) => `void` |

#### Returns

`void`

#### Defined in

[packages/@orbit/records/src/record-schema.ts:296](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-schema.ts#L296)

___

### eachRelationship

▸ **eachRelationship**(`type`, `callbackFn`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `type` | `string` |
| `callbackFn` | (`name`: `string`, `relationship`: [`RelationshipDefinition`](../modules.md#relationshipdefinition)) => `void` |

#### Returns

`void`

#### Defined in

[packages/@orbit/records/src/record-schema.ts:307](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-schema.ts#L307)

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

### generateId

▸ **generateId**(`type?`): `string`

Generate an id for a given model type.

#### Parameters

| Name | Type |
| :------ | :------ |
| `type?` | `string` |

#### Returns

`string`

#### Defined in

[packages/@orbit/records/src/record-schema.ts:187](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-schema.ts#L187)

___

### getAttribute

▸ **getAttribute**(`type`, `attribute`): [`AttributeDefinition`](../interfaces/AttributeDefinition.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `type` | `string` |
| `attribute` | `string` |

#### Returns

[`AttributeDefinition`](../interfaces/AttributeDefinition.md)

#### Defined in

[packages/@orbit/records/src/record-schema.ts:239](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-schema.ts#L239)

___

### getKey

▸ **getKey**(`type`, `key`): [`KeyDefinition`](../interfaces/KeyDefinition.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `type` | `string` |
| `key` | `string` |

#### Returns

[`KeyDefinition`](../interfaces/KeyDefinition.md)

#### Defined in

[packages/@orbit/records/src/record-schema.ts:249](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-schema.ts#L249)

___

### getModel

▸ **getModel**(`type`): [`ModelDefinition`](../interfaces/ModelDefinition.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `type` | `string` |

#### Returns

[`ModelDefinition`](../interfaces/ModelDefinition.md)

#### Defined in

[packages/@orbit/records/src/record-schema.ts:230](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-schema.ts#L230)

___

### getRelationship

▸ **getRelationship**(`type`, `relationship`): [`RelationshipDefinition`](../modules.md#relationshipdefinition)

#### Parameters

| Name | Type |
| :------ | :------ |
| `type` | `string` |
| `relationship` | `string` |

#### Returns

[`RelationshipDefinition`](../modules.md#relationshipdefinition)

#### Defined in

[packages/@orbit/records/src/record-schema.ts:259](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-schema.ts#L259)

___

### hasAttribute

▸ **hasAttribute**(`type`, `attribute`): `boolean`

#### Parameters

| Name | Type |
| :------ | :------ |
| `type` | `string` |
| `attribute` | `string` |

#### Returns

`boolean`

#### Defined in

[packages/@orbit/records/src/record-schema.ts:273](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-schema.ts#L273)

___

### hasKey

▸ **hasKey**(`type`, `key`): `boolean`

#### Parameters

| Name | Type |
| :------ | :------ |
| `type` | `string` |
| `key` | `string` |

#### Returns

`boolean`

#### Defined in

[packages/@orbit/records/src/record-schema.ts:277](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-schema.ts#L277)

___

### hasModel

▸ **hasModel**(`type`): `boolean`

#### Parameters

| Name | Type |
| :------ | :------ |
| `type` | `string` |

#### Returns

`boolean`

#### Defined in

[packages/@orbit/records/src/record-schema.ts:269](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-schema.ts#L269)

___

### hasRelationship

▸ **hasRelationship**(`type`, `relationship`): `boolean`

#### Parameters

| Name | Type |
| :------ | :------ |
| `type` | `string` |
| `relationship` | `string` |

#### Returns

`boolean`

#### Defined in

[packages/@orbit/records/src/record-schema.ts:281](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-schema.ts#L281)

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

### pluralize

▸ **pluralize**(`word`): `string`

A naive pluralization method.

Deprecated in favor of inflectors now in @orbit/serializers

**`deprecated`** since v0.17, remove in v0.18

#### Parameters

| Name | Type |
| :------ | :------ |
| `word` | `string` |

#### Returns

`string`

#### Defined in

[packages/@orbit/records/src/record-schema.ts:198](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-schema.ts#L198)

___

### singularize

▸ **singularize**(`word`): `string`

A naive singularization method.

Deprecated in favor of inflectors now in @orbit/serializers

**`deprecated`** since v0.17, remove in v0.18

#### Parameters

| Name | Type |
| :------ | :------ |
| `word` | `string` |

#### Returns

`string`

#### Defined in

[packages/@orbit/records/src/record-schema.ts:212](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-schema.ts#L212)

___

### upgrade

▸ **upgrade**(`settings?`): `Promise`<`void`\>

Upgrades Schema to a new version with new settings.

Emits the `upgrade` event to cue sources to upgrade their data.

#### Parameters

| Name | Type |
| :------ | :------ |
| `settings` | [`RecordSchemaSettings`](../interfaces/RecordSchemaSettings.md) |

#### Returns

`Promise`<`void`\>

#### Defined in

[packages/@orbit/records/src/record-schema.ts:142](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-schema.ts#L142)
