---
id: "TransformRequestProcessor"
title: "Interface: TransformRequestProcessor"
sidebar_label: "TransformRequestProcessor"
sidebar_position: 0
custom_edit_url: null
---

## Callable

### TransformRequestProcessor

▸ **TransformRequestProcessor**(`requestProcessor`, `request`): `Promise`<[`TransformRequestProcessorResponse`](../modules.md#transformrequestprocessorresponse)\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `requestProcessor` | [`JSONAPIRequestProcessor`](../classes/JSONAPIRequestProcessor.md) |
| `request` | [`RecordTransformRequest`](../modules.md#recordtransformrequest) |

#### Returns

`Promise`<[`TransformRequestProcessorResponse`](../modules.md#transformrequestprocessorresponse)\>

#### Defined in

[packages/@orbit/jsonapi/src/lib/transform-requests.ts:94](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/jsonapi/src/lib/transform-requests.ts#L94)
