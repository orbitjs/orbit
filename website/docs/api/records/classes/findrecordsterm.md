---
id: "FindRecordsTerm"
title: "Class: FindRecordsTerm<RT, RI>"
sidebar_label: "FindRecordsTerm"
sidebar_position: 0
custom_edit_url: null
---

## Type parameters

| Name | Type |
| :------ | :------ |
| `RT` | `string` |
| `RI` | [`RecordIdentity`](../interfaces/RecordIdentity.md) |

## Hierarchy

- [`BaseRecordQueryTerm`](BaseRecordQueryTerm.md)<[`FindRecords`](../interfaces/FindRecords.md) \| [`FindRelatedRecords`](../interfaces/FindRelatedRecords.md), `RT`, `RI`\>

  ↳ **`FindRecordsTerm`**

## Constructors

### constructor

• **new FindRecordsTerm**<`RT`, `RI`\>(`queryBuilder`, `expression`)

#### Type parameters

| Name | Type |
| :------ | :------ |
| `RT` | `string` |
| `RI` | [`RecordIdentity`](../interfaces/RecordIdentity.md) |

#### Parameters

| Name | Type |
| :------ | :------ |
| `queryBuilder` | [`RecordQueryBuilder`](RecordQueryBuilder.md)<`RT`, `RI`\> |
| `expression` | [`FindRelatedRecords`](../interfaces/FindRelatedRecords.md) \| [`FindRecords`](../interfaces/FindRecords.md) |

#### Inherited from

[BaseRecordQueryTerm](BaseRecordQueryTerm.md).[constructor](BaseRecordQueryTerm.md#constructor)

#### Defined in

[packages/@orbit/records/src/record-query-term.ts:100](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-query-term.ts#L100)

## Properties

### $queryBuilder

• **$queryBuilder**: [`RecordQueryBuilder`](RecordQueryBuilder.md)<`RT`, `RI`\>

#### Inherited from

[BaseRecordQueryTerm](BaseRecordQueryTerm.md).[$queryBuilder](BaseRecordQueryTerm.md#$querybuilder)

#### Defined in

[packages/@orbit/records/src/record-query-term.ts:98](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-query-term.ts#L98)

## Methods

### $filterParamToSpecifier

▸ **$filterParamToSpecifier**(`param`): [`FilterSpecifier`](../modules.md#filterspecifier)

#### Parameters

| Name | Type |
| :------ | :------ |
| `param` | [`FilterParam`](../modules.md#filterparam)<`RI`\> |

#### Returns

[`FilterSpecifier`](../modules.md#filterspecifier)

#### Defined in

[packages/@orbit/records/src/record-query-term.ts:222](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-query-term.ts#L222)

___

### $pageParamToSpecifier

▸ **$pageParamToSpecifier**(`param`): [`PageSpecifier`](../modules.md#pagespecifier)

#### Parameters

| Name | Type |
| :------ | :------ |
| `param` | [`PageParam`](../interfaces/PageParam.md) |

#### Returns

[`PageSpecifier`](../modules.md#pagespecifier)

#### Defined in

[packages/@orbit/records/src/record-query-term.ts:278](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-query-term.ts#L278)

___

### $parseSortParamString

▸ **$parseSortParamString**(`sortSpecifier`): [`AttributeSortSpecifier`](../interfaces/AttributeSortSpecifier.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `sortSpecifier` | `string` |

#### Returns

[`AttributeSortSpecifier`](../interfaces/AttributeSortSpecifier.md)

#### Defined in

[packages/@orbit/records/src/record-query-term.ts:324](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-query-term.ts#L324)

___

### $sortParamToSpecifier

▸ **$sortParamToSpecifier**(`param`): [`SortSpecifier`](../modules.md#sortspecifier)

#### Parameters

| Name | Type |
| :------ | :------ |
| `param` | [`SortParam`](../modules.md#sortparam) |

#### Returns

[`SortSpecifier`](../modules.md#sortspecifier)

#### Defined in

[packages/@orbit/records/src/record-query-term.ts:298](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-query-term.ts#L298)

___

### filter

▸ **filter**(...`params`): [`FindRecordsTerm`](FindRecordsTerm.md)<`RT`, `RI`\>

Apply a filter expression.

For example:

```ts
oqb
  .records('planet')
  .filter({ attribute: 'atmosphere', value: true },
          { attribute: 'classification', value: 'terrestrial' });
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `...params` | [`FilterParam`](../modules.md#filterparam)<`RI`\>[] |

#### Returns

[`FindRecordsTerm`](FindRecordsTerm.md)<`RT`, `RI`\>

#### Defined in

[packages/@orbit/records/src/record-query-term.ts:214](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-query-term.ts#L214)

___

### options

▸ **options**(`options`): [`FindRecordsTerm`](FindRecordsTerm.md)<`RT`, `RI`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `options` | `RequestOptions` |

#### Returns

[`FindRecordsTerm`](FindRecordsTerm.md)<`RT`, `RI`\>

#### Inherited from

[BaseRecordQueryTerm](BaseRecordQueryTerm.md).[options](BaseRecordQueryTerm.md#options)

#### Defined in

packages/@orbit/data/dist/modules/query-term.d.ts:11

___

### page

▸ **page**(`param`): [`FindRecordsTerm`](FindRecordsTerm.md)<`RT`, `RI`\>

Applies pagination to a collection query.

#### Parameters

| Name | Type |
| :------ | :------ |
| `param` | [`PageParam`](../interfaces/PageParam.md) |

#### Returns

[`FindRecordsTerm`](FindRecordsTerm.md)<`RT`, `RI`\>

#### Defined in

[packages/@orbit/records/src/record-query-term.ts:197](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-query-term.ts#L197)

___

### sort

▸ **sort**(...`params`): [`FindRecordsTerm`](FindRecordsTerm.md)<`RT`, `RI`\>

Applies sorting to a collection query.

Sort specifiers can be expressed in object form, like:

```ts
{ attribute: 'name', order: 'descending' }
{ attribute: 'name', order: 'ascending' }
```

Or in string form, like:

```ts
'-name' // descending order
'name'  // ascending order
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `...params` | [`SortParam`](../modules.md#sortparam)[] |

#### Returns

[`FindRecordsTerm`](FindRecordsTerm.md)<`RT`, `RI`\>

#### Defined in

[packages/@orbit/records/src/record-query-term.ts:188](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-query-term.ts#L188)

___

### toQueryExpression

▸ **toQueryExpression**(): [`FindRelatedRecords`](../interfaces/FindRelatedRecords.md) \| [`FindRecords`](../interfaces/FindRecords.md)

#### Returns

[`FindRelatedRecords`](../interfaces/FindRelatedRecords.md) \| [`FindRecords`](../interfaces/FindRecords.md)

#### Inherited from

[BaseRecordQueryTerm](BaseRecordQueryTerm.md).[toQueryExpression](BaseRecordQueryTerm.md#toqueryexpression)

#### Defined in

[packages/@orbit/records/src/record-query-term.ts:105](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-query-term.ts#L105)
