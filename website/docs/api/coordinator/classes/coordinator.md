---
id: "Coordinator"
title: "Class: Coordinator"
sidebar_label: "Coordinator"
sidebar_position: 0
custom_edit_url: null
---

The Coordinator class manages a set of sources to which it applies a set of
coordination strategies.

## Constructors

### constructor

• **new Coordinator**(`options?`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `options` | [`CoordinatorOptions`](../interfaces/CoordinatorOptions.md) |

#### Defined in

[coordinator.ts:36](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/coordinator/src/coordinator.ts#L36)

## Accessors

### activated

• `get` **activated**(): `undefined` \| `Promise`<`void`\>

#### Returns

`undefined` \| `Promise`<`void`\>

#### Defined in

[coordinator.ts:141](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/coordinator/src/coordinator.ts#L141)

___

### sourceNames

• `get` **sourceNames**(): `string`[]

#### Returns

`string`[]

#### Defined in

[coordinator.ts:95](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/coordinator/src/coordinator.ts#L95)

___

### sources

• `get` **sources**(): `Source`<`RequestOptions`, `RequestOptions`, `unknown`, `unknown`\>[]

#### Returns

`Source`<`RequestOptions`, `RequestOptions`, `unknown`, `unknown`\>[]

#### Defined in

[coordinator.ts:91](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/coordinator/src/coordinator.ts#L91)

___

### strategies

• `get` **strategies**(): [`Strategy`](Strategy.md)[]

#### Returns

[`Strategy`](Strategy.md)[]

#### Defined in

[coordinator.ts:133](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/coordinator/src/coordinator.ts#L133)

___

### strategyNames

• `get` **strategyNames**(): `string`[]

#### Returns

`string`[]

#### Defined in

[coordinator.ts:137](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/coordinator/src/coordinator.ts#L137)

## Methods

### activate

▸ **activate**(`options?`): `Promise`<`void`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `options` | [`ActivationOptions`](../interfaces/ActivationOptions.md) |

#### Returns

`Promise`<`void`\>

#### Defined in

[coordinator.ts:145](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/coordinator/src/coordinator.ts#L145)

___

### addSource

▸ **addSource**(`source`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `source` | `Source`<`RequestOptions`, `RequestOptions`, `unknown`, `unknown`\> |

#### Returns

`void`

#### Defined in

[coordinator.ts:55](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/coordinator/src/coordinator.ts#L55)

___

### addStrategy

▸ **addStrategy**(`strategy`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `strategy` | [`Strategy`](Strategy.md) |

#### Returns

`void`

#### Defined in

[coordinator.ts:99](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/coordinator/src/coordinator.ts#L99)

___

### deactivate

▸ **deactivate**(): `Promise`<`void`\>

#### Returns

`Promise`<`void`\>

#### Defined in

[coordinator.ts:152](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/coordinator/src/coordinator.ts#L152)

___

### getSource

▸ **getSource**<`T`\>(`name`): `T`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `T` | extends `Source`<`RequestOptions`, `RequestOptions`, `unknown`, `unknown`, `T`\>`Source`<`RequestOptions`, `RequestOptions`, `unknown`, `unknown`\> |

#### Parameters

| Name | Type |
| :------ | :------ |
| `name` | `string` |

#### Returns

`T`

#### Defined in

[coordinator.ts:87](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/coordinator/src/coordinator.ts#L87)

___

### getStrategy

▸ **getStrategy**<`T`\>(`name`): `T`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `T` | extends [`Strategy`](Strategy.md)<`T`\>[`Strategy`](Strategy.md) |

#### Parameters

| Name | Type |
| :------ | :------ |
| `name` | `string` |

#### Returns

`T`

#### Defined in

[coordinator.ts:129](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/coordinator/src/coordinator.ts#L129)

___

### removeSource

▸ **removeSource**(`name`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `name` | `string` |

#### Returns

`void`

#### Defined in

[coordinator.ts:72](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/coordinator/src/coordinator.ts#L72)

___

### removeStrategy

▸ **removeStrategy**(`name`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `name` | `string` |

#### Returns

`void`

#### Defined in

[coordinator.ts:114](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/coordinator/src/coordinator.ts#L114)
