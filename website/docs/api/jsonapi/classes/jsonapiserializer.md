---
id: "JSONAPISerializer"
title: "Class: JSONAPISerializer"
sidebar_label: "JSONAPISerializer"
sidebar_position: 0
custom_edit_url: null
---

**`deprecated`** since v0.17, remove in v0.18

## Implements

- `Serializer`<[`RecordDocument`](../interfaces/RecordDocument.md), [`ResourceDocument`](../interfaces/ResourceDocument.md), [`JSONAPISerializationOptions`](../interfaces/JSONAPISerializationOptions.md), [`JSONAPISerializationOptions`](../interfaces/JSONAPISerializationOptions.md)\>

## Constructors

### constructor

• **new JSONAPISerializer**(`settings`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `settings` | [`JSONAPISerializerSettings`](../interfaces/JSONAPISerializerSettings.md) |

#### Defined in

[packages/@orbit/jsonapi/src/jsonapi-serializer.ts:64](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/jsonapi/src/jsonapi-serializer.ts#L64)

## Accessors

### keyMap

• `get` **keyMap**(): `undefined` \| `RecordKeyMap`

#### Returns

`undefined` \| `RecordKeyMap`

#### Defined in

[packages/@orbit/jsonapi/src/jsonapi-serializer.ts:100](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/jsonapi/src/jsonapi-serializer.ts#L100)

___

### schema

• `get` **schema**(): `RecordSchema`

#### Returns

`RecordSchema`

#### Defined in

[packages/@orbit/jsonapi/src/jsonapi-serializer.ts:96](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/jsonapi/src/jsonapi-serializer.ts#L96)

___

### serializerFor

• `get` **serializerFor**(): `SerializerForFn`<`Serializer`<`unknown`, `unknown`, `unknown`, `unknown`\>\>

#### Returns

`SerializerForFn`<`Serializer`<`unknown`, `unknown`, `unknown`, `unknown`\>\>

#### Defined in

[packages/@orbit/jsonapi/src/jsonapi-serializer.ts:104](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/jsonapi/src/jsonapi-serializer.ts#L104)

## Methods

### deserialize

▸ **deserialize**(`document`, `options?`): [`RecordDocument`](../interfaces/RecordDocument.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `document` | [`ResourceDocument`](../interfaces/ResourceDocument.md) |
| `options?` | [`JSONAPISerializationOptions`](../interfaces/JSONAPISerializationOptions.md) |

#### Returns

[`RecordDocument`](../interfaces/RecordDocument.md)

#### Implementation of

Serializer.deserialize

#### Defined in

[packages/@orbit/jsonapi/src/jsonapi-serializer.ts:352](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/jsonapi/src/jsonapi-serializer.ts#L352)

___

### deserializeAtomicOperation

▸ **deserializeAtomicOperation**(`operation`): `RecordOperation`

#### Parameters

| Name | Type |
| :------ | :------ |
| `operation` | [`ResourceAtomicOperation`](../interfaces/ResourceAtomicOperation.md) |

#### Returns

`RecordOperation`

#### Defined in

[packages/@orbit/jsonapi/src/jsonapi-serializer.ts:430](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/jsonapi/src/jsonapi-serializer.ts#L430)

___

### deserializeAtomicOperations

▸ **deserializeAtomicOperations**(`operations`): `RecordOperation`[]

#### Parameters

| Name | Type |
| :------ | :------ |
| `operations` | [`ResourceAtomicOperation`](../interfaces/ResourceAtomicOperation.md)[] |

#### Returns

`RecordOperation`[]

#### Defined in

[packages/@orbit/jsonapi/src/jsonapi-serializer.ts:422](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/jsonapi/src/jsonapi-serializer.ts#L422)

___

### deserializeAtomicOperationsDocument

▸ **deserializeAtomicOperationsDocument**(`document`): [`RecordOperationsDocument`](../interfaces/RecordOperationsDocument.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `document` | [`ResourceAtomicOperationsDocument`](../interfaces/ResourceAtomicOperationsDocument.md) |

#### Returns

[`RecordOperationsDocument`](../interfaces/RecordOperationsDocument.md)

#### Defined in

[packages/@orbit/jsonapi/src/jsonapi-serializer.ts:402](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/jsonapi/src/jsonapi-serializer.ts#L402)

___

### deserializeAttribute

▸ **deserializeAttribute**(`record`, `attr`, `value`, `model`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `record` | `InitializedRecord` |
| `attr` | `string` |
| `value` | `unknown` |
| `model` | `ModelDefinition` |

#### Returns

`void`

#### Defined in

[packages/@orbit/jsonapi/src/jsonapi-serializer.ts:519](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/jsonapi/src/jsonapi-serializer.ts#L519)

___

### deserializeAttributes

▸ **deserializeAttributes**(`record`, `resource`, `model`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `record` | `InitializedRecord` |
| `resource` | [`Resource`](../interfaces/Resource.md) |
| `model` | `ModelDefinition` |

#### Returns

`void`

#### Defined in

[packages/@orbit/jsonapi/src/jsonapi-serializer.ts:501](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/jsonapi/src/jsonapi-serializer.ts#L501)

___

### deserializeLinks

▸ **deserializeLinks**(`record`, `resource`, `model`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `record` | `InitializedRecord` |
| `resource` | [`Resource`](../interfaces/Resource.md) |
| `model` | `ModelDefinition` |

#### Returns

`void`

#### Defined in

[packages/@orbit/jsonapi/src/jsonapi-serializer.ts:603](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/jsonapi/src/jsonapi-serializer.ts#L603)

___

### deserializeMeta

▸ **deserializeMeta**(`record`, `resource`, `model`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `record` | `InitializedRecord` |
| `resource` | [`Resource`](../interfaces/Resource.md) |
| `model` | `ModelDefinition` |

#### Returns

`void`

#### Defined in

[packages/@orbit/jsonapi/src/jsonapi-serializer.ts:614](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/jsonapi/src/jsonapi-serializer.ts#L614)

___

### deserializeRelationship

▸ **deserializeRelationship**(`record`, `relationship`, `value`, `model`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `record` | `InitializedRecord` |
| `relationship` | `string` |
| `value` | [`ResourceRelationship`](../modules.md#resourcerelationship) |
| `model` | `ModelDefinition` |

#### Returns

`void`

#### Defined in

[packages/@orbit/jsonapi/src/jsonapi-serializer.ts:567](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/jsonapi/src/jsonapi-serializer.ts#L567)

___

### deserializeRelationships

▸ **deserializeRelationships**(`record`, `resource`, `model`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `record` | `InitializedRecord` |
| `resource` | [`Resource`](../interfaces/Resource.md) |
| `model` | `ModelDefinition` |

#### Returns

`void`

#### Defined in

[packages/@orbit/jsonapi/src/jsonapi-serializer.ts:549](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/jsonapi/src/jsonapi-serializer.ts#L549)

___

### deserializeResource

▸ **deserializeResource**(`resource`, `primaryRecord?`): `InitializedRecord`

#### Parameters

| Name | Type |
| :------ | :------ |
| `resource` | [`Resource`](../interfaces/Resource.md) |
| `primaryRecord?` | `InitializedRecord` |

#### Returns

`InitializedRecord`

#### Defined in

[packages/@orbit/jsonapi/src/jsonapi-serializer.ts:486](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/jsonapi/src/jsonapi-serializer.ts#L486)

___

### deserializeResourceIdentity

▸ **deserializeResourceIdentity**(`resource`, `primaryRecord?`): `InitializedRecord`

#### Parameters

| Name | Type |
| :------ | :------ |
| `resource` | [`Resource`](../interfaces/Resource.md) |
| `primaryRecord?` | `InitializedRecord` |

#### Returns

`InitializedRecord`

#### Defined in

[packages/@orbit/jsonapi/src/jsonapi-serializer.ts:436](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/jsonapi/src/jsonapi-serializer.ts#L436)

___

### recordAttribute

▸ **recordAttribute**(`type`, `resourceAttribute`): `string`

#### Parameters

| Name | Type |
| :------ | :------ |
| `type` | `string` |
| `resourceAttribute` | `string` |

#### Returns

`string`

#### Defined in

[packages/@orbit/jsonapi/src/jsonapi-serializer.ts:182](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/jsonapi/src/jsonapi-serializer.ts#L182)

___

### recordId

▸ **recordId**(`type`, `resourceId`): `string`

#### Parameters

| Name | Type |
| :------ | :------ |
| `type` | `string` |
| `resourceId` | `string` |

#### Returns

`string`

#### Defined in

[packages/@orbit/jsonapi/src/jsonapi-serializer.ts:150](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/jsonapi/src/jsonapi-serializer.ts#L150)

___

### recordIdentity

▸ **recordIdentity**(`resourceIdentity`): `RecordIdentity`

#### Parameters

| Name | Type |
| :------ | :------ |
| `resourceIdentity` | [`ResourceIdentity`](../interfaces/ResourceIdentity.md) |

#### Returns

`RecordIdentity`

#### Defined in

[packages/@orbit/jsonapi/src/jsonapi-serializer.ts:176](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/jsonapi/src/jsonapi-serializer.ts#L176)

___

### recordRelationship

▸ **recordRelationship**(`type`, `resourceRelationship`): `string`

#### Parameters

| Name | Type |
| :------ | :------ |
| `type` | `string` |
| `resourceRelationship` | `string` |

#### Returns

`string`

#### Defined in

[packages/@orbit/jsonapi/src/jsonapi-serializer.ts:186](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/jsonapi/src/jsonapi-serializer.ts#L186)

___

### recordType

▸ **recordType**(`resourceType`): `string`

#### Parameters

| Name | Type |
| :------ | :------ |
| `resourceType` | `string` |

#### Returns

`string`

#### Defined in

[packages/@orbit/jsonapi/src/jsonapi-serializer.ts:172](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/jsonapi/src/jsonapi-serializer.ts#L172)

___

### resourceAttribute

▸ **resourceAttribute**(`type`, `attr`): `string`

#### Parameters

| Name | Type |
| :------ | :------ |
| `type` | `undefined` \| `string` |
| `attr` | `string` |

#### Returns

`string`

#### Defined in

[packages/@orbit/jsonapi/src/jsonapi-serializer.ts:121](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/jsonapi/src/jsonapi-serializer.ts#L121)

___

### resourceId

▸ **resourceId**(`type`, `id`): `undefined` \| `string`

#### Parameters

| Name | Type |
| :------ | :------ |
| `type` | `string` |
| `id` | `string` |

#### Returns

`undefined` \| `string`

#### Defined in

[packages/@orbit/jsonapi/src/jsonapi-serializer.ts:136](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/jsonapi/src/jsonapi-serializer.ts#L136)

___

### resourceIdentity

▸ **resourceIdentity**(`identity`): [`Resource`](../interfaces/Resource.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `identity` | `RecordIdentity` |

#### Returns

[`Resource`](../interfaces/Resource.md)

#### Defined in

[packages/@orbit/jsonapi/src/jsonapi-serializer.ts:125](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/jsonapi/src/jsonapi-serializer.ts#L125)

___

### resourceIds

▸ **resourceIds**(`type`, `ids`): (`undefined` \| `string`)[]

#### Parameters

| Name | Type |
| :------ | :------ |
| `type` | `string` |
| `ids` | `string`[] |

#### Returns

(`undefined` \| `string`)[]

#### Defined in

[packages/@orbit/jsonapi/src/jsonapi-serializer.ts:132](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/jsonapi/src/jsonapi-serializer.ts#L132)

___

### resourceKey

▸ **resourceKey**(`type`): `string`

#### Parameters

| Name | Type |
| :------ | :------ |
| `type` | `string` |

#### Returns

`string`

#### Defined in

[packages/@orbit/jsonapi/src/jsonapi-serializer.ts:109](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/jsonapi/src/jsonapi-serializer.ts#L109)

___

### resourceRelationship

▸ **resourceRelationship**(`type`, `relationship`): `string`

#### Parameters

| Name | Type |
| :------ | :------ |
| `type` | `undefined` \| `string` |
| `relationship` | `string` |

#### Returns

`string`

#### Defined in

[packages/@orbit/jsonapi/src/jsonapi-serializer.ts:117](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/jsonapi/src/jsonapi-serializer.ts#L117)

___

### resourceType

▸ **resourceType**(`type`): `string`

#### Parameters

| Name | Type |
| :------ | :------ |
| `type` | `string` |

#### Returns

`string`

#### Defined in

[packages/@orbit/jsonapi/src/jsonapi-serializer.ts:113](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/jsonapi/src/jsonapi-serializer.ts#L113)

___

### serialize

▸ **serialize**(`document`): [`ResourceDocument`](../interfaces/ResourceDocument.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `document` | [`RecordDocument`](../interfaces/RecordDocument.md) |

#### Returns

[`ResourceDocument`](../interfaces/ResourceDocument.md)

#### Implementation of

Serializer.serialize

#### Defined in

[packages/@orbit/jsonapi/src/jsonapi-serializer.ts:190](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/jsonapi/src/jsonapi-serializer.ts#L190)

___

### serializeAtomicOperation

▸ **serializeAtomicOperation**(`operation`): [`ResourceAtomicOperation`](../interfaces/ResourceAtomicOperation.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `operation` | `RecordOperation` |

#### Returns

[`ResourceAtomicOperation`](../interfaces/ResourceAtomicOperation.md)

#### Defined in

[packages/@orbit/jsonapi/src/jsonapi-serializer.ts:216](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/jsonapi/src/jsonapi-serializer.ts#L216)

___

### serializeAtomicOperations

▸ **serializeAtomicOperations**(`operations`): [`ResourceAtomicOperation`](../interfaces/ResourceAtomicOperation.md)[]

#### Parameters

| Name | Type |
| :------ | :------ |
| `operations` | `RecordOperation`[] |

#### Returns

[`ResourceAtomicOperation`](../interfaces/ResourceAtomicOperation.md)[]

#### Defined in

[packages/@orbit/jsonapi/src/jsonapi-serializer.ts:208](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/jsonapi/src/jsonapi-serializer.ts#L208)

___

### serializeAtomicOperationsDocument

▸ **serializeAtomicOperationsDocument**(`document`): [`ResourceAtomicOperationsDocument`](../interfaces/ResourceAtomicOperationsDocument.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `document` | [`RecordOperationsDocument`](../interfaces/RecordOperationsDocument.md) |

#### Returns

[`ResourceAtomicOperationsDocument`](../interfaces/ResourceAtomicOperationsDocument.md)

#### Defined in

[packages/@orbit/jsonapi/src/jsonapi-serializer.ts:200](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/jsonapi/src/jsonapi-serializer.ts#L200)

___

### serializeAttribute

▸ **serializeAttribute**(`resource`, `record`, `attr`, `model`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `resource` | [`Resource`](../interfaces/Resource.md) |
| `record` | `InitializedRecord` |
| `attr` | `string` |
| `model` | `ModelDefinition` |

#### Returns

`void`

#### Defined in

[packages/@orbit/jsonapi/src/jsonapi-serializer.ts:270](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/jsonapi/src/jsonapi-serializer.ts#L270)

___

### serializeAttributes

▸ **serializeAttributes**(`resource`, `record`, `model`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `resource` | [`Resource`](../interfaces/Resource.md) |
| `record` | `InitializedRecord` |
| `model` | `ModelDefinition` |

#### Returns

`void`

#### Defined in

[packages/@orbit/jsonapi/src/jsonapi-serializer.ts:258](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/jsonapi/src/jsonapi-serializer.ts#L258)

___

### serializeId

▸ **serializeId**(`resource`, `record`, `model`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `resource` | [`Resource`](../interfaces/Resource.md) |
| `record` | `RecordIdentity` |
| `model` | `ModelDefinition` |

#### Returns

`void`

#### Defined in

[packages/@orbit/jsonapi/src/jsonapi-serializer.ts:246](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/jsonapi/src/jsonapi-serializer.ts#L246)

___

### serializeIdentity

▸ **serializeIdentity**(`record`): [`Resource`](../interfaces/Resource.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `record` | `InitializedRecord` |

#### Returns

[`Resource`](../interfaces/Resource.md)

#### Defined in

[packages/@orbit/jsonapi/src/jsonapi-serializer.ts:239](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/jsonapi/src/jsonapi-serializer.ts#L239)

___

### serializeRecord

▸ **serializeRecord**(`record`): [`Resource`](../interfaces/Resource.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `record` | `InitializedRecord` |

#### Returns

[`Resource`](../interfaces/Resource.md)

#### Defined in

[packages/@orbit/jsonapi/src/jsonapi-serializer.ts:226](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/jsonapi/src/jsonapi-serializer.ts#L226)

___

### serializeRecords

▸ **serializeRecords**(`records`): [`Resource`](../interfaces/Resource.md)[]

#### Parameters

| Name | Type |
| :------ | :------ |
| `records` | `InitializedRecord`[] |

#### Returns

[`Resource`](../interfaces/Resource.md)[]

#### Defined in

[packages/@orbit/jsonapi/src/jsonapi-serializer.ts:222](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/jsonapi/src/jsonapi-serializer.ts#L222)

___

### serializeRelationship

▸ **serializeRelationship**(`resource`, `record`, `relationship`, `model`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `resource` | [`Resource`](../interfaces/Resource.md) |
| `record` | `InitializedRecord` |
| `relationship` | `string` |
| `model` | `ModelDefinition` |

#### Returns

`void`

#### Defined in

[packages/@orbit/jsonapi/src/jsonapi-serializer.ts:319](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/jsonapi/src/jsonapi-serializer.ts#L319)

___

### serializeRelationships

▸ **serializeRelationships**(`resource`, `record`, `model`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `resource` | [`Resource`](../interfaces/Resource.md) |
| `record` | `InitializedRecord` |
| `model` | `ModelDefinition` |

#### Returns

`void`

#### Defined in

[packages/@orbit/jsonapi/src/jsonapi-serializer.ts:307](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/jsonapi/src/jsonapi-serializer.ts#L307)
