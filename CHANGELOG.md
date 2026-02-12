# Changelog

## [2.0.2](https://github.com/pyx-industries/pyx-identity-resolver/compare/2.0.1...v2.0.2) (2026-02-12)


### Bug Fixes

* **ci:** Remove push condition ([0eebbfb](https://github.com/pyx-industries/pyx-identity-resolver/commit/0eebbfb8534de6ac8b2f0a73d9724a264ad36eec))
* **ci:** Remove push condition ([cd375dc](https://github.com/pyx-industries/pyx-identity-resolver/commit/cd375dc26b59fa368e2cca204b36a59ad07fef17))
* **storage:** Add error logging to MinIO provider and global exception filter ([e493c1e](https://github.com/pyx-industries/pyx-identity-resolver/commit/e493c1e66a1effc1c824681031a54eb750a1198f))


### Documentation

* **migration:** Add data backup warning to v2 migration guide ([d5b6898](https://github.com/pyx-industries/pyx-identity-resolver/commit/d5b689822e56307b67767bc4609190c350cf7258))


### Miscellaneous

* **release:** Bump version to 2.0.2 ([5ef6543](https://github.com/pyx-industries/pyx-identity-resolver/commit/5ef6543a53ac2e3452f8c8526bc4395fc5076596))

## [2.0.1](https://github.com/pyx-industries/pyx-identity-resolver/compare/2.0.0...v2.0.1) (2026-02-09)


### Bug Fixes

* **docs:** Fix docs site to default to v2.0.0 and document linkset metadata staleness for upgraded identifiers ([055ddbe](https://github.com/pyx-industries/pyx-identity-resolver/commit/055ddbe091b11a139751f873f7362f1afa820761)), ([62730a4](https://github.com/pyx-industries/pyx-identity-resolver/commit/62730a4f0ee9edc5291588c72dfa034802461540))

## [2.0.0](https://github.com/pyx-industries/pyx-identity-resolver/compare/1.1.3...v2.0.0) (2026-02-09)


### ⚠ BREAKING CHANGES

* **link-registration:** harden registration service and upsert utilities ([#66](https://github.com/pyx-industries/pyx-identity-resolver/issues/66))

### Features

* **ci:** Enforce conventional commit syntax ([#50](https://github.com/pyx-industries/pyx-identity-resolver/issues/50)) ([5155f89](https://github.com/pyx-industries/pyx-identity-resolver/commit/5155f89d14ce8fb38514208c2c7e7231c2133e7f))
* **link-management:** Add CRUD endpoints for individual links ([#67](https://github.com/pyx-industries/pyx-identity-resolver/issues/67)) ([397c701](https://github.com/pyx-industries/pyx-identity-resolver/commit/397c701484938b0bdf4be0b81eba308117d54447))
* **link-registration:** Add UNTP data model fields and link type constants ([#68](https://github.com/pyx-industries/pyx-identity-resolver/issues/68)) ([172b1bb](https://github.com/pyx-industries/pyx-identity-resolver/commit/172b1bbb519f670530fc8813292f44e7637e56ca))
* **link-registration:** Add UNTP linkset extensions and predecessor-version support ([#69](https://github.com/pyx-industries/pyx-identity-resolver/issues/69)) ([6f97592](https://github.com/pyx-industries/pyx-identity-resolver/commit/6f97592e074afa5c9fa6cf1e14a759f2a0bed1cc))
* **link-registration:** Add versioning, link-index, and default-flags utilities ([#65](https://github.com/pyx-industries/pyx-identity-resolver/issues/65)) ([de8b979](https://github.com/pyx-industries/pyx-identity-resolver/commit/de8b979f3a573fc98ff2b5d38acb325e026d2c9f))
* **link-resolution:** Add query-time Link header construction ([#75](https://github.com/pyx-industries/pyx-identity-resolver/issues/75)) ([49d6000](https://github.com/pyx-industries/pyx-identity-resolver/commit/49d6000fda081730db83cf2db4fb6eed0cfa896b))
* **link-resolution:** Add variant-based disclosure with accessRole filtering ([#71](https://github.com/pyx-industries/pyx-identity-resolver/issues/71)) ([ccc8108](https://github.com/pyx-industries/pyx-identity-resolver/commit/ccc81085316af6407db9bb86da21cae25a72299f))


### Bug Fixes

* **docs:** Sync documentation package version with docVersion ([#51](https://github.com/pyx-industries/pyx-identity-resolver/issues/51)) ([414d0ec](https://github.com/pyx-industries/pyx-identity-resolver/commit/414d0eca4b6291d19debdf2c918cb63cc82ddcc9))
* **link-registration:** Harden registration service and upsert utilities ([#66](https://github.com/pyx-industries/pyx-identity-resolver/issues/66)) ([5dc8ff2](https://github.com/pyx-industries/pyx-identity-resolver/commit/5dc8ff2da09346ac769b4a43ca899ae86b9f7940))


### Tests

* **link-resolution:** Add decryptionKey query parameter tests ([#73](https://github.com/pyx-industries/pyx-identity-resolver/issues/73)) ([2245cc8](https://github.com/pyx-industries/pyx-identity-resolver/commit/2245cc867f450970af89f3bfb6e27e7b66c5c7e8))


### Documentation

* **deployment:** Add migration guide for 1.x to 2.0.0 upgrade ([b377200](https://github.com/pyx-industries/pyx-identity-resolver/commit/b377200da7ae4eabbcae3b28a245306687f98694))
* **migration:** Move migration guide to its own sidebar category ([d202c1e](https://github.com/pyx-industries/pyx-identity-resolver/commit/d202c1efafddb21b4c19d37b0b5150a9074a6c05))
* Rewrite documentation site for current architecture ([#79](https://github.com/pyx-industries/pyx-identity-resolver/issues/79)) ([d4502dd](https://github.com/pyx-industries/pyx-identity-resolver/commit/d4502dd95ff00a7afbdbc2218030778414e44269))


### Miscellaneous

* **ci:** Exclude release commits from changelog ([2d5b7d1](https://github.com/pyx-industries/pyx-identity-resolver/commit/2d5b7d148d4e1a2d3d5d268dbfda20e1cba77ffb))
* **release:** Prepare release 2.0.0 ([2772b15](https://github.com/pyx-industries/pyx-identity-resolver/commit/2772b1531cf8873da2ed10fe670ca353f61a7a51))

## [1.1.3](https://github.com/pyx-industries/pyx-identity-resolver/compare/1.1.2...v1.1.3) (2026-01-29)


### Bug Fixes

* **ci:** Use proper tag suffixes for Docker images ([#46](https://github.com/pyx-industries/pyx-identity-resolver/issues/46)) ([c94c936](https://github.com/pyx-industries/pyx-identity-resolver/commit/c94c9364227d8587f6e3c61591ba0911f0708ebb))


### Miscellaneous

* **release:** Prepare release 1.1.3 ([b7a63aa](https://github.com/pyx-industries/pyx-identity-resolver/commit/b7a63aaf2a8d6c2e665f7159b7768d965240290b))

## [1.1.2](https://github.com/pyx-industries/pyx-identity-resolver/compare/1.1.1...v1.1.2) (2026-01-29)


### Bug Fixes

* **ci:** Add multi-platform builds and version tags for workflow_run ([#43](https://github.com/pyx-industries/pyx-identity-resolver/issues/43)) ([d19e578](https://github.com/pyx-industries/pyx-identity-resolver/commit/d19e578598e391a5d1b569694670996bdd3598ce))


### Miscellaneous

* **release:** Prepare release 1.1.2 ([00d99f5](https://github.com/pyx-industries/pyx-identity-resolver/commit/00d99f5592fe696dc7ccf9eda12c01275c207f2b))

## [1.1.1](https://github.com/pyx-industries/pyx-identity-resolver/compare/1.1.0...v1.1.1) (2026-01-29)


### Bug Fixes

* **ci:** Skip release if tag already exists ([#40](https://github.com/pyx-industries/pyx-identity-resolver/issues/40)) ([8122a98](https://github.com/pyx-industries/pyx-identity-resolver/commit/8122a9823d7c6ac2cb9c505c362252eef9ae9208))
* Update release workflow and documentation ([#39](https://github.com/pyx-industries/pyx-identity-resolver/issues/39)) ([8b22794](https://github.com/pyx-industries/pyx-identity-resolver/commit/8b227941a49c1b47ec1a18c8dfe7714ce9362b4e))


### Miscellaneous

* **release:** Prepare release 1.1.1 ([975bd1b](https://github.com/pyx-industries/pyx-identity-resolver/commit/975bd1b15692d12fa64afa542a773962424426e3))

## [1.1.0](https://github.com/pyx-industries/pyx-identity-resolver/compare/1.0.0...v1.1.0) (2026-01-29)


### Features

* **link-registration:** Validate unique default flags per scope ([#36](https://github.com/pyx-industries/pyx-identity-resolver/issues/36)) ([6152eb1](https://github.com/pyx-industries/pyx-identity-resolver/commit/6152eb10ac924ce575c3ef3a20c5c7d241cc41f5))


### Bug Fixes

* **ci:** Remove redundant release commit from changelog workflow ([eb2ae79](https://github.com/pyx-industries/pyx-identity-resolver/commit/eb2ae7998114f86b3115a8396ae0abd413ec57f3))


### Tests

* Add coverage threshold ([#32](https://github.com/pyx-industries/pyx-identity-resolver/issues/32)) ([83558c9](https://github.com/pyx-industries/pyx-identity-resolver/commit/83558c9574e598c73c46fd270bb7566571851515))


### Miscellaneous

* Release 1.1.0 ([150d925](https://github.com/pyx-industries/pyx-identity-resolver/commit/150d925791acb912b88f07deec53516ab867b93f))
* **release:** Prepare release 1.1.0 ([91ceabd](https://github.com/pyx-industries/pyx-identity-resolver/commit/91ceabdf04f9b281c24a9ec4e0d8fb72df9f5fa7))

## [1.0.0](https://github.com/pyx-industries/pyx-identity-resolver/compare/v1.0.0...v1.0.0) (2025-04-16)


### Features

* Version mapping management ([#9](https://github.com/pyx-industries/pyx-identity-resolver/issues/9)) ([8ea261b](https://github.com/pyx-industries/pyx-identity-resolver/commit/8ea261b6f11800ac950665f0db45936116b6f82b))


### Code Refactoring

* Add more link types in default link types ([3b4ce08](https://github.com/pyx-industries/pyx-identity-resolver/commit/3b4ce08ced47033fc70b5330f6107d2f370df6b8))


### Documentation

* Update documentation site and deployment pipeline ([#18](https://github.com/pyx-industries/pyx-identity-resolver/issues/18)) ([82e8fca](https://github.com/pyx-industries/pyx-identity-resolver/commit/82e8fca4d5e19932dd3366f9552689cb5fd7621b))


### Miscellaneous

* Add licence ([#21](https://github.com/pyx-industries/pyx-identity-resolver/issues/21)) ([ed1b4fd](https://github.com/pyx-industries/pyx-identity-resolver/commit/ed1b4fdbbb8afd048bc5eea0a2d9f5528dc3242f))
* Update package name ([c362ad8](https://github.com/pyx-industries/pyx-identity-resolver/commit/c362ad840bc9b480b40662d7c671324adfd9e856))
* Bump version ([87c20a5](https://github.com/pyx-industries/pyx-identity-resolver/commit/87c20a5e961fbace5fba6c40be91482332dae953))
* Release 1.0.0 ([b020d10](https://github.com/pyx-industries/pyx-identity-resolver/commit/b020d106dd5e730d709a9fc0c1945b7e1a2e89b6))
