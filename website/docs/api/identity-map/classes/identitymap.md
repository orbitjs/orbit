---
id: "IdentityMap"
title: "Class: IdentityMap<Identity, Model>"
sidebar_label: "IdentityMap"
sidebar_position: 0
custom_edit_url: null
---

## Type parameters

| Name |
| :------ |
| `Identity` |
| `Model` |

## Implements

- `Map`<`Identity`, `Model`\>

## Constructors

### constructor

• **new IdentityMap**<`Identity`, `Model`\>(`settings`)

#### Type parameters

| Name |
| :------ |
| `Identity` |
| `Model` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `settings` | [`IdentityMapSettings`](../interfaces/IdentityMapSettings.md)<`Identity`\> |

#### Defined in

[identity-map.ts:11](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/identity-map/src/identity-map.ts#L11)

## Accessors

### [Symbol.toStringTag]

• `get` **[Symbol.toStringTag]**(): `string`

#### Returns

`string`

#### Defined in

[identity-map.ts:93](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/identity-map/src/identity-map.ts#L93)

___

### size

• `get` **size**(): `number`

#### Returns

`number`

#### Defined in

[identity-map.ts:89](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/identity-map/src/identity-map.ts#L89)

## Methods

### [Symbol.iterator]

▸ **[Symbol.iterator]**(): `IterableIterator`<[`Identity`, `Model`]\>

#### Returns

`IterableIterator`<[`Identity`, `Model`]\>

#### Implementation of

Map.\_\_@iterator

#### Defined in

[identity-map.ts:68](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/identity-map/src/identity-map.ts#L68)

___

### clear

▸ **clear**(): `void`

#### Returns

`void`

#### Implementation of

Map.clear

#### Defined in

[identity-map.ts:72](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/identity-map/src/identity-map.ts#L72)

___

### delete

▸ **delete**(`identity`): `boolean`

#### Parameters

| Name | Type |
| :------ | :------ |
| `identity` | `Identity` |

#### Returns

`boolean`

#### Implementation of

Map.delete

#### Defined in

[identity-map.ts:40](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/identity-map/src/identity-map.ts#L40)

___

### entries

▸ **entries**(): `IterableIterator`<[`Identity`, `Model`]\>

#### Returns

`IterableIterator`<[`Identity`, `Model`]\>

#### Implementation of

Map.entries

#### Defined in

[identity-map.ts:49](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/identity-map/src/identity-map.ts#L49)

___

### forEach

▸ **forEach**(`callbackFn`, `thisArg?`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `callbackFn` | (`record`: `Model`, `identity`: `Identity`, `map`: [`default`](default.md)<`Identity`, `Model`\>) => `void` |
| `thisArg?` | `unknown` |

#### Returns

`void`

#### Implementation of

Map.forEach

#### Defined in

[identity-map.ts:76](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/identity-map/src/identity-map.ts#L76)

___

### get

▸ **get**(`identity`): `undefined` \| `Model`

#### Parameters

| Name | Type |
| :------ | :------ |
| `identity` | `Identity` |

#### Returns

`undefined` \| `Model`

#### Implementation of

Map.get

#### Defined in

[identity-map.ts:16](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/identity-map/src/identity-map.ts#L16)

___

### has

▸ **has**(`identity`): `boolean`

#### Parameters

| Name | Type |
| :------ | :------ |
| `identity` | `Identity` |

#### Returns

`boolean`

#### Implementation of

Map.has

#### Defined in

[identity-map.ts:31](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/identity-map/src/identity-map.ts#L31)

___

### keys

▸ **keys**(): `IterableIterator`<`Identity`\>

#### Returns

`IterableIterator`<`Identity`\>

#### Implementation of

Map.keys

#### Defined in

[identity-map.ts:58](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/identity-map/src/identity-map.ts#L58)

___

### set

▸ **set**(`identity`, `record`): [`default`](default.md)<`Identity`, `Model`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `identity` | `Identity` |
| `record` | `Model` |

#### Returns

[`default`](default.md)<`Identity`, `Model`\>

#### Implementation of

Map.set

#### Defined in

[identity-map.ts:23](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/identity-map/src/identity-map.ts#L23)

___

### values

▸ **values**(): `IterableIterator`<`Model`\>

#### Returns

`IterableIterator`<`Model`\>

#### Implementation of

Map.values

#### Defined in

[identity-map.ts:64](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/identity-map/src/identity-map.ts#L64)
