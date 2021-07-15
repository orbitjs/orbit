---
id: "ResourceAtomicOperation"
title: "Interface: ResourceAtomicOperation"
sidebar_label: "ResourceAtomicOperation"
sidebar_position: 0
custom_edit_url: null
---

## Hierarchy

- **`ResourceAtomicOperation`**

  ↳ [`AddResourceAtomicOperation`](AddResourceAtomicOperation.md)

  ↳ [`UpdateResourceAtomicOperation`](UpdateResourceAtomicOperation.md)

  ↳ [`RemoveResourceAtomicOperation`](RemoveResourceAtomicOperation.md)

  ↳ [`AddToRelatedResourcesAtomicOperation`](AddToRelatedResourcesAtomicOperation.md)

  ↳ [`RemoveFromRelatedResourcesAtomicOperation`](RemoveFromRelatedResourcesAtomicOperation.md)

  ↳ [`ReplaceRelatedResourceAtomicOperation`](ReplaceRelatedResourceAtomicOperation.md)

  ↳ [`ReplaceRelatedResourcesAtomicOperation`](ReplaceRelatedResourcesAtomicOperation.md)

## Properties

### data

• `Optional` **data**: ``null`` \| [`Resource`](Resource.md) \| [`Resource`](Resource.md)[]

#### Defined in

[packages/@orbit/jsonapi/src/resource-operations.ts:12](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/jsonapi/src/resource-operations.ts#L12)

___

### op

• **op**: ``"get"`` \| ``"add"`` \| ``"update"`` \| ``"remove"``

#### Defined in

[packages/@orbit/jsonapi/src/resource-operations.ts:6](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/jsonapi/src/resource-operations.ts#L6)

___

### ref

• **ref**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `id?` | `string` |
| `relationship?` | `string` |
| `type` | `string` |

#### Defined in

[packages/@orbit/jsonapi/src/resource-operations.ts:7](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/jsonapi/src/resource-operations.ts#L7)
