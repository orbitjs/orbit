---
id: "BucketSettings"
title: "Interface: BucketSettings"
sidebar_label: "BucketSettings"
sidebar_position: 0
custom_edit_url: null
---

Settings used to instantiate and/or upgrade a `Bucket`.

## Properties

### name

• `Optional` **name**: `string`

Name used for tracking and debugging a bucket instance.

#### Defined in

[packages/@orbit/core/src/bucket.ts:10](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/core/src/bucket.ts#L10)

___

### namespace

• `Optional` **namespace**: `string`

The namespace used by the bucket when accessing any items.

This is used to distinguish one bucket's contents from another.

#### Defined in

[packages/@orbit/core/src/bucket.ts:17](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/core/src/bucket.ts#L17)

___

### version

• `Optional` **version**: `number`

The current version of the bucket.

Used to identify the version of the bucket's schema and thus migrate it
as needed.

#### Defined in

[packages/@orbit/core/src/bucket.ts:25](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/core/src/bucket.ts#L25)
