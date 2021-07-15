---
id: "ImmutableMap"
title: "Class: ImmutableMap<K, V>"
sidebar_label: "ImmutableMap"
sidebar_position: 0
custom_edit_url: null
---

## Type parameters

| Name |
| :------ |
| `K` |
| `V` |

## Constructors

### constructor

• **new ImmutableMap**<`K`, `V`\>(`base?`)

#### Type parameters

| Name |
| :------ |
| `K` |
| `V` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `base?` | [`ImmutableMap`](ImmutableMap.md)<`K`, `V`\> |

#### Defined in

[immutable-map.ts:6](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/immutable/src/immutable-map.ts#L6)

## Accessors

### size

• `get` **size**(): `number`

#### Returns

`number`

#### Defined in

[immutable-map.ts:14](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/immutable/src/immutable-map.ts#L14)

## Methods

### clear

▸ **clear**(): `void`

#### Returns

`void`

#### Defined in

[immutable-map.ts:18](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/immutable/src/immutable-map.ts#L18)

___

### entries

▸ **entries**(): `IterableIterator`<[`K`, `V`]\>

#### Returns

`IterableIterator`<[`K`, `V`]\>

#### Defined in

[immutable-map.ts:62](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/immutable/src/immutable-map.ts#L62)

___

### get

▸ **get**(`key`): `V`

#### Parameters

| Name | Type |
| :------ | :------ |
| `key` | `K` |

#### Returns

`V`

#### Defined in

[immutable-map.ts:22](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/immutable/src/immutable-map.ts#L22)

___

### has

▸ **has**(`key`): `boolean`

#### Parameters

| Name | Type |
| :------ | :------ |
| `key` | `K` |

#### Returns

`boolean`

#### Defined in

[immutable-map.ts:50](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/immutable/src/immutable-map.ts#L50)

___

### keys

▸ **keys**(): `IterableIterator`<`K`\>

#### Returns

`IterableIterator`<`K`\>

#### Defined in

[immutable-map.ts:54](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/immutable/src/immutable-map.ts#L54)

___

### remove

▸ **remove**(`key`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `key` | `K` |

#### Returns

`void`

#### Defined in

[immutable-map.ts:38](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/immutable/src/immutable-map.ts#L38)

___

### removeMany

▸ **removeMany**(`keys`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `keys` | `K`[] |

#### Returns

`void`

#### Defined in

[immutable-map.ts:42](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/immutable/src/immutable-map.ts#L42)

___

### set

▸ **set**(`key`, `value`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `key` | `K` |
| `value` | `V` |

#### Returns

`void`

#### Defined in

[immutable-map.ts:26](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/immutable/src/immutable-map.ts#L26)

___

### setMany

▸ **setMany**(`entries`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `entries` | [`K`, `V`][] |

#### Returns

`void`

#### Defined in

[immutable-map.ts:30](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/immutable/src/immutable-map.ts#L30)

___

### values

▸ **values**(): `IterableIterator`<`V`\>

#### Returns

`IterableIterator`<`V`\>

#### Defined in

[immutable-map.ts:58](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/immutable/src/immutable-map.ts#L58)
