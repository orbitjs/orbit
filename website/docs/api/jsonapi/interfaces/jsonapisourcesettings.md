---
id: "JSONAPISourceSettings"
title: "Interface: JSONAPISourceSettings<QO, TO, QB, TB>"
sidebar_label: "JSONAPISourceSettings"
sidebar_position: 0
custom_edit_url: null
---

## Type parameters

| Name | Type |
| :------ | :------ |
| `QO` | extends [`JSONAPIQueryOptions`](JSONAPIQueryOptions.md)[`JSONAPIQueryOptions`](JSONAPIQueryOptions.md) |
| `TO` | extends [`JSONAPITransformOptions`](JSONAPITransformOptions.md)[`JSONAPITransformOptions`](JSONAPITransformOptions.md) |
| `QB` | `RecordQueryBuilder` |
| `TB` | `RecordTransformBuilder` |

## Hierarchy

- `RecordSourceSettings`<`QO`, `TO`, `QB`, `TB`\>

  ↳ **`JSONAPISourceSettings`**

## Properties

### RequestProcessorClass

• `Optional` **RequestProcessorClass**: (`settings`: [`JSONAPIRequestProcessorSettings`](JSONAPIRequestProcessorSettings.md)) => [`JSONAPIRequestProcessor`](../classes/JSONAPIRequestProcessor.md)

#### Type declaration

• **new JSONAPISourceSettings**(`settings`)

##### Parameters

| Name | Type |
| :------ | :------ |
| `settings` | [`JSONAPIRequestProcessorSettings`](JSONAPIRequestProcessorSettings.md) |

#### Defined in

[packages/@orbit/jsonapi/src/jsonapi-source.ts:110](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/jsonapi/src/jsonapi-source.ts#L110)

___

### SerializerClass

• `Optional` **SerializerClass**: (`settings`: [`JSONAPISerializerSettings`](JSONAPISerializerSettings.md)) => [`JSONAPISerializer`](../classes/JSONAPISerializer.md)

#### Type declaration

• **new JSONAPISourceSettings**(`settings`)

##### Parameters

| Name | Type |
| :------ | :------ |
| `settings` | [`JSONAPISerializerSettings`](JSONAPISerializerSettings.md) |

#### Defined in

[packages/@orbit/jsonapi/src/jsonapi-source.ts:107](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/jsonapi/src/jsonapi-source.ts#L107)

___

### URLBuilderClass

• `Optional` **URLBuilderClass**: (`settings`: [`JSONAPIURLBuilderSettings`](JSONAPIURLBuilderSettings.md)) => [`JSONAPIURLBuilder`](../classes/JSONAPIURLBuilder.md)

#### Type declaration

• **new JSONAPISourceSettings**(`settings`)

##### Parameters

| Name | Type |
| :------ | :------ |
| `settings` | [`JSONAPIURLBuilderSettings`](JSONAPIURLBuilderSettings.md) |

#### Defined in

[packages/@orbit/jsonapi/src/jsonapi-source.ts:113](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/jsonapi/src/jsonapi-source.ts#L113)

___

### allowedContentTypes

• `Optional` **allowedContentTypes**: `string`[]

#### Defined in

[packages/@orbit/jsonapi/src/jsonapi-source.ts:103](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/jsonapi/src/jsonapi-source.ts#L103)

___

### autoActivate

• `Optional` **autoActivate**: `boolean`

#### Inherited from

RecordSourceSettings.autoActivate

#### Defined in

packages/@orbit/data/dist/modules/source.d.ts:12

___

### autoUpgrade

• `Optional` **autoUpgrade**: `boolean`

#### Inherited from

RecordSourceSettings.autoUpgrade

#### Defined in

packages/@orbit/records/dist/modules/record-source.d.ts:19

___

### bucket

• `Optional` **bucket**: `Bucket`<`unknown`\>

#### Inherited from

RecordSourceSettings.bucket

#### Defined in

packages/@orbit/data/dist/modules/source.d.ts:9

___

### defaultFetchSettings

• `Optional` **defaultFetchSettings**: [`FetchSettings`](FetchSettings.md)

#### Defined in

[packages/@orbit/jsonapi/src/jsonapi-source.ts:102](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/jsonapi/src/jsonapi-source.ts#L102)

___

### defaultQueryOptions

• `Optional` **defaultQueryOptions**: `DefaultRequestOptions`<`QO`\>

#### Inherited from

RecordSourceSettings.defaultQueryOptions

#### Defined in

packages/@orbit/data/dist/modules/source.d.ts:15

___

### defaultTransformOptions

• `Optional` **defaultTransformOptions**: `DefaultRequestOptions`<`TO`\>

#### Inherited from

RecordSourceSettings.defaultTransformOptions

#### Defined in

packages/@orbit/data/dist/modules/source.d.ts:16

___

### host

• `Optional` **host**: `string`

#### Defined in

[packages/@orbit/jsonapi/src/jsonapi-source.ts:101](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/jsonapi/src/jsonapi-source.ts#L101)

___

### keyMap

• `Optional` **keyMap**: `RecordKeyMap`

#### Inherited from

RecordSourceSettings.keyMap

#### Defined in

packages/@orbit/records/dist/modules/record-source.d.ts:15

___

### maxRequestsPerQuery

• `Optional` **maxRequestsPerQuery**: `number`

Deprecated in favor of `defaultQueryOptions.maxRequests`

**`deprecated`** since v0.17, remove in v0.18

#### Defined in

[packages/@orbit/jsonapi/src/jsonapi-source.ts:97](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/jsonapi/src/jsonapi-source.ts#L97)

___

### maxRequestsPerTransform

• `Optional` **maxRequestsPerTransform**: `number`

Deprecated in favor of `defaultTransformOptions.maxRequests`

**`deprecated`** since v0.17, remove in v0.18

#### Defined in

[packages/@orbit/jsonapi/src/jsonapi-source.ts:90](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/jsonapi/src/jsonapi-source.ts#L90)

___

### name

• `Optional` **name**: `string`

#### Overrides

RecordSourceSettings.name

#### Defined in

[packages/@orbit/jsonapi/src/jsonapi-source.ts:99](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/jsonapi/src/jsonapi-source.ts#L99)

___

### namespace

• `Optional` **namespace**: `string`

#### Defined in

[packages/@orbit/jsonapi/src/jsonapi-source.ts:100](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/jsonapi/src/jsonapi-source.ts#L100)

___

### normalizer

• `Optional` **normalizer**: `RecordNormalizer`<`string`, `RecordIdentity`, `UninitializedRecord`\>

#### Inherited from

RecordSourceSettings.normalizer

#### Defined in

packages/@orbit/records/dist/modules/record-source.d.ts:16

___

### queryBuilder

• `Optional` **queryBuilder**: `QB`

#### Inherited from

RecordSourceSettings.queryBuilder

#### Defined in

packages/@orbit/data/dist/modules/source.d.ts:10

___

### requestQueueSettings

• `Optional` **requestQueueSettings**: `TaskQueueSettings`<`string`, `unknown`, `unknown`\>

#### Inherited from

RecordSourceSettings.requestQueueSettings

#### Defined in

packages/@orbit/data/dist/modules/source.d.ts:13

___

### schema

• **schema**: `RecordSchema`

#### Inherited from

RecordSourceSettings.schema

#### Defined in

packages/@orbit/records/dist/modules/record-source.d.ts:14

___

### serializerClassFor

• `Optional` **serializerClassFor**: `SerializerClassForFn`<`Serializer`<`unknown`, `unknown`, `unknown`, `unknown`\>\>

#### Defined in

[packages/@orbit/jsonapi/src/jsonapi-source.ts:105](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/jsonapi/src/jsonapi-source.ts#L105)

___

### serializerFor

• `Optional` **serializerFor**: `SerializerForFn`<`Serializer`<`unknown`, `unknown`, `unknown`, `unknown`\>\>

#### Defined in

[packages/@orbit/jsonapi/src/jsonapi-source.ts:104](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/jsonapi/src/jsonapi-source.ts#L104)

___

### serializerSettingsFor

• `Optional` **serializerSettingsFor**: `SerializerSettingsForFn`

#### Defined in

[packages/@orbit/jsonapi/src/jsonapi-source.ts:106](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/jsonapi/src/jsonapi-source.ts#L106)

___

### syncQueueSettings

• `Optional` **syncQueueSettings**: `TaskQueueSettings`<`string`, `unknown`, `unknown`\>

#### Inherited from

RecordSourceSettings.syncQueueSettings

#### Defined in

packages/@orbit/data/dist/modules/source.d.ts:14

___

### transformBuilder

• `Optional` **transformBuilder**: `TB`

#### Inherited from

RecordSourceSettings.transformBuilder

#### Defined in

packages/@orbit/data/dist/modules/source.d.ts:11

___

### validatorFor

• `Optional` **validatorFor**: `ValidatorForFn`<`Validator`<`unknown`[], `ArrayValidationOptions`, `ArrayValidationIssue`\> \| `Validator`<`boolean`, `undefined`, `TypeIssue`\> \| `Validator`<`Date`, `DateValidationOptions`, `DateValidationIssue`\> \| `Validator`<`number`, `NumberValidationOptions`, `NumberValidationIssue`\> \| `Validator`<`unknown`, `ValidationOptions`, `TypeIssue`\> \| `Validator`<`string`, `StringValidationOptions`, `StringValidationIssue`\> \| `Validator`<`InitializedRecord`, `RecordValidationOptions`, `RecordValidationIssue`\> \| `Validator`<`RecordAttributeInput`, `RecordAttributeValidationOptions`, `RecordAttributeValidationIssue`\> \| `Validator`<`RecordIdentity`, `RecordIdentityValidationOptions`, `RecordIdentityValidationIssue`\> \| `Validator`<`RecordKeyInput`, `RecordKeyValidationOptions`, `RecordKeyValidationIssue`\> \| `Validator`<`RecordOperation`, `RecordOperationValidationOptions`, `RecordOperationValidationIssue`\> \| `Validator`<`RecordQueryExpression`, `RecordQueryExpressionValidationOptions`, `RecordQueryExpressionValidationIssue`\> \| `Validator`<`RecordRelationshipInput`, `RecordRelationshipValidationOptions`, `RecordRelationshipValidationIssue`\> \| `Validator`<`string`, `RecordTypeValidationOptions`, `RecordTypeValidationIssue`\> \| `Validator`<`RelatedRecordInput`, `RelatedRecordValidationOptions`, `RelatedRecordValidationIssue`\> \| `Validator`<`RecordFieldDefinitionInput`, `RecordFieldDefinitionValidationOptions`, `RecordFieldDefinitionIssue`\>\>

#### Inherited from

RecordSourceSettings.validatorFor

#### Defined in

packages/@orbit/records/dist/modules/record-source.d.ts:17

___

### validators

• `Optional` **validators**: `Dict`<`Validator`<`unknown`[], `ArrayValidationOptions`, `ArrayValidationIssue`\> \| `Validator`<`boolean`, `undefined`, `TypeIssue`\> \| `Validator`<`Date`, `DateValidationOptions`, `DateValidationIssue`\> \| `Validator`<`number`, `NumberValidationOptions`, `NumberValidationIssue`\> \| `Validator`<`unknown`, `ValidationOptions`, `TypeIssue`\> \| `Validator`<`string`, `StringValidationOptions`, `StringValidationIssue`\> \| `Validator`<`InitializedRecord`, `RecordValidationOptions`, `RecordValidationIssue`\> \| `Validator`<`RecordAttributeInput`, `RecordAttributeValidationOptions`, `RecordAttributeValidationIssue`\> \| `Validator`<`RecordIdentity`, `RecordIdentityValidationOptions`, `RecordIdentityValidationIssue`\> \| `Validator`<`RecordKeyInput`, `RecordKeyValidationOptions`, `RecordKeyValidationIssue`\> \| `Validator`<`RecordOperation`, `RecordOperationValidationOptions`, `RecordOperationValidationIssue`\> \| `Validator`<`RecordQueryExpression`, `RecordQueryExpressionValidationOptions`, `RecordQueryExpressionValidationIssue`\> \| `Validator`<`RecordRelationshipInput`, `RecordRelationshipValidationOptions`, `RecordRelationshipValidationIssue`\> \| `Validator`<`string`, `RecordTypeValidationOptions`, `RecordTypeValidationIssue`\> \| `Validator`<`RelatedRecordInput`, `RelatedRecordValidationOptions`, `RelatedRecordValidationIssue`\> \| `Validator`<`RecordFieldDefinitionInput`, `RecordFieldDefinitionValidationOptions`, `RecordFieldDefinitionIssue`\>\>

#### Inherited from

RecordSourceSettings.validators

#### Defined in

packages/@orbit/records/dist/modules/record-source.d.ts:18
