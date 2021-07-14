---
id: "RecordSource"
title: "Class: RecordSource<QO, TO, QB, TB>"
sidebar_label: "RecordSource"
sidebar_position: 0
custom_edit_url: null
---

Abstract base class for record-based sources.

## Type parameters

| Name | Type |
| :------ | :------ |
| `QO` | extends `RequestOptions`[`RecordSourceQueryOptions`](../interfaces/RecordSourceQueryOptions.md) |
| `TO` | extends `RequestOptions``RequestOptions` |
| `QB` | [`RecordQueryBuilder`](RecordQueryBuilder.md) |
| `TB` | [`RecordTransformBuilder`](RecordTransformBuilder.md) |

## Hierarchy

- `Source`<`QO`, `TO`, `QB`, `TB`\>

  ↳ **`RecordSource`**

## Constructors

### constructor

• **new RecordSource**<`QO`, `TO`, `QB`, `TB`\>(`settings`)

#### Type parameters

| Name | Type |
| :------ | :------ |
| `QO` | extends `RequestOptions`[`RecordSourceQueryOptions`](../interfaces/RecordSourceQueryOptions.md) |
| `TO` | extends `RequestOptions``RequestOptions` |
| `QB` | [`RecordQueryBuilder`](RecordQueryBuilder.md)<`string`, [`RecordIdentity`](../interfaces/RecordIdentity.md)\> |
| `TB` | [`RecordTransformBuilder`](RecordTransformBuilder.md)<`string`, [`RecordIdentity`](../interfaces/RecordIdentity.md), [`UninitializedRecord`](../interfaces/UninitializedRecord.md)\> |

#### Parameters

| Name | Type |
| :------ | :------ |
| `settings` | [`RecordSourceSettings`](../interfaces/RecordSourceSettings.md)<`QO`, `TO`, `QB`, `TB`\> |

#### Overrides

Source&lt;QO, TO, QB, TB\&gt;.constructor

#### Defined in

[packages/@orbit/records/src/record-source.ts:65](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-source.ts#L65)

## Accessors

### activated

• `get` **activated**(): `Promise`<`void`\>

#### Returns

`Promise`<`void`\>

#### Defined in

packages/@orbit/data/dist/modules/source.d.ts:54

___

### bucket

• `get` **bucket**(): `undefined` \| `Bucket`<`unknown`\>

#### Returns

`undefined` \| `Bucket`<`unknown`\>

#### Defined in

packages/@orbit/data/dist/modules/source.d.ts:37

___

### defaultQueryOptions

• `get` **defaultQueryOptions**(): `undefined` \| `DefaultRequestOptions`<`QueryOptions`\>

#### Returns

`undefined` \| `DefaultRequestOptions`<`QueryOptions`\>

#### Defined in

packages/@orbit/data/dist/modules/source.d.ts:43

• `set` **defaultQueryOptions**(`options`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `options` | `undefined` \| `DefaultRequestOptions`<`QueryOptions`\> |

#### Returns

`void`

#### Defined in

packages/@orbit/data/dist/modules/source.d.ts:44

___

### defaultTransformOptions

• `get` **defaultTransformOptions**(): `undefined` \| `DefaultRequestOptions`<`TransformOptions`\>

#### Returns

`undefined` \| `DefaultRequestOptions`<`TransformOptions`\>

#### Defined in

packages/@orbit/data/dist/modules/source.d.ts:45

• `set` **defaultTransformOptions**(`options`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `options` | `undefined` \| `DefaultRequestOptions`<`TransformOptions`\> |

#### Returns

`void`

#### Defined in

packages/@orbit/data/dist/modules/source.d.ts:46

___

### keyMap

• `get` **keyMap**(): `undefined` \| [`RecordKeyMap`](RecordKeyMap.md)

#### Returns

`undefined` \| [`RecordKeyMap`](RecordKeyMap.md)

#### Defined in

[packages/@orbit/records/src/record-source.ts:135](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-source.ts#L135)

___

### name

• `get` **name**(): `undefined` \| `string`

#### Returns

`undefined` \| `string`

#### Defined in

packages/@orbit/data/dist/modules/source.d.ts:36

___

### queryBuilder

• `get` **queryBuilder**(): `QB`

#### Returns

`QB`

#### Defined in

[packages/@orbit/records/src/record-source.ts:145](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-source.ts#L145)

___

### requestQueue

• `get` **requestQueue**(): `TaskQueue`<`string`, `unknown`, `unknown`, `unknown`\>

#### Returns

`TaskQueue`<`string`, `unknown`, `unknown`, `unknown`\>

#### Defined in

packages/@orbit/data/dist/modules/source.d.ts:39

___

### schema

• `get` **schema**(): [`RecordSchema`](RecordSchema.md)

#### Returns

[`RecordSchema`](RecordSchema.md)

#### Defined in

[packages/@orbit/records/src/record-source.ts:131](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-source.ts#L131)

___

### syncQueue

• `get` **syncQueue**(): `TaskQueue`<`string`, `unknown`, `unknown`, `unknown`\>

#### Returns

`TaskQueue`<`string`, `unknown`, `unknown`, `unknown`\>

#### Defined in

packages/@orbit/data/dist/modules/source.d.ts:40

___

### transformBuilder

• `get` **transformBuilder**(): `TB`

#### Returns

`TB`

#### Defined in

[packages/@orbit/records/src/record-source.ts:149](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-source.ts#L149)

___

### transformLog

• `get` **transformLog**(): `Log`

#### Returns

`Log`

#### Defined in

packages/@orbit/data/dist/modules/source.d.ts:38

___

### validatorFor

• `get` **validatorFor**(): `undefined` \| `ValidatorForFn`<`Validator`<`unknown`[], `ArrayValidationOptions`, `ArrayValidationIssue`\> \| `Validator`<`boolean`, `undefined`, `TypeIssue`\> \| `Validator`<`Date`, `DateValidationOptions`, `DateValidationIssue`\> \| `Validator`<`number`, `NumberValidationOptions`, `NumberValidationIssue`\> \| `Validator`<`unknown`, `ValidationOptions`, `TypeIssue`\> \| `Validator`<`string`, `StringValidationOptions`, `StringValidationIssue`\> \| `Validator`<[`InitializedRecord`](../interfaces/InitializedRecord.md), [`RecordValidationOptions`](../interfaces/RecordValidationOptions.md), [`RecordValidationIssue`](../modules.md#recordvalidationissue)\> \| `Validator`<[`RecordAttributeInput`](../interfaces/RecordAttributeInput.md), [`RecordAttributeValidationOptions`](../interfaces/RecordAttributeValidationOptions.md), [`RecordAttributeValidationIssue`](../modules.md#recordattributevalidationissue)\> \| `Validator`<[`RecordIdentity`](../interfaces/RecordIdentity.md), [`RecordIdentityValidationOptions`](../interfaces/RecordIdentityValidationOptions.md), [`RecordIdentityValidationIssue`](../modules.md#recordidentityvalidationissue)\> \| `Validator`<[`RecordKeyInput`](../interfaces/RecordKeyInput.md), [`RecordKeyValidationOptions`](../interfaces/RecordKeyValidationOptions.md), [`RecordKeyValidationIssue`](../modules.md#recordkeyvalidationissue)\> \| `Validator`<[`RecordOperation`](../modules.md#recordoperation), [`RecordOperationValidationOptions`](../interfaces/RecordOperationValidationOptions.md), [`RecordOperationValidationIssue`](../modules.md#recordoperationvalidationissue)\> \| `Validator`<[`RecordQueryExpression`](../modules.md#recordqueryexpression), `RecordQueryExpressionValidationOptions`, `RecordQueryExpressionValidationIssue`\> \| `Validator`<[`RecordRelationshipInput`](../interfaces/RecordRelationshipInput.md), [`RecordRelationshipValidationOptions`](../interfaces/RecordRelationshipValidationOptions.md), [`RecordRelationshipValidationIssue`](../modules.md#recordrelationshipvalidationissue)\> \| `Validator`<`string`, [`RecordTypeValidationOptions`](../interfaces/RecordTypeValidationOptions.md), [`RecordTypeValidationIssue`](../modules.md#recordtypevalidationissue)\> \| `Validator`<[`RelatedRecordInput`](../interfaces/RelatedRecordInput.md), [`RelatedRecordValidationOptions`](../interfaces/RelatedRecordValidationOptions.md), [`RelatedRecordValidationIssue`](../modules.md#relatedrecordvalidationissue)\> \| `Validator`<[`RecordFieldDefinitionInput`](../interfaces/RecordFieldDefinitionInput.md), [`RecordFieldDefinitionValidationOptions`](../interfaces/RecordFieldDefinitionValidationOptions.md), [`RecordFieldDefinitionIssue`](../interfaces/RecordFieldDefinitionIssue.md)\>\>

#### Returns

`undefined` \| `ValidatorForFn`<`Validator`<`unknown`[], `ArrayValidationOptions`, `ArrayValidationIssue`\> \| `Validator`<`boolean`, `undefined`, `TypeIssue`\> \| `Validator`<`Date`, `DateValidationOptions`, `DateValidationIssue`\> \| `Validator`<`number`, `NumberValidationOptions`, `NumberValidationIssue`\> \| `Validator`<`unknown`, `ValidationOptions`, `TypeIssue`\> \| `Validator`<`string`, `StringValidationOptions`, `StringValidationIssue`\> \| `Validator`<[`InitializedRecord`](../interfaces/InitializedRecord.md), [`RecordValidationOptions`](../interfaces/RecordValidationOptions.md), [`RecordValidationIssue`](../modules.md#recordvalidationissue)\> \| `Validator`<[`RecordAttributeInput`](../interfaces/RecordAttributeInput.md), [`RecordAttributeValidationOptions`](../interfaces/RecordAttributeValidationOptions.md), [`RecordAttributeValidationIssue`](../modules.md#recordattributevalidationissue)\> \| `Validator`<[`RecordIdentity`](../interfaces/RecordIdentity.md), [`RecordIdentityValidationOptions`](../interfaces/RecordIdentityValidationOptions.md), [`RecordIdentityValidationIssue`](../modules.md#recordidentityvalidationissue)\> \| `Validator`<[`RecordKeyInput`](../interfaces/RecordKeyInput.md), [`RecordKeyValidationOptions`](../interfaces/RecordKeyValidationOptions.md), [`RecordKeyValidationIssue`](../modules.md#recordkeyvalidationissue)\> \| `Validator`<[`RecordOperation`](../modules.md#recordoperation), [`RecordOperationValidationOptions`](../interfaces/RecordOperationValidationOptions.md), [`RecordOperationValidationIssue`](../modules.md#recordoperationvalidationissue)\> \| `Validator`<[`RecordQueryExpression`](../modules.md#recordqueryexpression), `RecordQueryExpressionValidationOptions`, `RecordQueryExpressionValidationIssue`\> \| `Validator`<[`RecordRelationshipInput`](../interfaces/RecordRelationshipInput.md), [`RecordRelationshipValidationOptions`](../interfaces/RecordRelationshipValidationOptions.md), [`RecordRelationshipValidationIssue`](../modules.md#recordrelationshipvalidationissue)\> \| `Validator`<`string`, [`RecordTypeValidationOptions`](../interfaces/RecordTypeValidationOptions.md), [`RecordTypeValidationIssue`](../modules.md#recordtypevalidationissue)\> \| `Validator`<[`RelatedRecordInput`](../interfaces/RelatedRecordInput.md), [`RelatedRecordValidationOptions`](../interfaces/RelatedRecordValidationOptions.md), [`RelatedRecordValidationIssue`](../modules.md#relatedrecordvalidationissue)\> \| `Validator`<[`RecordFieldDefinitionInput`](../interfaces/RecordFieldDefinitionInput.md), [`RecordFieldDefinitionValidationOptions`](../interfaces/RecordFieldDefinitionValidationOptions.md), [`RecordFieldDefinitionIssue`](../interfaces/RecordFieldDefinitionIssue.md)\>\>

#### Defined in

[packages/@orbit/records/src/record-source.ts:139](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-source.ts#L139)

## Methods

### activate

▸ **activate**(): `Promise`<`void`\>

#### Returns

`Promise`<`void`\>

#### Inherited from

Source.activate

#### Defined in

packages/@orbit/data/dist/modules/source.d.ts:55

___

### deactivate

▸ **deactivate**(): `Promise`<`void`\>

#### Returns

`Promise`<`void`\>

#### Inherited from

Source.deactivate

#### Defined in

packages/@orbit/data/dist/modules/source.d.ts:56

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

Source.emit

#### Defined in

packages/@orbit/core/dist/modules/evented.d.ts:23

___

### getQueryOptions

▸ **getQueryOptions**(`query`, `expression?`): `undefined` \| `QO`

#### Parameters

| Name | Type |
| :------ | :------ |
| `query` | `Query`<`QueryExpression`\> |
| `expression?` | `QueryExpression` |

#### Returns

`undefined` \| `QO`

#### Inherited from

Source.getQueryOptions

#### Defined in

packages/@orbit/data/dist/modules/source.d.ts:47

___

### getTransformOptions

▸ **getTransformOptions**(`transform`, `operation?`): `undefined` \| `TO`

#### Parameters

| Name | Type |
| :------ | :------ |
| `transform` | `Transform`<`Operation`\> |
| `operation?` | `Operation` |

#### Returns

`undefined` \| `TO`

#### Inherited from

Source.getTransformOptions

#### Defined in

packages/@orbit/data/dist/modules/source.d.ts:48

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

Source.listeners

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

Source.off

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

Source.on

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

Source.one

#### Defined in

packages/@orbit/core/dist/modules/evented.d.ts:22

___

### perform

▸ **perform**(`task`): `Promise`<`unknown`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `task` | `Task`<`string`, `unknown`, `unknown`\> |

#### Returns

`Promise`<`unknown`\>

#### Inherited from

Source.perform

#### Defined in

packages/@orbit/data/dist/modules/source.d.ts:49

___

### transformed

▸ **transformed**(`transforms`): `Promise`<`void`\>

Notifies listeners that this source has been transformed by emitting the
`transform` event.

Resolves when any promises returned to event listeners are resolved.

Also, adds an entry to the Source's `transformLog` for each transform.

#### Parameters

| Name | Type |
| :------ | :------ |
| `transforms` | `Transform`<`Operation`\>[] |

#### Returns

`Promise`<`void`\>

#### Inherited from

Source.transformed

#### Defined in

packages/@orbit/data/dist/modules/source.d.ts:65

___

### upgrade

▸ **upgrade**(): `Promise`<`void`\>

Upgrade source as part of a schema upgrade.

#### Returns

`Promise`<`void`\>

#### Overrides

Source.upgrade

#### Defined in

[packages/@orbit/records/src/record-source.ts:156](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-source.ts#L156)
