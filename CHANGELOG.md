# Changelog

## v0.17.2 (2022-03-06)

#### :bug: Bug Fix

- `@orbit/record-cache`
  - [#937](https://github.com/orbitjs/orbit/pull/937) Improve robustness of isNode check ([@dgeb](https://github.com/dgeb))

#### :house: Internal

- `@orbit/record-cache`
  - [#938](https://github.com/orbitjs/orbit/pull/938) Make sync-record-cache-update-test mirror async equivalents ([@dgeb](https://github.com/dgeb))

#### Committers: 1

- Dan Gebhardt ([@dgeb](https://github.com/dgeb))

## v0.17.1 (2022-03-01)

#### :bug: Bug Fix

- `@orbit/indexeddb`
  - [#932](https://github.com/orbitjs/orbit/pull/932) IndexedDBCache: Fix handling of empty operations array ([@dgeb](https://github.com/dgeb))
- `@orbit/jsonapi`
  - [#925](https://github.com/orbitjs/orbit/pull/925) Ensure that fetch errors always throw errors that contain `response` [jsonapi] ([@dgeb](https://github.com/dgeb))

#### :memo: Documentation

- [#928](https://github.com/orbitjs/orbit/pull/928) Fix incorrect uses of "relationship" instead of "relation" in filtering docs ([@bradjones1](https://github.com/bradjones1))
- [#924](https://github.com/orbitjs/orbit/pull/924) Refinements to v0.17 docs ([@dgeb](https://github.com/dgeb))

#### :house: Internal

- [#930](https://github.com/orbitjs/orbit/pull/930) Bump prismjs from 1.25.0 to 1.27.0 in /website ([@dependabot[bot]](https://github.com/apps/dependabot))
- [#926](https://github.com/orbitjs/orbit/pull/926) Bump follow-redirects from 1.14.7 to 1.14.8 ([@dependabot[bot]](https://github.com/apps/dependabot))
- [#927](https://github.com/orbitjs/orbit/pull/927) Bump follow-redirects from 1.14.7 to 1.14.8 in /website ([@dependabot[bot]](https://github.com/apps/dependabot))

#### Committers: 2

- Brad Jones ([@bradjones1](https://github.com/bradjones1))
- Dan Gebhardt ([@dgeb](https://github.com/dgeb))

## v0.17.0 (2022-01-31)

#### :memo: Documentation

- [#875](https://github.com/orbitjs/orbit/pull/875) v0.17 blog post and docs ([@dgeb](https://github.com/dgeb))

#### Committers: 1

- Dan Gebhardt ([@dgeb](https://github.com/dgeb))

## v0.17.0-beta.28 (2022-01-30)

#### :bug: Bug Fix

- `@orbit/memory`
  - [#923](https://github.com/orbitjs/orbit/pull/923) Fix autoValidate: false setting to work for forks ([@dgeb](https://github.com/dgeb))

#### :house: Internal

- [#922](https://github.com/orbitjs/orbit/pull/922) Bump node-fetch from 2.6.1 to 2.6.7 ([@dependabot[bot]](https://github.com/apps/dependabot))

#### Committers: 1

- Dan Gebhardt ([@dgeb](https://github.com/dgeb))

## v0.17.0-beta.27 (2022-01-30)

#### :bug: Bug Fix

- `@orbit/indexeddb`, `@orbit/local-storage`, `@orbit/memory`
  - [#921](https://github.com/orbitjs/orbit/pull/921) Ensure that validator settings are properly transferred to caches and forks ([@dgeb](https://github.com/dgeb))

#### Committers: 2

- Brad Jones ([@bradjones1](https://github.com/bradjones1))
- Dan Gebhardt ([@dgeb](https://github.com/dgeb))

## v0.17.0-beta.26 (2022-01-22)

#### :boom: Breaking Change

- `@orbit/record-cache`, `@orbit/records`
  - [#915](https://github.com/orbitjs/orbit/pull/915) Introduce autoValidate setting for RecordCache and RecordSource ([@dgeb](https://github.com/dgeb))
- `@orbit/coordinator`, `@orbit/core`, `@orbit/data`, `@orbit/jsonapi`, `@orbit/records`
  - [#905](https://github.com/orbitjs/orbit/pull/905) Exception refactoring ([@dgeb](https://github.com/dgeb))

#### :rocket: Enhancement

- `@orbit/indexeddb`
  - [#916](https://github.com/orbitjs/orbit/pull/916) Encourage use of `useBuffer: true` for improved IndexedDB write performance ([@dgeb](https://github.com/dgeb))
- `@orbit/record-cache`, `@orbit/records`
  - [#915](https://github.com/orbitjs/orbit/pull/915) Introduce autoValidate setting for RecordCache and RecordSource ([@dgeb](https://github.com/dgeb))
- `@orbit/core`
  - [#913](https://github.com/orbitjs/orbit/pull/913) Use crypto.randomUUID by default for Orbit.uuid ([@dgeb](https://github.com/dgeb))
- `@orbit/build`, `@orbit/core`, `@orbit/data`, `@orbit/indexeddb`, `@orbit/jsonapi`, `@orbit/local-storage`, `@orbit/memory`
  - [#911](https://github.com/orbitjs/orbit/pull/911) Improve building of JSONAPI fetch params ([@dgeb](https://github.com/dgeb))
- `@orbit/coordinator`, `@orbit/core`, `@orbit/data`, `@orbit/jsonapi`, `@orbit/records`
  - [#905](https://github.com/orbitjs/orbit/pull/905) Exception refactoring ([@dgeb](https://github.com/dgeb))
- `@orbit/record-cache`, `@orbit/records`, `@orbit/validators`
  - [#896](https://github.com/orbitjs/orbit/pull/896) Expand validation error descriptions ([@dgeb](https://github.com/dgeb))

#### :memo: Documentation

- `@orbit/records`
  - [#919](https://github.com/orbitjs/orbit/pull/919) Mark KeyDefinition#primaryKey deprecated ([@dgeb](https://github.com/dgeb))
- Other
  - [#909](https://github.com/orbitjs/orbit/pull/909) Update grammar/spelling on live query section ([@bradjones1](https://github.com/bradjones1))
  - [#895](https://github.com/orbitjs/orbit/pull/895) [Docs] Update "Relationship filtering" section in querying docs ([@bradjones1](https://github.com/bradjones1))

#### :house: Internal

- Other
  - [#918](https://github.com/orbitjs/orbit/pull/918) Bump nanoid from 3.1.23 to 3.2.0 in /website ([@dependabot[bot]](https://github.com/apps/dependabot))
  - [#912](https://github.com/orbitjs/orbit/pull/912) Bump trim-off-newlines from 1.0.1 to 1.0.3 ([@dependabot[bot]](https://github.com/apps/dependabot))
  - [#906](https://github.com/orbitjs/orbit/pull/906) Bump follow-redirects from 1.12.1 to 1.14.7 ([@dependabot[bot]](https://github.com/apps/dependabot))
  - [#907](https://github.com/orbitjs/orbit/pull/907) Bump shelljs from 0.8.4 to 0.8.5 in /website ([@dependabot[bot]](https://github.com/apps/dependabot))
  - [#908](https://github.com/orbitjs/orbit/pull/908) Bump follow-redirects from 1.14.6 to 1.14.7 in /website ([@dependabot[bot]](https://github.com/apps/dependabot))
  - [#898](https://github.com/orbitjs/orbit/pull/898) Bump axios from 0.21.1 to 0.21.4 in /website ([@dependabot[bot]](https://github.com/apps/dependabot))
  - [#899](https://github.com/orbitjs/orbit/pull/899) Bump prismjs from 1.24.1 to 1.25.0 in /website ([@dependabot[bot]](https://github.com/apps/dependabot))
  - [#900](https://github.com/orbitjs/orbit/pull/900) Update docusaurus to latest 2.0.0-beta.14 [website] ([@dgeb](https://github.com/dgeb))
  - [#894](https://github.com/orbitjs/orbit/pull/894) Bump algoliasearch-helper from 3.5.4 to 3.6.2 in /website ([@dependabot[bot]](https://github.com/apps/dependabot))
  - [#888](https://github.com/orbitjs/orbit/pull/888) Bump tar from 4.4.15 to 4.4.19 ([@dependabot[bot]](https://github.com/apps/dependabot))
- `@orbit/indexeddb`, `@orbit/local-storage`
  - [#917](https://github.com/orbitjs/orbit/pull/917) Streamline syntax for processing of settings ([@dgeb](https://github.com/dgeb))

#### Committers: 2

- Brad Jones ([@bradjones1](https://github.com/bradjones1))
- Dan Gebhardt ([@dgeb](https://github.com/dgeb))

## v0.17.0-beta.25 (2021-08-12)

#### :rocket: Enhancement

- `@orbit/jsonapi`
  - [#883](https://github.com/orbitjs/orbit/pull/883) [jsonapi] Introduce `partialSet` request option ([@dgeb](https://github.com/dgeb))
  - [#882](https://github.com/orbitjs/orbit/pull/882) JSONAPISource: Allow multiple consecutive removeFromRelatedRecords ops to be coalesced ([@dgeb](https://github.com/dgeb))
- `@orbit/indexeddb`
  - [#881](https://github.com/orbitjs/orbit/pull/881) IndexedDBCache: Provide a naive, idempotent default implementation of `migrateDB` ([@dgeb](https://github.com/dgeb))
- `@orbit/memory`
  - [#877](https://github.com/orbitjs/orbit/pull/877) Introduce MemorySource#reset ([@dgeb](https://github.com/dgeb))
  - [#876](https://github.com/orbitjs/orbit/pull/876) MemoryCache#reset now resets state to match its base cache, if present ([@dgeb](https://github.com/dgeb))

#### :house: Internal

- `@orbit/coordinator`, `@orbit/core`, `@orbit/data`, `@orbit/identity-map`, `@orbit/immutable`, `@orbit/indexeddb-bucket`, `@orbit/indexeddb`, `@orbit/integration-tests`, `@orbit/jsonapi`, `@orbit/local-storage-bucket`, `@orbit/local-storage`, `@orbit/memory`, `@orbit/record-cache`, `@orbit/records`, `@orbit/serializers`, `@orbit/utils`
  - [#884](https://github.com/orbitjs/orbit/pull/884) Add top-level LICENSE file and update all copyright dates ([@dgeb](https://github.com/dgeb))
- Other
  - [#880](https://github.com/orbitjs/orbit/pull/880) Bump path-parse from 1.0.6 to 1.0.7 ([@dependabot[bot]](https://github.com/apps/dependabot))
  - [#879](https://github.com/orbitjs/orbit/pull/879) Bump tar from 4.4.13 to 4.4.15 ([@dependabot[bot]](https://github.com/apps/dependabot))

#### Committers: 1

- Dan Gebhardt ([@dgeb](https://github.com/dgeb))

## v0.17.0-beta.24 (2021-07-26)

#### :rocket: Enhancement

- `@orbit/memory`
  - [#873](https://github.com/orbitjs/orbit/pull/873) Introduce new fork / merge possibilities in MemorySource and MemoryCache ([@dgeb](https://github.com/dgeb))

#### :memo: Documentation

- [#870](https://github.com/orbitjs/orbit/pull/870) Progress on v0.17 docs ([@dgeb](https://github.com/dgeb))

#### :house: Internal

- Other
  - [#872](https://github.com/orbitjs/orbit/pull/872) Create CNAME for website ([@dgeb](https://github.com/dgeb))
- `@orbit/integration-tests`, `@orbit/record-cache`
  - [#871](https://github.com/orbitjs/orbit/pull/871) Fill out tests to improve checking `update` responses ([@dgeb](https://github.com/dgeb))

#### Committers: 1

- Dan Gebhardt ([@dgeb](https://github.com/dgeb))

## v0.17.0-beta.23 (2021-07-18)

#### :rocket: Enhancement

- `@orbit/indexeddb`, `@orbit/local-storage`, `@orbit/memory`, `@orbit/record-cache`
  - [#868](https://github.com/orbitjs/orbit/pull/868) Extract RecordTransformBuffer interface ([@dgeb](https://github.com/dgeb))

#### Committers: 1

- Dan Gebhardt ([@dgeb](https://github.com/dgeb))

## v0.17.0-beta.22 (2021-07-16)

#### :bug: Bug Fix

- `@orbit/jsonapi`
  - [#867](https://github.com/orbitjs/orbit/pull/867) Ensure JSONAPISource query and update return arrays to match array requests ([@dgeb](https://github.com/dgeb))
- `@orbit/validators`
  - [#866](https://github.com/orbitjs/orbit/pull/866) validateObject should not accept null as a valid object ([@dgeb](https://github.com/dgeb))

#### :memo: Documentation

- Other
  - [#865](https://github.com/orbitjs/orbit/pull/865) Update welcome blog post ([@dgeb](https://github.com/dgeb))
  - [#864](https://github.com/orbitjs/orbit/pull/864) Explicitly set trailingSlash: false [website] ([@dgeb](https://github.com/dgeb))
  - [#863](https://github.com/orbitjs/orbit/pull/863) Docs site refinements ([@dgeb](https://github.com/dgeb))
- `@orbit/records`
  - [#862](https://github.com/orbitjs/orbit/pull/862) Introduce new docs site ([@dgeb](https://github.com/dgeb))

#### Committers: 1

- Dan Gebhardt ([@dgeb](https://github.com/dgeb))

## v0.17.0-beta.21 (2021-07-07)

#### :rocket: Enhancement

- `@orbit/validators`
  - [#858](https://github.com/orbitjs/orbit/pull/858) Fill in gaps in @orbit/validators ([@dgeb](https://github.com/dgeb))

#### Committers: 1

- Dan Gebhardt ([@dgeb](https://github.com/dgeb))

## v0.17.0-beta.20 (2021-07-04)

#### :bug: Bug Fix

- `@orbit/core`
  - [#856](https://github.com/orbitjs/orbit/pull/856) Do not await TaskQueue settlement as part of `push`, `retry`, `skip`, and `unshift` ([@dgeb](https://github.com/dgeb))

#### Committers: 1

- Dan Gebhardt ([@dgeb](https://github.com/dgeb))

## v0.17.0-beta.19 (2021-07-03)

#### :boom: Breaking Change

- `@orbit/data`, `@orbit/indexeddb`, `@orbit/jsonapi`, `@orbit/local-storage`, `@orbit/memory`, `@orbit/record-cache`, `@orbit/records`
  - [#855](https://github.com/orbitjs/orbit/pull/855) Allow for explicit "singular" requests (queries / transforms) ([@dgeb](https://github.com/dgeb))

#### :rocket: Enhancement

- `@orbit/data`, `@orbit/indexeddb`, `@orbit/jsonapi`, `@orbit/local-storage`, `@orbit/memory`, `@orbit/record-cache`, `@orbit/records`
  - [#855](https://github.com/orbitjs/orbit/pull/855) Allow for explicit "singular" requests (queries / transforms) ([@dgeb](https://github.com/dgeb))
- `@orbit/core`, `@orbit/data`, `@orbit/local-storage-bucket`, `@orbit/utils`
  - [#854](https://github.com/orbitjs/orbit/pull/854) Improve typings for core interfaces ([@dgeb](https://github.com/dgeb))
- `@orbit/memory`
  - [#853](https://github.com/orbitjs/orbit/pull/853) Improve MemorySource#merge typings and deprecate `transformOptions` ([@dgeb](https://github.com/dgeb))

#### Committers: 1

- Dan Gebhardt ([@dgeb](https://github.com/dgeb))

## v0.17.0-beta.18 (2021-06-22)

#### :rocket: Enhancement

- `@orbit/memory`
  - [#852](https://github.com/orbitjs/orbit/pull/852) Fix typings for MemorySource#merge ([@dgeb](https://github.com/dgeb))
- `@orbit/records`
  - [#850](https://github.com/orbitjs/orbit/pull/850) Validate that validator exists for attribute type [records] ([@dgeb](https://github.com/dgeb))

#### Committers: 1

- Dan Gebhardt ([@dgeb](https://github.com/dgeb))

## v0.17.0-beta.17 (2021-06-11)

#### :bug: Bug Fix

- `@orbit/indexeddb`, `@orbit/local-storage`, `@orbit/memory`
  - [#848](https://github.com/orbitjs/orbit/pull/848) Fix sharing of validatorFor function between record sources and caches, and memory sources and forks ([@dgeb](https://github.com/dgeb))
- `@orbit/data`
  - [#847](https://github.com/orbitjs/orbit/pull/847) Fix data-only response from `update` when a transform has already been applied ([@dgeb](https://github.com/dgeb))

#### :house: Internal

- [#844](https://github.com/orbitjs/orbit/pull/844) Bump ws from 7.4.2 to 7.4.6 ([@dependabot[bot]](https://github.com/apps/dependabot))

#### Committers: 1

- Dan Gebhardt ([@dgeb](https://github.com/dgeb))

## v0.17.0-beta.16 (2021-05-22)

#### :rocket: Enhancement

- `@orbit/data`, `@orbit/indexeddb`, `@orbit/jsonapi`, `@orbit/local-storage`, `@orbit/memory`, `@orbit/record-cache`, `@orbit/records`, `@orbit/validators`
  - [#842](https://github.com/orbitjs/orbit/pull/842) Introduce @orbit/validators and record-specific validators ([@dgeb](https://github.com/dgeb))
- `@orbit/jsonapi`, `@orbit/records`, `@orbit/serializers`
  - [#837](https://github.com/orbitjs/orbit/pull/837) Refinement of serialization options ([@dgeb](https://github.com/dgeb))
- `@orbit/data`, `@orbit/indexeddb`, `@orbit/jsonapi`, `@orbit/local-storage`, `@orbit/memory`, `@orbit/record-cache`, `@orbit/records`, `@orbit/utils`
  - [#835](https://github.com/orbitjs/orbit/pull/835) Introduce record normalizers ([@dgeb](https://github.com/dgeb))
- `@orbit/data`
  - [#832](https://github.com/orbitjs/orbit/pull/832) Deprecate Pullable and Pushable interfaces ([@dgeb](https://github.com/dgeb))
- `@orbit/coordinator`, `@orbit/core`, `@orbit/indexeddb-bucket`, `@orbit/jsonapi`, `@orbit/record-cache`, `@orbit/records`
  - [#831](https://github.com/orbitjs/orbit/pull/831) Add debug setting to `Orbit` global ([@dgeb](https://github.com/dgeb))
- `@orbit/data`, `@orbit/records`
  - [#830](https://github.com/orbitjs/orbit/pull/830) Support use of a transform builder in Syncable ([@dgeb](https://github.com/dgeb))
- `@orbit/indexeddb`, `@orbit/jsonapi`, `@orbit/local-storage`, `@orbit/memory`, `@orbit/record-cache`, `@orbit/records`
  - [#828](https://github.com/orbitjs/orbit/pull/828) Deprecate Record interface in favor of InitializedRecord ([@dgeb](https://github.com/dgeb))
- `@orbit/indexeddb`, `@orbit/local-storage`, `@orbit/memory`
  - [#827](https://github.com/orbitjs/orbit/pull/827) Allow record-cache-based sources to define a custom `cacheClass` ([@dgeb](https://github.com/dgeb))
- `@orbit/indexeddb`, `@orbit/local-storage`, `@orbit/memory`, `@orbit/record-cache`, `@orbit/records`
  - [#822](https://github.com/orbitjs/orbit/pull/822) Introduce RecordTransformBuffer for improving performance and atomicity of cache updates ([@dgeb](https://github.com/dgeb))

#### :house: Internal

- [#838](https://github.com/orbitjs/orbit/pull/838) Bump underscore from 1.10.2 to 1.13.1 ([@dependabot[bot]](https://github.com/apps/dependabot))
- [#839](https://github.com/orbitjs/orbit/pull/839) Bump handlebars from 4.7.6 to 4.7.7 ([@dependabot[bot]](https://github.com/apps/dependabot))
- [#840](https://github.com/orbitjs/orbit/pull/840) Bump lodash from 4.17.19 to 4.17.21 ([@dependabot[bot]](https://github.com/apps/dependabot))
- [#841](https://github.com/orbitjs/orbit/pull/841) Bump hosted-git-info from 2.8.8 to 2.8.9 ([@dependabot[bot]](https://github.com/apps/dependabot))
- [#836](https://github.com/orbitjs/orbit/pull/836) Bump ssri from 6.0.1 to 6.0.2 ([@dependabot[bot]](https://github.com/apps/dependabot))
- [#833](https://github.com/orbitjs/orbit/pull/833) Bump y18n from 4.0.0 to 4.0.1 ([@dependabot[bot]](https://github.com/apps/dependabot))

#### Committers: 1

- Dan Gebhardt ([@dgeb](https://github.com/dgeb))

## v0.17.0-beta.15 (2021-03-07)

#### :rocket: Enhancement

- `@orbit/indexeddb`
  - [#826](https://github.com/orbitjs/orbit/pull/826) Add fallback and error logging guidance to improve PR 823 ([@dgeb](https://github.com/dgeb))
  - [#821](https://github.com/orbitjs/orbit/pull/821) Improve bulk IndexedDB performance ([@dgeb](https://github.com/dgeb))

#### :bug: Bug Fix

- `@orbit/indexeddb`
  - [#823](https://github.com/orbitjs/orbit/pull/823) Fix IndexedDBCache getInverseRelationshipsAsync ([@dgeb](https://github.com/dgeb))

#### Committers: 1

- Dan Gebhardt ([@dgeb](https://github.com/dgeb))

## v0.16.8 (2021-03-07)

#### :bug: Bug Fix

- `@orbit/indexeddb`
  - [#825](https://github.com/orbitjs/orbit/pull/825) Backport PR 823 to v0.16 ([@dgeb](https://github.com/dgeb))

#### :house: Internal

- [#824](https://github.com/orbitjs/orbit/pull/824) Update release-0-16 branch to use GH actions ([@dgeb](https://github.com/dgeb))

#### Committers: 1

- Dan Gebhardt ([@dgeb](https://github.com/dgeb))

## v0.17.0-beta.14 (2021-02-22)

#### :house: Internal

- `@orbit/coordinator`, `@orbit/core`, `@orbit/data`, `@orbit/identity-map`, `@orbit/immutable`, `@orbit/indexeddb-bucket`, `@orbit/indexeddb`, `@orbit/integration-tests`, `@orbit/jsonapi`, `@orbit/local-storage-bucket`, `@orbit/local-storage`, `@orbit/memory`, `@orbit/record-cache`, `@orbit/records`, `@orbit/serializers`, `@orbit/utils`
  - [#820](https://github.com/orbitjs/orbit/pull/820) Move all tsconfig settings to each package ([@dgeb](https://github.com/dgeb))

#### Committers: 1

- Dan Gebhardt ([@dgeb](https://github.com/dgeb))

## v0.17.0-beta.13 (2021-02-22)

#### :rocket: Enhancement

- Other
  - [#819](https://github.com/orbitjs/orbit/pull/819) tsconfig: enable alwaysStrict + noFallthroughCasesInSwitch options ([@dgeb](https://github.com/dgeb))
- `@orbit/indexeddb`, `@orbit/local-storage`, `@orbit/memory`, `@orbit/record-cache`
  - [#818](https://github.com/orbitjs/orbit/pull/818) Introduce `raiseNotFoundException` option for transform requests ([@dgeb](https://github.com/dgeb))

#### :house: Internal

- `@orbit/record-cache`
  - [#817](https://github.com/orbitjs/orbit/pull/817) Fill in tests for `update` for sync+async caches ([@dgeb](https://github.com/dgeb))

#### Committers: 1

- Dan Gebhardt ([@dgeb](https://github.com/dgeb))

## v0.17.0-beta.12 (2021-02-17)

#### :rocket: Enhancement

- `@orbit/coordinator`
  - [#814](https://github.com/orbitjs/orbit/pull/814) Coordinator: Allow generic typing of getStrategy & getSource ([@dgeb](https://github.com/dgeb))
- `@orbit/indexeddb`, `@orbit/local-storage`, `@orbit/memory`
  - [#813](https://github.com/orbitjs/orbit/pull/813) Implement Queryable + Updatable across all cache-based sources ([@dgeb](https://github.com/dgeb))

#### :house: Internal

- `@orbit/build`, `@orbit/coordinator`, `@orbit/core`, `@orbit/data`, `@orbit/identity-map`, `@orbit/immutable`, `@orbit/indexeddb-bucket`, `@orbit/indexeddb`, `@orbit/integration-tests`, `@orbit/jsonapi`, `@orbit/local-storage-bucket`, `@orbit/local-storage`, `@orbit/memory`, `@orbit/record-cache`, `@orbit/records`, `@orbit/serializers`, `@orbit/utils`
  - [#815](https://github.com/orbitjs/orbit/pull/815) Update all build deps ([@dgeb](https://github.com/dgeb))

#### Committers: 1

- Dan Gebhardt ([@dgeb](https://github.com/dgeb))

## v0.17.0-beta.11 (2021-02-11)

#### :rocket: Enhancement

- `@orbit/memory`
  - [#812](https://github.com/orbitjs/orbit/pull/812) MemorySource: Use cache.update instead of cache.patch ([@dgeb](https://github.com/dgeb))

#### Committers: 1

- Dan Gebhardt ([@dgeb](https://github.com/dgeb))

## v0.17.0-beta.10 (2021-02-11)

#### :rocket: Enhancement

- `@orbit/records`
  - [#811](https://github.com/orbitjs/orbit/pull/811) Use generics in typing record query/transform results ([@dgeb](https://github.com/dgeb))
- `@orbit/indexeddb`, `@orbit/local-storage`, `@orbit/memory`, `@orbit/record-cache`, `@orbit/records`
  - [#810](https://github.com/orbitjs/orbit/pull/810) Ensure that query/transform options are shared between sources and their caches ([@dgeb](https://github.com/dgeb))

#### Committers: 1

- Dan Gebhardt ([@dgeb](https://github.com/dgeb))

## v0.17.0-beta.9 (2021-02-09)

#### :boom: Breaking Change

- `@orbit/coordinator`, `@orbit/core`, `@orbit/data`, `@orbit/identity-map`, `@orbit/indexeddb`, `@orbit/integration-tests`, `@orbit/jsonapi`, `@orbit/local-storage`, `@orbit/memory`, `@orbit/record-cache`, `@orbit/records`
  - [#794](https://github.com/orbitjs/orbit/pull/794) Extract @orbit/records from @orbit/data and introduce full, detailed responses across all sources and caches ([@dgeb](https://github.com/dgeb))

#### :rocket: Enhancement

- `@orbit/core`, `@orbit/indexeddb`, `@orbit/local-storage`, `@orbit/memory`, `@orbit/records`
  - [#808](https://github.com/orbitjs/orbit/pull/808) Ensure that schema + source upgrades are reliably async ([@dgeb](https://github.com/dgeb))
- `@orbit/core`, `@orbit/data`, `@orbit/indexeddb`, `@orbit/jsonapi`, `@orbit/local-storage`, `@orbit/memory`, `@orbit/record-cache`, `@orbit/records`
  - [#807](https://github.com/orbitjs/orbit/pull/807) Improve typings via separate interface definitions, overloaded methods, and more generics ([@dgeb](https://github.com/dgeb))
- `@orbit/integration-tests`, `@orbit/jsonapi`
  - [#806](https://github.com/orbitjs/orbit/pull/806) JSONAPISource: Introduce parallelRequests option ([@dgeb](https://github.com/dgeb))
- `@orbit/data`, `@orbit/jsonapi`
  - [#805](https://github.com/orbitjs/orbit/pull/805) Improve usage of transform / query options ([@dgeb](https://github.com/dgeb))
- `@orbit/data`, `@orbit/integration-tests`
  - [#804](https://github.com/orbitjs/orbit/pull/804) Remove includeSources request option ([@dgeb](https://github.com/dgeb))
- `@orbit/coordinator`, `@orbit/core`, `@orbit/data`, `@orbit/identity-map`, `@orbit/indexeddb`, `@orbit/integration-tests`, `@orbit/jsonapi`, `@orbit/local-storage`, `@orbit/memory`, `@orbit/record-cache`, `@orbit/records`
  - [#794](https://github.com/orbitjs/orbit/pull/794) Extract @orbit/records from @orbit/data and introduce full, detailed responses across all sources and caches ([@dgeb](https://github.com/dgeb))
- `@orbit/jsonapi`
  - [#793](https://github.com/orbitjs/orbit/pull/793) Update operations serializers to follow atomic operations extention ([@tchak](https://github.com/tchak))
- `@orbit/memory`
  - [#795](https://github.com/orbitjs/orbit/pull/795) Improve perf by cloning only newly added relationship ([@enspandi](https://github.com/enspandi))
- `@orbit/coordinator`, `@orbit/core`, `@orbit/data`, `@orbit/identity-map`, `@orbit/immutable`, `@orbit/indexeddb-bucket`, `@orbit/indexeddb`, `@orbit/integration-tests`, `@orbit/jsonapi`, `@orbit/local-storage-bucket`, `@orbit/local-storage`, `@orbit/memory`, `@orbit/record-cache`, `@orbit/serializers`, `@orbit/utils`
  - [#789](https://github.com/orbitjs/orbit/pull/789) Further improvements in typings ([@dgeb](https://github.com/dgeb))

#### :house: Internal

- `@orbit/build`, `@orbit/coordinator`, `@orbit/core`, `@orbit/data`, `@orbit/identity-map`, `@orbit/immutable`, `@orbit/indexeddb-bucket`, `@orbit/indexeddb`, `@orbit/jsonapi`, `@orbit/local-storage-bucket`, `@orbit/local-storage`, `@orbit/memory`, `@orbit/record-cache`, `@orbit/records`, `@orbit/serializers`, `@orbit/utils`
  - [#809](https://github.com/orbitjs/orbit/pull/809) Add publishConfig settings to package.json ([@dgeb](https://github.com/dgeb))
- Other
  - [#802](https://github.com/orbitjs/orbit/pull/802) CI: Separate lint+compile job from test job ([@dgeb](https://github.com/dgeb))
  - [#800](https://github.com/orbitjs/orbit/pull/800) Switch CI from Travis to Github ([@dgeb](https://github.com/dgeb))
- `@orbit/jsonapi`
  - [#792](https://github.com/orbitjs/orbit/pull/792) Add multi-expression/operation tests for jsonapi ([@dgeb](https://github.com/dgeb))
- `@orbit/jsonapi`, `@orbit/record-cache`
  - [#791](https://github.com/orbitjs/orbit/pull/791) Separate extra-long test modules into multiple modules ([@dgeb](https://github.com/dgeb))

#### Committers: 3

- Andreas Minnich ([@enspandi](https://github.com/enspandi))
- Dan Gebhardt ([@dgeb](https://github.com/dgeb))
- Paul Chavard ([@tchak](https://github.com/tchak))

## v0.17.0-beta.8 (2020-09-27)

#### :rocket: Enhancement

- `@orbit/coordinator`, `@orbit/core`, `@orbit/data`, `@orbit/identity-map`, `@orbit/immutable`, `@orbit/indexeddb-bucket`, `@orbit/indexeddb`, `@orbit/integration-tests`, `@orbit/jsonapi`, `@orbit/local-storage-bucket`, `@orbit/local-storage`, `@orbit/memory`, `@orbit/record-cache`, `@orbit/serializers`, `@orbit/utils`
  - [#788](https://github.com/orbitjs/orbit/pull/788) Enable TS strict mode ([@dgeb](https://github.com/dgeb))
- `@orbit/data`
  - [#784](https://github.com/orbitjs/orbit/pull/784) Introduce UninitializedRecord interface, with optional `id` ([@dgeb](https://github.com/dgeb))

#### :memo: Documentation

- `@orbit/coordinator`, `@orbit/core`, `@orbit/data`, `@orbit/indexeddb-bucket`, `@orbit/local-storage-bucket`, `@orbit/memory`, `@orbit/utils`
  - [#787](https://github.com/orbitjs/orbit/pull/787) Remove redundant / unnecessary type-related comments ([@dgeb](https://github.com/dgeb))
- `@orbit/utils`
  - [#786](https://github.com/orbitjs/orbit/pull/786) Deprecate `merge`, `extend`, and `expose` utility fns ([@dgeb](https://github.com/dgeb))
- `@orbit/data`
  - [#785](https://github.com/orbitjs/orbit/pull/785) Deprecate inflectors (singularize/pluralize) on Schema ([@dgeb](https://github.com/dgeb))

#### Committers: 1

- Dan Gebhardt ([@dgeb](https://github.com/dgeb))

## v0.17.0-beta.7 (2020-09-16)

#### :rocket: Enhancement

- `@orbit/jsonapi`
  - [#783](https://github.com/orbitjs/orbit/pull/783) [jsonapi] Register `object` and `array` types to use NoopSerializer by default ([@dgeb](https://github.com/dgeb))
  - [#775](https://github.com/orbitjs/orbit/pull/775) Add unknown serializer ([@tchak](https://github.com/tchak))

#### :bug: Bug Fix

- `@orbit/data`
  - [#780](https://github.com/orbitjs/orbit/pull/780) Support coalescing of addRecord/updateRecord + updateRecord ([@dgeb](https://github.com/dgeb))

#### :house: Internal

- `@orbit/build`, `@orbit/coordinator`, `@orbit/core`, `@orbit/data`, `@orbit/identity-map`, `@orbit/immutable`, `@orbit/indexeddb-bucket`, `@orbit/indexeddb`, `@orbit/integration-tests`, `@orbit/jsonapi`, `@orbit/local-storage-bucket`, `@orbit/local-storage`, `@orbit/memory`, `@orbit/record-cache`, `@orbit/serializers`, `@orbit/utils`
  - [#782](https://github.com/orbitjs/orbit/pull/782) Use @orbit/prettier-config ([@dgeb](https://github.com/dgeb))
- `@orbit/record-cache`
  - [#776](https://github.com/orbitjs/orbit/pull/776) Expand record-cache tests for liveQuery ([@dgeb](https://github.com/dgeb))

#### Committers: 3

- Chris Bonser ([@chbonser](https://github.com/chbonser))
- Dan Gebhardt ([@dgeb](https://github.com/dgeb))
- Paul Chavard ([@tchak](https://github.com/tchak))

## v0.16.7 (2020-09-14)

#### :bug: Bug Fix

- `@orbit/data`
  - [#781](https://github.com/orbitjs/orbit/pull/781) Backport PR 780 to v0.16 ([@dgeb](https://github.com/dgeb))

#### Committers: 1

- Dan Gebhardt ([@dgeb](https://github.com/dgeb))

## v0.17.0-beta.5 (2020-07-31)

#### :rocket: Enhancement

- `@orbit/data`
  - [#772](https://github.com/orbitjs/orbit/pull/772) Fill out recordDiffs implementation ([@dgeb](https://github.com/dgeb))
- `@orbit/jsonapi`
  - [#771](https://github.com/orbitjs/orbit/pull/771) Expand exports in @orbit/jsonapi ([@dgeb](https://github.com/dgeb))

#### Committers: 1

- Dan Gebhardt ([@dgeb](https://github.com/dgeb))

## v0.17.0-beta.4 (2020-07-27)

#### :boom: Breaking Change

- `@orbit/integration-tests`, `@orbit/jsonapi`
  - [#758](https://github.com/orbitjs/orbit/pull/758) Refactor JSON:API serializers ([@dgeb](https://github.com/dgeb))
- `@orbit/core`, `@orbit/data`, `@orbit/indexeddb`, `@orbit/jsonapi`, `@orbit/memory`, `@orbit/record-cache`, `@orbit/utils`
  - [#751](https://github.com/orbitjs/orbit/pull/751) Remove v0.16 deprecations ([@dgeb](https://github.com/dgeb))

#### :rocket: Enhancement

- `@orbit/data`, `@orbit/jsonapi`, `@orbit/memory`, `@orbit/record-cache`
  - [#765](https://github.com/orbitjs/orbit/pull/765) Add options to QueryExpression and Operation ([@tchak](https://github.com/tchak))
- `@orbit/integration-tests`, `@orbit/jsonapi`
  - [#758](https://github.com/orbitjs/orbit/pull/758) Refactor JSON:API serializers ([@dgeb](https://github.com/dgeb))
- `@orbit/serializers`, `@orbit/utils`
  - [#761](https://github.com/orbitjs/orbit/pull/761) Introduce inflectors to @orbit/serializers ([@dgeb](https://github.com/dgeb))
- `@orbit/jsonapi`, `@orbit/serializers`
  - [#757](https://github.com/orbitjs/orbit/pull/757) Refactor @orbit/serializers ([@dgeb](https://github.com/dgeb))
- `@orbit/indexeddb`, `@orbit/local-storage`, `@orbit/memory`
  - [#759](https://github.com/orbitjs/orbit/pull/759) cache settings as part of source settings should be partial ([@tchak](https://github.com/tchak))

#### :bug: Bug Fix

- `@orbit/memory`, `@orbit/record-cache`
  - [#762](https://github.com/orbitjs/orbit/pull/762) Fix cache integrity processors' handling of relationships without explicit inverses. ([@dgeb](https://github.com/dgeb))
- `@orbit/indexeddb`
  - [#752](https://github.com/orbitjs/orbit/pull/752) Finish opening/upgrading indexeddb dbs before closing them ([@dgeb](https://github.com/dgeb))

#### :house: Internal

- `@orbit/build`
  - [#770](https://github.com/orbitjs/orbit/pull/770) Update snowpack ([@dgeb](https://github.com/dgeb))
  - [#756](https://github.com/orbitjs/orbit/pull/756) Update build deps ([@dgeb](https://github.com/dgeb))
- `@orbit/coordinator`, `@orbit/core`, `@orbit/data`, `@orbit/identity-map`, `@orbit/immutable`, `@orbit/indexeddb-bucket`, `@orbit/indexeddb`, `@orbit/integration-tests`, `@orbit/jsonapi`, `@orbit/local-storage-bucket`, `@orbit/local-storage`, `@orbit/memory`, `@orbit/record-cache`
  - [#766](https://github.com/orbitjs/orbit/pull/766) Refactor internal modules to remove default module exports ([@dgeb](https://github.com/dgeb))
- Other
  - [#764](https://github.com/orbitjs/orbit/pull/764) Upgrade build dependencies (except snowpack) ([@dgeb](https://github.com/dgeb))
  - [#753](https://github.com/orbitjs/orbit/pull/753) Test on travis with updated ubuntu (and thus updated Chrome) ([@dgeb](https://github.com/dgeb))
- `@orbit/build`, `@orbit/coordinator`, `@orbit/core`, `@orbit/data`, `@orbit/identity-map`, `@orbit/immutable`, `@orbit/indexeddb-bucket`, `@orbit/indexeddb`, `@orbit/integration-tests`, `@orbit/jsonapi`, `@orbit/local-storage-bucket`, `@orbit/local-storage`, `@orbit/memory`, `@orbit/record-cache`, `@orbit/serializers`, `@orbit/utils`
  - [#750](https://github.com/orbitjs/orbit/pull/750) Introduce @orbit/build ([@dgeb](https://github.com/dgeb))
- `@orbit/integration-tests`
  - [#748](https://github.com/orbitjs/orbit/pull/748) Reintroduce @orbit/integration-tests ([@dgeb](https://github.com/dgeb))

#### Committers: 2

- Dan Gebhardt ([@dgeb](https://github.com/dgeb))
- Paul Chavard ([@tchak](https://github.com/tchak))

## v0.16.6 (2020-07-24)

#### :bug: Bug Fix

- `@orbit/record-cache`
  - [#763](https://github.com/orbitjs/orbit/pull/763) Backport PR 762 to v0.16 (Fix cache integrity processors' handling of relationships without explicit inverses) ([@dgeb](https://github.com/dgeb))

#### Committers: 1

- Dan Gebhardt ([@dgeb](https://github.com/dgeb))

## v0.17.0-beta.3 (2020-05-08)

#### :rocket: Enhancement

- `@orbit/jsonapi`
  - [#746](https://github.com/orbitjs/orbit/pull/746) [jsonapi] Support `url` request option ([@dgeb](https://github.com/dgeb))
- `@orbit/data`, `@orbit/indexeddb`, `@orbit/jsonapi`, `@orbit/local-storage`, `@orbit/memory`, `@orbit/record-cache`
  - [#742](https://github.com/orbitjs/orbit/pull/742) Standardize request option handling ([@dgeb](https://github.com/dgeb))
- `@orbit/record-cache`
  - [#738](https://github.com/orbitjs/orbit/pull/738) Add debounce option to liveQuery ([@tchak](https://github.com/tchak))

#### :house: Internal

- `@orbit/coordinator`, `@orbit/core`, `@orbit/data`, `@orbit/identity-map`, `@orbit/immutable`, `@orbit/indexeddb-bucket`, `@orbit/indexeddb`, `@orbit/integration-tests`, `@orbit/jsonapi`, `@orbit/local-storage-bucket`, `@orbit/local-storage`, `@orbit/memory`, `@orbit/record-cache`, `@orbit/serializers`, `@orbit/store`, `@orbit/utils`
  - [#747](https://github.com/orbitjs/orbit/pull/747) Refactor builds and remove deprecated @orbit/store ([@dgeb](https://github.com/dgeb))
  - [#744](https://github.com/orbitjs/orbit/pull/744) Prettier2 ([@tchak](https://github.com/tchak))
  - [#740](https://github.com/orbitjs/orbit/pull/740) Update some dependencies ([@tchak](https://github.com/tchak))

#### Committers: 2

- Dan Gebhardt ([@dgeb](https://github.com/dgeb))
- Paul Chavard ([@tchak](https://github.com/tchak))

## v0.16.5 (2020-03-12)

#### :rocket: Enhancement

- `@orbit/data`, `@orbit/memory`, `@orbit/record-cache`
  - [#739](https://github.com/orbitjs/orbit/pull/739) Backport PR 735 to v0.16 (Improve mergeRecords to better handle links, meta, and relationships) ([@dgeb](https://github.com/dgeb))

#### Committers: 1

- Dan Gebhardt ([@dgeb](https://github.com/dgeb))

## v0.17.0-beta.2 (2020-03-07)

#### :rocket: Enhancement

- `@orbit/record-cache`
  - [#718](https://github.com/orbitjs/orbit/pull/718) Implement live query on @orbit/record-cache ([@tchak](https://github.com/tchak))
- `@orbit/data`
  - [#736](https://github.com/orbitjs/orbit/pull/736) Remove deprecated `expression` property on query ([@tchak](https://github.com/tchak))
- `@orbit/data`, `@orbit/memory`, `@orbit/record-cache`
  - [#735](https://github.com/orbitjs/orbit/pull/735) Improve mergeRecords to better handle links, meta, and relationships ([@dgeb](https://github.com/dgeb))
- `@orbit/jsonapi`
  - [#727](https://github.com/orbitjs/orbit/pull/727) Handle 304 responses in jsonapi-request-processor ([@pangratz](https://github.com/pangratz))
  - [#731](https://github.com/orbitjs/orbit/pull/731) Export all the types from jsonapi source ([@tchak](https://github.com/tchak))
- `@orbit/coordinator`, `@orbit/core`, `@orbit/data`
  - [#732](https://github.com/orbitjs/orbit/pull/732) Improve control of source and strategy activation and deactivation ([@dgeb](https://github.com/dgeb))
- `@orbit/core`, `@orbit/data`, `@orbit/indexeddb-bucket`, `@orbit/local-storage-bucket`
  - [#726](https://github.com/orbitjs/orbit/pull/726) Bucket.clear() ([@pangratz](https://github.com/pangratz))
- `@orbit/data`, `@orbit/indexeddb`, `@orbit/integration-tests`, `@orbit/jsonapi`, `@orbit/local-storage`, `@orbit/memory`, `@orbit/record-cache`
  - [#692](https://github.com/orbitjs/orbit/pull/692) Deprecate model on relationshipDef ([@tchak](https://github.com/tchak))

#### :bug: Bug Fix

- `@orbit/data`
  - [#710](https://github.com/orbitjs/orbit/pull/710) Allow mergeOperations to set null for hasOne relationship ([@jembezmamy](https://github.com/jembezmamy))
- `@orbit/jsonapi`
  - [#712](https://github.com/orbitjs/orbit/pull/712) [BUGFIX] Always allow serialization of null attributes ([@makepanic](https://github.com/makepanic))

#### :memo: Documentation

- [#729](https://github.com/orbitjs/orbit/pull/729) first pass at generating docs with typedoc ([@brumm](https://github.com/brumm))

#### :house: Internal

- `@orbit/record-cache`
  - [#721](https://github.com/orbitjs/orbit/pull/721) fix deprecations ([@tchak](https://github.com/tchak))
- `@orbit/coordinator`, `@orbit/core`, `@orbit/data`, `@orbit/identity-map`, `@orbit/immutable`, `@orbit/indexeddb-bucket`, `@orbit/indexeddb`, `@orbit/integration-tests`, `@orbit/jsonapi`, `@orbit/local-storage-bucket`, `@orbit/local-storage`, `@orbit/memory`, `@orbit/record-cache`, `@orbit/serializers`, `@orbit/store`, `@orbit/utils`
  - [#719](https://github.com/orbitjs/orbit/pull/719) Update dependencies ([@tchak](https://github.com/tchak))

#### Committers: 6

- Christian ([@makepanic](https://github.com/makepanic))
- Clemens M�ller ([@pangratz](https://github.com/pangratz))
- Dan Gebhardt ([@dgeb](https://github.com/dgeb))
- Paul Chavard ([@tchak](https://github.com/tchak))
- Paweł Bator ([@jembezmamy](https://github.com/jembezmamy))
- Philipp Brumm ([@brumm](https://github.com/brumm))

## v0.17.0-beta.1 (2019-09-22)

#### :rocket: Enhancement

- `@orbit/core`, `@orbit/data`, `@orbit/record-cache`
  - [#695](https://github.com/orbitjs/orbit/pull/695) Return off function from evented subscribers ([@tchak](https://github.com/tchak))
- `@orbit/indexeddb`, `@orbit/local-storage`
  - [#689](https://github.com/orbitjs/orbit/pull/689) Various small improvements to indexeddb and local-storage sources ([@tchak](https://github.com/tchak))
- `@orbit/indexeddb`
  - [#694](https://github.com/orbitjs/orbit/pull/694) Move indexeddb database opening code to source activate hook ([@tchak](https://github.com/tchak))
- `@orbit/data`, `@orbit/indexeddb`, `@orbit/jsonapi`, `@orbit/local-storage`, `@orbit/memory`, `@orbit/record-cache`
  - [#688](https://github.com/orbitjs/orbit/pull/688) Query with multiple expressions ([@tchak](https://github.com/tchak))

#### Committers: 1

- Paul Chavard ([@tchak](https://github.com/tchak))

## v0.16.4 (2019-12-10)

#### :bug: Bug Fix

- `@orbit/data`
  - [#710](https://github.com/orbitjs/orbit/pull/710) Allow mergeOperations to set null for hasOne relationship ([@jembezmamy](https://github.com/jembezmamy))
- `@orbit/jsonapi`
  - [#712](https://github.com/orbitjs/orbit/pull/712) [BUGFIX] Always allow serialization of null attributes ([@makepanic](https://github.com/makepanic))

#### Committers: 2

- Christian ([@makepanic](https://github.com/makepanic))
- Paweł Bator ([@jembezmamy](https://github.com/jembezmamy))

## v0.16.3 (2019-09-22)

#### :bug: Bug Fix

- `@orbit/memory`, `@orbit/record-cache`
  - [#702](https://github.com/orbitjs/orbit/pull/702) Always ignore undefined values when filtering ([@dgeb](https://github.com/dgeb))
- `@orbit/record-cache`
  - [#701](https://github.com/orbitjs/orbit/pull/701) fix: added null case to relatedRecord filter processing ([@Michiel87](https://github.com/Michiel87))

#### :house: Internal

- `@orbit/coordinator`
  - [#697](https://github.com/orbitjs/orbit/pull/697) Bump mixin-deep from 1.3.1 to 1.3.2 in /packages/@orbit/coordinator ([@dependabot[bot]](https://github.com/apps/dependabot))
- `@orbit/utils`
  - [#698](https://github.com/orbitjs/orbit/pull/698) Bump mixin-deep from 1.3.1 to 1.3.2 in /packages/@orbit/utils ([@dependabot[bot]](https://github.com/apps/dependabot))
- `@orbit/coordinator`, `@orbit/core`, `@orbit/data`, `@orbit/identity-map`, `@orbit/immutable`, `@orbit/indexeddb-bucket`, `@orbit/indexeddb`, `@orbit/integration-tests`, `@orbit/jsonapi`, `@orbit/local-storage-bucket`, `@orbit/local-storage`, `@orbit/memory`, `@orbit/record-cache`, `@orbit/serializers`, `@orbit/store`, `@orbit/utils`
  - [#693](https://github.com/orbitjs/orbit/pull/693) Update dependencies ([@tchak](https://github.com/tchak))
- Other
  - [#691](https://github.com/orbitjs/orbit/pull/691) Use yarn workspaces ([@tchak](https://github.com/tchak))

#### Committers: 3

- Dan Gebhardt ([@dgeb](https://github.com/dgeb))
- Michiel de Vos ([@Michiel87](https://github.com/Michiel87))
- Paul Chavard ([@tchak](https://github.com/tchak))

## v0.16.2 (2019-09-05)

#### :bug: Bug Fix

- `@orbit/coordinator`
  - [#687](https://github.com/orbitjs/orbit/pull/687) Ensure that RequestStrategy handler functions receive all args ([@dgeb](https://github.com/dgeb))

#### Committers: 1

- Dan Gebhardt ([@dgeb](https://github.com/dgeb))

## v0.16.1 (2019-08-20)

#### :rocket: Enhancement

- `@orbit/jsonapi`
  - [#683](https://github.com/orbitjs/orbit/pull/683) fix(jsonapi): don't deserialize null attributes ([@makepanic](https://github.com/makepanic))

#### :bug: Bug Fix

- `@orbit/core`
  - [#686](https://github.com/orbitjs/orbit/pull/686) Add guards to check that `TaskQueue`s have at least one processor ([@cibernox](https://github.com/cibernox))
- `@orbit/coordinator`, `@orbit/core`, `@orbit/data`, `@orbit/identity-map`, `@orbit/immutable`, `@orbit/indexeddb-bucket`, `@orbit/indexeddb`, `@orbit/integration-tests`, `@orbit/jsonapi`, `@orbit/local-storage-bucket`, `@orbit/local-storage`, `@orbit/memory`, `@orbit/record-cache`, `@orbit/serializers`, `@orbit/store`, `@orbit/utils`
  - [#684](https://github.com/orbitjs/orbit/pull/684) Target ES-latest by default + Fix ES5 builds ([@dgeb](https://github.com/dgeb))

#### :memo: Documentation

- `@orbit/store`
  - [#681](https://github.com/orbitjs/orbit/pull/681) fix: fix typo in deprecation message ([@makepanic](https://github.com/makepanic))

#### Committers: 3

- Christian ([@makepanic](https://github.com/makepanic))
- Dan Gebhardt ([@dgeb](https://github.com/dgeb))
- Miguel Camba ([@cibernox](https://github.com/cibernox))

## v0.16.0 (2019-07-30)

No changes.

## v0.16.0-beta.11 (2019-07-18)

#### :boom: Breaking Change

- `@orbit/data`, `@orbit/indexeddb`, `@orbit/jsonapi`, `@orbit/local-storage`, `@orbit/memory`
  - [#678](https://github.com/orbitjs/orbit/pull/678) [BREAKING] Shift some responsibilities for transform-related interfaces to source implementations ([@dgeb](https://github.com/dgeb))

#### :rocket: Enhancement

- `@orbit/coordinator`, `@orbit/data`, `@orbit/indexeddb`, `@orbit/jsonapi`, `@orbit/local-storage`, `@orbit/memory`
  - [#680](https://github.com/orbitjs/orbit/pull/680) [DEPRECATION] Deprecate `_transformed` in favor of `transformed` ([@dgeb](https://github.com/dgeb))

#### :house: Internal

- `@orbit/jsonapi`, `@orbit/memory`
  - [#679](https://github.com/orbitjs/orbit/pull/679) Standardize update responses ([@dgeb](https://github.com/dgeb))
- `@orbit/data`
  - [#677](https://github.com/orbitjs/orbit/pull/677) Convert source interface implementations to use async/await ([@dgeb](https://github.com/dgeb))

#### Committers: 2

- Dan Gebhardt ([@dgeb](https://github.com/dgeb))
- Paul Chavard ([@tchak](https://github.com/tchak))

## v0.16.0-beta.10 (2019-07-10)

#### :rocket: Enhancement

- `@orbit/memory`
  - [#676](https://github.com/orbitjs/orbit/pull/676) [memory] Support hints for `update` ([@dgeb](https://github.com/dgeb))
- `@orbit/indexeddb`, `@orbit/memory`
  - [#675](https://github.com/orbitjs/orbit/pull/675) Add more deprecations ([@tchak](https://github.com/tchak))

#### :bug: Bug Fix

- `@orbit/data`
  - [#674](https://github.com/orbitjs/orbit/pull/674) Remove queues processing from deactivate ([@tchak](https://github.com/tchak))

#### Committers: 2

- Dan Gebhardt ([@dgeb](https://github.com/dgeb))
- Paul Chavard ([@tchak](https://github.com/tchak))

## v0.16.0-beta.9 (2019-07-09)

#### :rocket: Enhancement

- `@orbit/core`
  - [#673](https://github.com/orbitjs/orbit/pull/673) Ensure that cancelled tasks in queues have promises rejected ([@dgeb](https://github.com/dgeb))
- `@orbit/jsonapi`
  - [#668](https://github.com/orbitjs/orbit/pull/668) Expose meta and links from processors to source ([@tchak](https://github.com/tchak))
  - [#667](https://github.com/orbitjs/orbit/pull/667) Add Updatable interface to jsonapi source ([@tchak](https://github.com/tchak))
- `@orbit/coordinator`, `@orbit/data`, `@orbit/integration-tests`
  - [#671](https://github.com/orbitjs/orbit/pull/671) Introduce explicit source activation + deactivation ([@tchak](https://github.com/tchak))
- `@orbit/data`, `@orbit/jsonapi`, `@orbit/record-cache`
  - [#669](https://github.com/orbitjs/orbit/pull/669) Add filter|sort|page support to findRelatedRecords queries ([@tchak](https://github.com/tchak))
- `@orbit/data`
  - [#662](https://github.com/orbitjs/orbit/pull/662) Warn if naive singularize method receives a word that doesn't end in "s" ([@lukemelia](https://github.com/lukemelia))

#### :bug: Bug Fix

- `@orbit/core`
  - [#673](https://github.com/orbitjs/orbit/pull/673) Ensure that cancelled tasks in queues have promises rejected ([@dgeb](https://github.com/dgeb))
- `@orbit/coordinator`, `@orbit/data`, `@orbit/integration-tests`
  - [#671](https://github.com/orbitjs/orbit/pull/671) Introduce explicit source activation + deactivation ([@tchak](https://github.com/tchak))

#### :house: Internal

- `@orbit/coordinator`, `@orbit/core`, `@orbit/data`, `@orbit/identity-map`, `@orbit/indexeddb-bucket`, `@orbit/indexeddb`, `@orbit/integration-tests`, `@orbit/jsonapi`, `@orbit/local-storage-bucket`, `@orbit/local-storage`, `@orbit/memory`, `@orbit/record-cache`, `@orbit/store`
  - [#672](https://github.com/orbitjs/orbit/pull/672) Clean up yarn.lock interdependencies ([@dgeb](https://github.com/dgeb))
- `@orbit/data`, `@orbit/jsonapi`, `@orbit/record-cache`, `@orbit/utils`
  - [#670](https://github.com/orbitjs/orbit/pull/670) Use native isArray ([@tchak](https://github.com/tchak))
- `@orbit/indexeddb`, `@orbit/local-storage`, `@orbit/memory`, `@orbit/record-cache`
  - [#666](https://github.com/orbitjs/orbit/pull/666) Refactor @orbit/record-cache with a stricter TS config ([@tchak](https://github.com/tchak))
- `@orbit/coordinator`, `@orbit/core`, `@orbit/data`, `@orbit/identity-map`, `@orbit/immutable`, `@orbit/indexeddb-bucket`, `@orbit/indexeddb`, `@orbit/integration-tests`, `@orbit/jsonapi`, `@orbit/local-storage-bucket`, `@orbit/local-storage`, `@orbit/memory`, `@orbit/record-cache`, `@orbit/serializers`, `@orbit/store`, `@orbit/utils`
  - [#664](https://github.com/orbitjs/orbit/pull/664) Upgrade npm dependencies (mostly prettier) ([@tchak](https://github.com/tchak))

#### Committers: 3

- Dan Gebhardt ([@dgeb](https://github.com/dgeb))
- Luke Melia ([@lukemelia](https://github.com/lukemelia))
- Paul Chavard ([@tchak](https://github.com/tchak))

## v0.16.0-beta.8 (2019-06-09)

#### :rocket: Enhancement

- `@orbit/jsonapi`
  - [#658](https://github.com/orbitjs/orbit/pull/658) Add serializeOperation to @orbit/jsonapi ([@tchak](https://github.com/tchak))
  - [#639](https://github.com/orbitjs/orbit/pull/639) @orbit/jsonapi-serializer operations (deserialize) ([@tchak](https://github.com/tchak))
- `@orbit/data`
  - [#642](https://github.com/orbitjs/orbit/pull/642) Add {get|each}Attribute and {get|each}Relationship methods ([@tchak](https://github.com/tchak))

#### :bug: Bug Fix

- `@orbit/data`
  - [#659](https://github.com/orbitjs/orbit/pull/659) Throw when invalid filter expression. ([@lukemelia](https://github.com/lukemelia))
- `@orbit/integration-tests`, `@orbit/jsonapi`
  - [#654](https://github.com/orbitjs/orbit/pull/654) Fix generation of empty responses on tests ([@cibernox](https://github.com/cibernox))
- `@orbit/jsonapi`
  - [#648](https://github.com/orbitjs/orbit/pull/648) When serializing, exclude attributes & relationships not in the schema ([@lukemelia](https://github.com/lukemelia))

#### :house: Internal

- `@orbit/indexeddb-bucket`, `@orbit/indexeddb`, `@orbit/integration-tests`, `@orbit/jsonapi`, `@orbit/local-storage-bucket`, `@orbit/local-storage`, `@orbit/memory`, `@orbit/serializers`, `@orbit/store`
  - [#657](https://github.com/orbitjs/orbit/pull/657) And the last packages with prettier ([@tchak](https://github.com/tchak))
- `@orbit/data`, `@orbit/record-cache`, `@orbit/utils`
  - [#656](https://github.com/orbitjs/orbit/pull/656) Apply prettier to even more packages ([@tchak](https://github.com/tchak))
- `@orbit/coordinator`, `@orbit/identity-map`, `@orbit/immutable`
  - [#655](https://github.com/orbitjs/orbit/pull/655) Add prettier to more packages ([@tchak](https://github.com/tchak))
- `@orbit/core`
  - [#649](https://github.com/orbitjs/orbit/pull/649) Prettier ([@tchak](https://github.com/tchak))

#### Committers: 3

- Luke Melia ([@lukemelia](https://github.com/lukemelia))
- Miguel Camba ([@cibernox](https://github.com/cibernox))
- Paul Chavard ([@tchak](https://github.com/tchak))

## v0.16.0-beta.7 (2019-05-24)

#### :boom: Breaking Change

- `@orbit/coordinator`, `@orbit/core`, `@orbit/data`, `@orbit/identity-map`, `@orbit/immutable`, `@orbit/indexeddb-bucket`, `@orbit/indexeddb`, `@orbit/jsonapi`, `@orbit/local-storage-bucket`, `@orbit/local-storage`, `@orbit/memory`, `@orbit/record-cache`, `@orbit/serializers`, `@orbit/store`, `@orbit/utils`
  - [#647](https://github.com/orbitjs/orbit/pull/647) Revert "Update language level of module target to es2017" ([@dgeb](https://github.com/dgeb))

#### Committers: 1

- Dan Gebhardt ([@dgeb](https://github.com/dgeb))

## v0.16.0-beta.6 (2019-05-23)

#### :boom: Breaking Change

- `@orbit/coordinator`, `@orbit/core`, `@orbit/data`, `@orbit/identity-map`, `@orbit/immutable`, `@orbit/indexeddb-bucket`, `@orbit/indexeddb`, `@orbit/jsonapi`, `@orbit/local-storage-bucket`, `@orbit/local-storage`, `@orbit/memory`, `@orbit/record-cache`, `@orbit/serializers`, `@orbit/store`, `@orbit/utils`
  - [#644](https://github.com/orbitjs/orbit/pull/644) Update language level of module target to es2017 ([@dgeb](https://github.com/dgeb))
- `@orbit/integration-tests`, `@orbit/memory`, `@orbit/store`
  - [#634](https://github.com/orbitjs/orbit/pull/634) Rename @orbit/store to @orbit/memory ([@tchak](https://github.com/tchak))

#### :rocket: Enhancement

- `@orbit/integration-tests`, `@orbit/jsonapi`
  - [#630](https://github.com/orbitjs/orbit/pull/630) Introduce JSONAPIRequestProcessor ([@lukemelia](https://github.com/lukemelia))
- `@orbit/identity-map`
  - [#636](https://github.com/orbitjs/orbit/pull/636) Implement @orbit/identity-map ([@tchak](https://github.com/tchak))
- `@orbit/data`, `@orbit/record-cache`
  - [#627](https://github.com/orbitjs/orbit/pull/627) Polymorphic Relationships ([@ggayowsky](https://github.com/ggayowsky))

#### :bug: Bug Fix

- `@orbit/memory`, `@orbit/record-cache`
  - [#637](https://github.com/orbitjs/orbit/pull/637) Dependent record deletion not updating ([@ggayowsky](https://github.com/ggayowsky))

#### :memo: Documentation

- `@orbit/data`
  - [#633](https://github.com/orbitjs/orbit/pull/633) replaceRelatedRecord should accept null ([@tchak](https://github.com/tchak))
- `@orbit/core`
  - [#629](https://github.com/orbitjs/orbit/pull/629) Fixed typo in comment ([@lukemelia](https://github.com/lukemelia))

#### :house: Internal

- `@orbit/coordinator`, `@orbit/core`, `@orbit/data`, `@orbit/identity-map`, `@orbit/immutable`, `@orbit/indexeddb-bucket`, `@orbit/indexeddb`, `@orbit/integration-tests`, `@orbit/jsonapi`, `@orbit/local-storage-bucket`, `@orbit/local-storage`, `@orbit/memory`, `@orbit/record-cache`, `@orbit/serializers`, `@orbit/store`, `@orbit/utils`
  - [#645](https://github.com/orbitjs/orbit/pull/645) Update lerna and build scripts ([@dgeb](https://github.com/dgeb))
  - [#643](https://github.com/orbitjs/orbit/pull/643) git clean prior to publishing packages ([@dgeb](https://github.com/dgeb))
- `@orbit/coordinator`, `@orbit/core`, `@orbit/data`, `@orbit/immutable`, `@orbit/indexeddb-bucket`, `@orbit/indexeddb`, `@orbit/integration-tests`, `@orbit/jsonapi`, `@orbit/local-storage-bucket`, `@orbit/local-storage`, `@orbit/record-cache`, `@orbit/serializers`, `@orbit/store`, `@orbit/utils`
  - [#632](https://github.com/orbitjs/orbit/pull/632) Remove unnecessary dependencies from builds ([@dgeb](https://github.com/dgeb))
  - [#631](https://github.com/orbitjs/orbit/pull/631) Switch to yarn ([@dgeb](https://github.com/dgeb))

#### Committers: 4

- Dan Gebhardt ([@dgeb](https://github.com/dgeb))
- Gerald Gayowsky ([@ggayowsky](https://github.com/ggayowsky))
- Luke Melia ([@lukemelia](https://github.com/lukemelia))
- Paul Chavard ([@tchak](https://github.com/tchak))

## v0.16.0-beta.5 (2019-04-16)

#### :bug: Bug Fix

- `@orbit/record-cache`
  - [#625](https://github.com/orbitjs/orbit/pull/625) Fix updating an empty record with an empty relationship ([@simonihmig](https://github.com/simonihmig))

#### Committers: 1

- Simon Ihmig ([@simonihmig](https://github.com/simonihmig))

## v0.16.0-beta.4 (2019-04-15)

#### :rocket: Enhancement

- `@orbit/jsonapi`
  - [#621](https://github.com/orbitjs/orbit/pull/621) Extract appendQueryParams in its own method ([@tchak](https://github.com/tchak))

#### :bug: Bug Fix

- `@orbit/record-cache`, `@orbit/store`
  - [#620](https://github.com/orbitjs/orbit/pull/620) Fix update record not populating inverse relationships ([@ggayowsky](https://github.com/ggayowsky))

#### :house: Internal

- `@orbit/indexeddb`
  - [#623](https://github.com/orbitjs/orbit/pull/623) Rationalize indexes ([@tchak](https://github.com/tchak))

#### Committers: 2

- Gerald Gayowsky ([@ggayowsky](https://github.com/ggayowsky))
- Paul Chavard ([@tchak](https://github.com/tchak))

## v0.16.0-beta.3 (2019-03-17)

#### :bug: Bug Fix

- `@orbit/indexeddb`, `@orbit/local-storage`, `@orbit/record-cache`
  - [#608](https://github.com/orbitjs/orbit/pull/608) RemoveRecord when part of has many relationship should not clobber the whole relationship in IndexedDB source ([@tchak](https://github.com/tchak))
- `@orbit/indexeddb`, `@orbit/local-storage`
  - [#606](https://github.com/orbitjs/orbit/pull/606) Do not reset persisting sources on initalize ([@tchak](https://github.com/tchak))

#### :house: Internal

- `@orbit/indexeddb`, `@orbit/local-storage`
  - [#610](https://github.com/orbitjs/orbit/pull/610) Add tests to verify local storage + indexeddb sources are not reset on initialization ([@dgeb](https://github.com/dgeb))
- `@orbit/integration-tests`
  - [#609](https://github.com/orbitjs/orbit/pull/609) Add integration-tests package ([@dgeb](https://github.com/dgeb))

#### Committers: 2

- Dan Gebhardt ([@dgeb](https://github.com/dgeb))
- Paul Chavard ([@tchak](https://github.com/tchak))

## v0.16.0-beta.2 (2019-03-14)

#### :rocket: Enhancement

- `@orbit/store`
  - [#596](https://github.com/orbitjs/orbit/pull/596) Add Store.rebase() ([@Bernhard---H](https://github.com/Bernhard---H))

#### :bug: Bug Fix

- `@orbit/record-cache`

  - [#603](https://github.com/orbitjs/orbit/pull/603) Return empty array when querying for non-existing relationships with findRelatedRecords ([@PieterJanVdb](https://github.com/PieterJanVdb))

- `@orbit/record-cache`
  - [#605](https://github.com/orbitjs/orbit/pull/605) Extends #603 to fix related errors ([@dgeb](https://github.com/dgeb))

#### :house: Internal

- `@orbit/store`
  - [#604](https://github.com/orbitjs/orbit/pull/604) Cleanup and extend store tests ([@dgeb](https://github.com/dgeb))

#### Committers: 3

- Bernhard Halbartschlager ([@Bernhard---H](https://github.com/Bernhard---H))
- Pieter-Jan Vandenbussche ([@PieterJanVdb](https://github.com/PieterJanVdb))
- Dan Gebhardt ([@dgeb](https://github.com/dgeb))

## v0.16.0-beta.1 (2019-02-10)

#### :boom: Breaking Change

- `@orbit/data`, `@orbit/indexeddb`, `@orbit/jsonapi`, `@orbit/local-storage`, `@orbit/record-cache`, `@orbit/store`
  - [#574](https://github.com/orbitjs/orbit/pull/574) Deprecate replaceRecord op in favor of updateRecord ([@dgeb](https://github.com/dgeb))
- `@orbit/coordinator`, `@orbit/core`, `@orbit/data`, `@orbit/indexeddb-bucket`, `@orbit/indexeddb`, `@orbit/jsonapi`, `@orbit/local-storage-bucket`, `@orbit/local-storage`, `@orbit/record-cache`, `@orbit/store`, `@orbit/utils`
  - [#573](https://github.com/orbitjs/orbit/pull/573) [BREAKING] Expose assert + deprecate only on OrbitGlobal ([@dgeb](https://github.com/dgeb))
- `@orbit/coordinator`, `@orbit/core`, `@orbit/data`, `@orbit/record-cache`, `@orbit/store`
  - [#567](https://github.com/orbitjs/orbit/pull/567) Define Listener interface and remove support for explicit binding object in listeners ([@dgeb](https://github.com/dgeb))

#### :rocket: Enhancement

- `@orbit/data`, `@orbit/jsonapi`
  - [#591](https://github.com/orbitjs/orbit/pull/591) [jsonapi] Use new serializers for serializing / deserializing attribute values ([@dgeb](https://github.com/dgeb))
  - [#587](https://github.com/orbitjs/orbit/pull/587) Expand areas in which meta data is allowed ([@dgeb](https://github.com/dgeb))
  - [#586](https://github.com/orbitjs/orbit/pull/586) Define Link interface and links objects (refactor of #509) ([@dgeb](https://github.com/dgeb))
- `@orbit/jsonapi`, `@orbit/serializers`
  - [#590](https://github.com/orbitjs/orbit/pull/590) JSONAPISerializer implements new Serializer interface ([@dgeb](https://github.com/dgeb))
- `@orbit/serializers`
  - [#589](https://github.com/orbitjs/orbit/pull/589) Introduce @orbit/serializers ([@dgeb](https://github.com/dgeb))
- `@orbit/store`
  - [#585](https://github.com/orbitjs/orbit/pull/585) [store] Support query hints ([@dgeb](https://github.com/dgeb))
- `@orbit/data`, `@orbit/indexeddb`, `@orbit/local-storage`, `@orbit/record-cache`, `@orbit/store`
  - [#584](https://github.com/orbitjs/orbit/pull/584) Support finding records by an array of identities ([@dgeb](https://github.com/dgeb))
  - [#555](https://github.com/orbitjs/orbit/pull/555) Extract new @orbit/record-cache package ([@dgeb](https://github.com/dgeb))
- `@orbit/coordinator`, `@orbit/data`
  - [#581](https://github.com/orbitjs/orbit/pull/581) Introduce "hints" for requests ([@dgeb](https://github.com/dgeb))
- `@orbit/jsonapi`
  - [#572](https://github.com/orbitjs/orbit/pull/572) [jsonapi] allowedContentTypes can be customized ([@dgeb](https://github.com/dgeb))
  - [#571](https://github.com/orbitjs/orbit/pull/571) [jsonapi] Consider application/json to be valid content ([@dgeb](https://github.com/dgeb))
- `@orbit/immutable`
  - [#550](https://github.com/orbitjs/orbit/pull/550) Expand capabilities of ImmutableMap ([@dgeb](https://github.com/dgeb))

#### :bug: Bug Fix

- `@orbit/core`, `@orbit/local-storage`, `@orbit/store`
  - [#592](https://github.com/orbitjs/orbit/pull/592) Fix some minor typing issues ([@dgeb](https://github.com/dgeb))
- `@orbit/jsonapi`
  - [#588](https://github.com/orbitjs/orbit/pull/588) Always treat a 204 response as having no content ([@simonihmig](https://github.com/simonihmig))
  - [#562](https://github.com/orbitjs/orbit/pull/562) Let ResourceIdentity be null, Closes [#561](https://github.com/orbitjs/orbit/issues/561) ([@lolmaus](https://github.com/lolmaus))
- `@orbit/data`
  - [#578](https://github.com/orbitjs/orbit/pull/578) Coalesce addToRelatedRecords + removeRecord ([@jembezmamy](https://github.com/jembezmamy))
  - [#568](https://github.com/orbitjs/orbit/pull/568) Fix typings for QueryBuilderFunc and TransformBuilderFunc ([@dgeb](https://github.com/dgeb))
  - [#563](https://github.com/orbitjs/orbit/pull/563) Closes [#472](https://github.com/orbitjs/orbit/issues/472) ([@Raiondesu](https://github.com/Raiondesu))
- `@orbit/coordinator`, `@orbit/core`, `@orbit/data`, `@orbit/immutable`, `@orbit/indexeddb-bucket`, `@orbit/indexeddb`, `@orbit/jsonapi`, `@orbit/local-storage-bucket`, `@orbit/local-storage`, `@orbit/record-cache`, `@orbit/store`, `@orbit/utils`
  - [#566](https://github.com/orbitjs/orbit/pull/566) Fix typings ([@dgeb](https://github.com/dgeb))

#### :memo: Documentation

- [#593](https://github.com/orbitjs/orbit/pull/593) Clarify Orbit’s purpose and primary use cases ([@dgeb](https://github.com/dgeb))

#### :house: Internal

- `@orbit/data`, `@orbit/store`
  - [#582](https://github.com/orbitjs/orbit/pull/582) Remove unused exception classes + other minor cleanup ([@dgeb](https://github.com/dgeb))
- `@orbit/coordinator`, `@orbit/core`, `@orbit/data`, `@orbit/immutable`, `@orbit/indexeddb-bucket`, `@orbit/indexeddb`, `@orbit/jsonapi`, `@orbit/local-storage-bucket`, `@orbit/local-storage`, `@orbit/record-cache`, `@orbit/store`, `@orbit/utils`
  - [#579](https://github.com/orbitjs/orbit/pull/579) Use prepare npm task instead of deprecated prepublish ([@dgeb](https://github.com/dgeb))
  - [#570](https://github.com/orbitjs/orbit/pull/570) Fix security alerts ([@dgeb](https://github.com/dgeb))
  - [#569](https://github.com/orbitjs/orbit/pull/569) Further typing improvements + test refactor ([@dgeb](https://github.com/dgeb))
- Other
  - [#576](https://github.com/orbitjs/orbit/pull/576) Bump build dependencies ([@dgeb](https://github.com/dgeb))

#### Committers: 5

- Alexey ([@Raiondesu](https://github.com/Raiondesu))
- Andrey Mikhaylov (lolmaus) ([@lolmaus](https://github.com/lolmaus))
- Dan Gebhardt ([@dgeb](https://github.com/dgeb))
- Paweł Bator ([@jembezmamy](https://github.com/jembezmamy))
- Simon Ihmig ([@simonihmig](https://github.com/simonihmig))
