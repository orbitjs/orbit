---
id: "JSONAPIURLBuilder"
title: "Class: JSONAPIURLBuilder"
sidebar_label: "JSONAPIURLBuilder"
sidebar_position: 0
custom_edit_url: null
---

## Constructors

### constructor

• **new JSONAPIURLBuilder**(`settings`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `settings` | [`JSONAPIURLBuilderSettings`](../interfaces/JSONAPIURLBuilderSettings.md) |

#### Defined in

[packages/@orbit/jsonapi/src/jsonapi-url-builder.ts:40](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/jsonapi/src/jsonapi-url-builder.ts#L40)

## Properties

### host

• `Optional` **host**: `string`

#### Defined in

[packages/@orbit/jsonapi/src/jsonapi-url-builder.ts:34](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/jsonapi/src/jsonapi-url-builder.ts#L34)

___

### keyMap

• `Optional` **keyMap**: `RecordKeyMap`

#### Defined in

[packages/@orbit/jsonapi/src/jsonapi-url-builder.ts:38](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/jsonapi/src/jsonapi-url-builder.ts#L38)

___

### namespace

• `Optional` **namespace**: `string`

#### Defined in

[packages/@orbit/jsonapi/src/jsonapi-url-builder.ts:35](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/jsonapi/src/jsonapi-url-builder.ts#L35)

___

### serializer

• `Optional` **serializer**: [`JSONAPISerializer`](JSONAPISerializer.md)

#### Defined in

[packages/@orbit/jsonapi/src/jsonapi-url-builder.ts:37](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/jsonapi/src/jsonapi-url-builder.ts#L37)

___

### serializerFor

• **serializerFor**: `SerializerForFn`<`Serializer`<`unknown`, `unknown`, `unknown`, `unknown`\>\>

#### Defined in

[packages/@orbit/jsonapi/src/jsonapi-url-builder.ts:36](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/jsonapi/src/jsonapi-url-builder.ts#L36)

## Methods

### appendQueryParams

▸ **appendQueryParams**(`url`, `params`): `string`

#### Parameters

| Name | Type |
| :------ | :------ |
| `url` | `string` |
| `params` | `Dict`<`string`\> |

#### Returns

`string`

#### Defined in

[packages/@orbit/jsonapi/src/jsonapi-url-builder.ts:214](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/jsonapi/src/jsonapi-url-builder.ts#L214)

___

### buildFilterParam

▸ **buildFilterParam**(`filterSpecifiers`): [`Filter`](../interfaces/Filter.md)[]

#### Parameters

| Name | Type |
| :------ | :------ |
| `filterSpecifiers` | `FilterSpecifier`[] |

#### Returns

[`Filter`](../interfaces/Filter.md)[]

#### Defined in

[packages/@orbit/jsonapi/src/jsonapi-url-builder.ts:134](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/jsonapi/src/jsonapi-url-builder.ts#L134)

___

### buildPageParam

▸ **buildPageParam**(`pageSpecifier`): `Dict`<`any`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `pageSpecifier` | `PageSpecifier` |

#### Returns

`Dict`<`any`\>

#### Defined in

[packages/@orbit/jsonapi/src/jsonapi-url-builder.ts:208](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/jsonapi/src/jsonapi-url-builder.ts#L208)

___

### buildSortParam

▸ **buildSortParam**(`sortSpecifiers`): `string`

#### Parameters

| Name | Type |
| :------ | :------ |
| `sortSpecifiers` | `SortSpecifier`[] |

#### Returns

`string`

#### Defined in

[packages/@orbit/jsonapi/src/jsonapi-url-builder.ts:185](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/jsonapi/src/jsonapi-url-builder.ts#L185)

___

### relatedResourceURL

▸ **relatedResourceURL**(`type`, `id`, `relationship`): `string`

#### Parameters

| Name | Type |
| :------ | :------ |
| `type` | `string` |
| `id` | `string` |
| `relationship` | `string` |

#### Returns

`string`

#### Defined in

[packages/@orbit/jsonapi/src/jsonapi-url-builder.ts:126](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/jsonapi/src/jsonapi-url-builder.ts#L126)

___

### resourceHost

▸ **resourceHost**(`type?`): `undefined` \| `string`

#### Parameters

| Name | Type |
| :------ | :------ |
| `type?` | `string` |

#### Returns

`undefined` \| `string`

#### Defined in

[packages/@orbit/jsonapi/src/jsonapi-url-builder.ts:59](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/jsonapi/src/jsonapi-url-builder.ts#L59)

___

### resourceNamespace

▸ **resourceNamespace**(`type?`): `undefined` \| `string`

#### Parameters

| Name | Type |
| :------ | :------ |
| `type?` | `string` |

#### Returns

`undefined` \| `string`

#### Defined in

[packages/@orbit/jsonapi/src/jsonapi-url-builder.ts:54](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/jsonapi/src/jsonapi-url-builder.ts#L54)

___

### resourcePath

▸ **resourcePath**(`type`, `id?`): `string`

#### Parameters

| Name | Type |
| :------ | :------ |
| `type` | `string` |
| `id?` | `string` |

#### Returns

`string`

#### Defined in

[packages/@orbit/jsonapi/src/jsonapi-url-builder.ts:83](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/jsonapi/src/jsonapi-url-builder.ts#L83)

___

### resourceRelationshipURL

▸ **resourceRelationshipURL**(`type`, `id`, `relationship`): `string`

#### Parameters

| Name | Type |
| :------ | :------ |
| `type` | `string` |
| `id` | `string` |
| `relationship` | `string` |

#### Returns

`string`

#### Defined in

[packages/@orbit/jsonapi/src/jsonapi-url-builder.ts:114](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/jsonapi/src/jsonapi-url-builder.ts#L114)

___

### resourceURL

▸ **resourceURL**(`type`, `id?`): `string`

#### Parameters

| Name | Type |
| :------ | :------ |
| `type` | `string` |
| `id?` | `string` |

#### Returns

`string`

#### Defined in

[packages/@orbit/jsonapi/src/jsonapi-url-builder.ts:63](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/jsonapi/src/jsonapi-url-builder.ts#L63)
