# Changelog

### [9.0.1](https://www.github.com/cheminfo/rest-on-couch/compare/v9.0.0...v9.0.1) (2021-09-23)


### Bug Fixes

* allow tokens to create and delete entries ([9e24609](https://www.github.com/cheminfo/rest-on-couch/commit/9e24609226090665deaa04175d52ae49fec20159))

## [9.0.0](https://www.github.com/cheminfo/rest-on-couch/compare/v8.5.2...v9.0.0) (2021-09-06)


### ⚠ BREAKING CHANGES

* remove support for Node.js 10 and add support for Node.js 16

### Features

* add file directory to import logs ([#283](https://www.github.com/cheminfo/rest-on-couch/issues/283)) ([4eefe01](https://www.github.com/cheminfo/rest-on-couch/commit/4eefe01509a1c065d5518044aa4083f41449384c))
* remove support for Node.js 10 and add support for Node.js 16 ([6baf2ab](https://www.github.com/cheminfo/rest-on-couch/commit/6baf2ab5187370b7e7ff04ba3846e72a8446ec6a))

### [8.5.2](https://www.github.com/cheminfo/rest-on-couch/compare/v8.5.1...v8.5.2) (2021-06-23)


### Bug Fixes

* **publish:** do not reference env context in the wrong place ([#276](https://www.github.com/cheminfo/rest-on-couch/issues/276)) ([85a2e7a](https://www.github.com/cheminfo/rest-on-couch/commit/85a2e7a10eca63e98d931bf6e292312db6e05227))

### [8.5.1](https://www.github.com/cheminfo/rest-on-couch/compare/v8.5.0...v8.5.1) (2021-06-23)


### Bug Fixes

* update koa dependencies ([#274](https://www.github.com/cheminfo/rest-on-couch/issues/274)) ([0aa541a](https://www.github.com/cheminfo/rest-on-couch/commit/0aa541a90cb343856ab10a985bdb5378c09fa9cd))

## [8.5.0](https://www.github.com/cheminfo/rest-on-couch/compare/v8.4.1...v8.5.0) (2021-06-23)


### Features

* introduce Docker image on ghcr.io ([#271](https://www.github.com/cheminfo/rest-on-couch/issues/271)) ([35576b7](https://www.github.com/cheminfo/rest-on-couch/commit/35576b729ad394d1107fe631c1687ee242516425))

### [8.4.1](https://www.github.com/cheminfo/rest-on-couch/compare/v8.4.0...v8.4.1) (2021-05-07)


### Bug Fixes

* emit the right value in importsByDate view ([ec70c0e](https://www.github.com/cheminfo/rest-on-couch/commit/ec70c0efac7482e3f634563d7c6415dd317ae7e6))

## [8.4.0](https://www.github.com/cheminfo/rest-on-couch/compare/v8.3.3...v8.4.0) (2021-03-09)


### Features

* adding api endpoint for ROC version ([#259](https://www.github.com/cheminfo/rest-on-couch/issues/259)) ([e8c5ec0](https://www.github.com/cheminfo/rest-on-couch/commit/e8c5ec011590ae41b735213d1328232a7d3765e8))

### [8.3.3](https://www.github.com/cheminfo/rest-on-couch/compare/v8.3.2...v8.3.3) (2021-03-05)


### Bug Fixes

* pass token and merge options for the updateEntry route ([#257](https://www.github.com/cheminfo/rest-on-couch/issues/257)) ([76bbe6e](https://www.github.com/cheminfo/rest-on-couch/commit/76bbe6e4c1b56b0edd980692ec00bdcb5453de6a))

### [8.3.2](https://www.github.com/cheminfo/rest-on-couch/compare/v8.3.1...v8.3.2) (2021-03-03)


### Bug Fixes

* token authentication for API requests dealing with attachments  ([#255](https://www.github.com/cheminfo/rest-on-couch/issues/255)) ([7571bea](https://www.github.com/cheminfo/rest-on-couch/commit/7571bea2a18594bab7b5982b8f2697f64eed7e36))

### [8.3.1](https://www.github.com/cheminfo/rest-on-couch/compare/v8.3.0...v8.3.1) (2021-02-25)


### Bug Fixes

* correctly use new commander API ([#252](https://www.github.com/cheminfo/rest-on-couch/issues/252)) ([836ac4b](https://www.github.com/cheminfo/rest-on-couch/commit/836ac4bc9fb0161d3c327d67b52b78ff46598dad))

## [8.3.0](https://www.github.com/cheminfo/rest-on-couch/compare/v8.2.0...v8.3.0) (2021-02-25)


### Features

* add addAttachment to globalRightsTypes ([#250](https://www.github.com/cheminfo/rest-on-couch/issues/250)) ([2089fb1](https://www.github.com/cheminfo/rest-on-couch/commit/2089fb190a9ab221eee17be7c59f763ee197bfb8))
* **api:** allow to set rights for entry token ([#248](https://www.github.com/cheminfo/rest-on-couch/issues/248)) ([1be1640](https://www.github.com/cheminfo/rest-on-couch/commit/1be1640b7f018cab3fe7895f79e5ca283f2738ff))
* change node to version 14 ([#246](https://www.github.com/cheminfo/rest-on-couch/issues/246)) ([ccf8696](https://www.github.com/cheminfo/rest-on-couch/commit/ccf869617aba098fa1d2c4c82c3683d8a5a39154))


### Bug Fixes

* update dependencies ([#242](https://www.github.com/cheminfo/rest-on-couch/issues/242)) ([cbb5168](https://www.github.com/cheminfo/rest-on-couch/commit/cbb5168ade97b97e5f44a7c9f8ef0726b85e676e))

## [8.2.0](https://github.com/cheminfo/rest-on-couch/compare/v8.1.0...v8.2.0) (2020-12-01)


### Features

* add support for ORCID id of creator in Zenodo submission ([#238](https://github.com/cheminfo/rest-on-couch/issues/238)) ([eea3faa](https://github.com/cheminfo/rest-on-couch/commit/eea3faaa51cd4ffd4123c6cb2785cc50e7cecfe6))


### Bug Fixes

* allow to configure SameSite session cookie option ([#234](https://github.com/cheminfo/rest-on-couch/issues/234)) ([a51fc7b](https://github.com/cheminfo/rest-on-couch/commit/a51fc7baca8ca1ff7c558a11947a103934e1daee))
* convert "true" and "false" env values to booleans ([#239](https://github.com/cheminfo/rest-on-couch/issues/239)) ([cae3bf9](https://github.com/cheminfo/rest-on-couch/commit/cae3bf92cef054820f3b7065ee3953f03cfd1fb4))
* throttle Zenodo attachment uploads ([#237](https://github.com/cheminfo/rest-on-couch/issues/237)) ([62d6f12](https://github.com/cheminfo/rest-on-couch/commit/62d6f12a78e489d2d334d8f2fe8b47f8ef5258d8))

# [8.1.0](https://github.com/cheminfo/rest-on-couch/compare/v8.0.0...v8.1.0) (2020-08-07)


### Bug Fixes

* ensure db connection is open before logging import ([c0ae445](https://github.com/cheminfo/rest-on-couch/commit/c0ae44549292b99f29aaf2e883f37dedf033018d))


### Features

* add getGroupsInfo route ([#218](https://github.com/cheminfo/rest-on-couch/issues/218)) ([2b86ee0](https://github.com/cheminfo/rest-on-couch/commit/2b86ee02d30c99f37c6bda816b0914a3faa6f78d))



# [8.0.0](https://github.com/cheminfo/rest-on-couch/compare/v7.1.1...v8.0.0) (2020-02-13)


### Bug Fixes

* **api:** do not pass undefined value to search params ([fbd43bc](https://github.com/cheminfo/rest-on-couch/commit/fbd43bc72b20eb16e8e7c8a5843ba7c9c17b4b5a))


### chore

* update dependencies and remove support for Node.js 8 ([5e417a4](https://github.com/cheminfo/rest-on-couch/commit/5e417a4f43789eb38e580c9d24934fa9568f739d))


### Features

* store import logs and add API to access them ([89edc1d](https://github.com/cheminfo/rest-on-couch/commit/89edc1dd37feef875acf17100a9308e4edd39e5e))


### BREAKING CHANGES

* Node.js 8 is no longer supported.



## [7.1.1](https://github.com/cheminfo/rest-on-couch/compare/v7.1.0...v7.1.1) (2019-07-04)



# [7.1.0](https://github.com/cheminfo/rest-on-couch/compare/v7.0.0...v7.1.0) (2019-02-21)


### Bug Fixes

* add owner right to list of allowed rights ([3311865](https://github.com/cheminfo/rest-on-couch/commit/3311865))
* make multipart upload work and use it for saving attachments in import ([#194](https://github.com/cheminfo/rest-on-couch/issues/194)) ([2b4ba5e](https://github.com/cheminfo/rest-on-couch/commit/2b4ba5e))
* remove agentkeepalive ([96bd7ab](https://github.com/cheminfo/rest-on-couch/commit/96bd7ab))
* support user token in view queries ([eb72961](https://github.com/cheminfo/rest-on-couch/commit/eb72961))
* **nanoShim:** encode attachment name in CouchDB query ([#202](https://github.com/cheminfo/rest-on-couch/issues/202)) ([066c668](https://github.com/cheminfo/rest-on-couch/commit/066c668))



# [7.0.0](https://github.com/cheminfo/rest-on-couch/compare/v6.0.0...v7.0.0) (2018-11-25)


### Bug Fixes

* allow a longer socket timeout for CouchDB requests ([#184](https://github.com/cheminfo/rest-on-couch/issues/184)) ([33f0d42](https://github.com/cheminfo/rest-on-couch/commit/33f0d42))
* don't restart dev roc server when ui files are updated ([d90c40c](https://github.com/cheminfo/rest-on-couch/commit/d90c40c))
* **api:** only return configured databases in _all_dbs ([d4c42ec](https://github.com/cheminfo/rest-on-couch/commit/d4c42ec))
* **dev:** use webpack in development mode ([c706f01](https://github.com/cheminfo/rest-on-couch/commit/c706f01))
* **front:** enhance UX when no db is selected or user is logged out ([560e072](https://github.com/cheminfo/rest-on-couch/commit/560e072))
* **front:** refetch view data if we go from offline to online ([cf80f1c](https://github.com/cheminfo/rest-on-couch/commit/cf80f1c))
* **front:** show an error if db is not responding ([8c796f8](https://github.com/cheminfo/rest-on-couch/commit/8c796f8))
* **front:** simplify home page ([b3ee1ae](https://github.com/cheminfo/rest-on-couch/commit/b3ee1ae))
* **test:** anonymous can never create entries ([a7a1e89](https://github.com/cheminfo/rest-on-couch/commit/a7a1e89))
* **ui:** remove unnecessary index fallback ([#182](https://github.com/cheminfo/rest-on-couch/issues/182)) ([b7f4d3d](https://github.com/cheminfo/rest-on-couch/commit/b7f4d3d))
* correctly pass arguments to debug calls ([5146812](https://github.com/cheminfo/rest-on-couch/commit/5146812))


### Features

* add audit actions feature and audit login attempts ([6d1406c](https://github.com/cheminfo/rest-on-couch/commit/6d1406c))
* add audit design doc ([2d17b31](https://github.com/cheminfo/rest-on-couch/commit/2d17b31))
* add Dockerfile to this project ([#173](https://github.com/cheminfo/rest-on-couch/issues/173)) ([cb4b560](https://github.com/cheminfo/rest-on-couch/commit/cb4b560))
* remove autoCreateDatabase option ([0f939c0](https://github.com/cheminfo/rest-on-couch/commit/0f939c0))


### BREAKING CHANGES

* The `autoCreateDatabase` option has been removed.



<a name="6.0.0"></a>
# [6.0.0](https://github.com/cheminfo/rest-on-couch/compare/v5.8.0...v6.0.0) (2018-10-18)


### Bug Fixes

* **import:** validate that attachment contents is a Buffer ([#159](https://github.com/cheminfo/rest-on-couch/issues/159)) ([f7b2ce2](https://github.com/cheminfo/rest-on-couch/commit/f7b2ce2))


### Chores

* remove support for legacy import scripts ([#163](https://github.com/cheminfo/rest-on-couch/issues/163)) ([59daad7](https://github.com/cheminfo/rest-on-couch/commit/59daad7))


### Code Refactoring

* **import bin:** remove --watch option ([#164](https://github.com/cheminfo/rest-on-couch/issues/164)) ([45bca64](https://github.com/cheminfo/rest-on-couch/commit/45bca64))


### Features

* export import function in public module ([#157](https://github.com/cheminfo/rest-on-couch/issues/157)) ([dff20f8](https://github.com/cheminfo/rest-on-couch/commit/dff20f8))
* return import result from dry run ([#156](https://github.com/cheminfo/rest-on-couch/issues/156)) ([02b8f18](https://github.com/cheminfo/rest-on-couch/commit/02b8f18))


### BREAKING CHANGES

* **import bin:** rest-on-couch-import --watch has been removed.
Use --continuous instead.
* Support for legacy import scripts has been removed.
Please use the documented single-function import.
* **import:** Import's `addAttachment` must now provide the contents as a Buffer or TypedArray. Previously, base64 strings were accepted, though undocumented.



<a name="5.8.0"></a>
# [5.8.0](https://github.com/cheminfo/rest-on-couch/compare/v5.7.0...v5.8.0) (2018-08-30)


### Bug Fixes

* **import:** do not move skipped files ([5c1cb4d](https://github.com/cheminfo/rest-on-couch/commit/5c1cb4d))
* **import:** merge $content when no file is added ([0b40600](https://github.com/cheminfo/rest-on-couch/commit/0b40600))


### Features

* **import:** allow to setup fileSizeChangeDelay ([de8e6fa](https://github.com/cheminfo/rest-on-couch/commit/de8e6fa)), closes [#129](https://github.com/cheminfo/rest-on-couch/issues/129)
* add HEAD for entry to the API ([#150](https://github.com/cheminfo/rest-on-couch/issues/150)) ([a5eadac](https://github.com/cheminfo/rest-on-couch/commit/a5eadac))
* allow to set filename for main import attachment ([b7dc462](https://github.com/cheminfo/rest-on-couch/commit/b7dc462))



<a name="5.7.0"></a>
# [5.7.0](https://github.com/cheminfo/rest-on-couch/compare/v5.6.1...v5.7.0) (2018-08-13)


### Features

* **config:** custom views can be put in a special views folder in multiple files ([3e08f77](https://github.com/cheminfo/rest-on-couch/commit/3e08f77))



<a name="5.6.1"></a>
## [5.6.1](https://github.com/cheminfo/rest-on-couch/compare/v5.6.0...v5.6.1) (2018-05-25)


### Bug Fixes

* **auth:** do not set status to 200 after authentication error ([#119](https://github.com/cheminfo/rest-on-couch/issues/119)) ([ac3e3a5](https://github.com/cheminfo/rest-on-couch/commit/ac3e3a5))



<a name="5.6.0"></a>
# [5.6.0](https://github.com/cheminfo/rest-on-couch/compare/v5.5.1...v5.6.0) (2018-05-08)


### Bug Fixes

* allow Zenodo readme to be set from the Zenodo entry ([#109](https://github.com/cheminfo/rest-on-couch/issues/109)) ([a428ba9](https://github.com/cheminfo/rest-on-couch/commit/a428ba9))
* publish entry it try block ([#110](https://github.com/cheminfo/rest-on-couch/issues/110)) ([6b018f0](https://github.com/cheminfo/rest-on-couch/commit/6b018f0))


### Features

* finish zenodo implementation ([#114](https://github.com/cheminfo/rest-on-couch/issues/114)) ([011fb32](https://github.com/cheminfo/rest-on-couch/commit/011fb32))
* implement API route to publish data to Zenodo ([#107](https://github.com/cheminfo/rest-on-couch/issues/107)) ([19fc2f6](https://github.com/cheminfo/rest-on-couch/commit/19fc2f6))



<a name="5.5.1"></a>
## [5.5.1](https://github.com/cheminfo/rest-on-couch/compare/v5.5.0...v5.5.1) (2018-03-19)


### Bug Fixes

* get default groups in getUserGroups ([917e98b](https://github.com/cheminfo/rest-on-couch/commit/917e98b))
* nanoPromise getDatabase with couchdb 2 when database does not exist ([dbe674b](https://github.com/cheminfo/rest-on-couch/commit/dbe674b))


<a name="5.5.0"></a>
# [5.5.0](https://github.com/cheminfo/rest-on-couch/compare/v5.4.0...v5.5.0) (2018-03-02)


### Bug Fixes

* users could not be removed in a normal group ([ae1be3e](https://github.com/cheminfo/rest-on-couch/commit/ae1be3e))


### Features

* **api:** allow to specify rights for user token ([#81](https://github.com/cheminfo/rest-on-couch/issues/81)) ([2383c09](https://github.com/cheminfo/rest-on-couch/commit/2383c09))
* replace hard delete by soft delete ([1033951](https://github.com/cheminfo/rest-on-couch/commit/1033951))



<a name="5.4.0"></a>
# [5.4.0](https://github.com/cheminfo/rest-on-couch/compare/v5.3.1...v5.4.0) (2017-10-31)


### Bug Fixes

* always log error when automatic LDAP sync fails ([4ada695](https://github.com/cheminfo/rest-on-couch/commit/4ada695))
* Ephemere component ([45af857](https://github.com/cheminfo/rest-on-couch/commit/45af857))


### Features

* **file-drop:** add route for file upload that uses query string parameters ([31bb160](https://github.com/cheminfo/rest-on-couch/commit/31bb160))



<a name="5.3.1"></a>
## [5.3.1](https://github.com/cheminfo/rest-on-couch/compare/v5.3.0...v5.3.1) (2017-09-08)


### Bug Fixes

* fix ldap sync with binding ([00747c8](https://github.com/cheminfo/rest-on-couch/commit/00747c8))
* getGlobalRights should include admin rights if user is superAdmin ([519a991](https://github.com/cheminfo/rest-on-couch/commit/519a991))
* **ui:** global right edition set react key for each global right ([f5617c2](https://github.com/cheminfo/rest-on-couch/commit/f5617c2))
* **ui:** show refresh button only if ldap group ([662bf7e](https://github.com/cheminfo/rest-on-couch/commit/662bf7e))


### Features

* **ui:** better error feedback when updating group fields ([585a39c](https://github.com/cheminfo/rest-on-couch/commit/585a39c))



<a name="5.3.0"></a>
# [5.3.0](https://github.com/cheminfo/rest-on-couch/compare/v5.2.0...v5.3.0) (2017-09-08)


* change how errors are returned by rest-api ([b2f9ea8](https://github.com/cheminfo/rest-on-couch/commit/b2f9ea8))


### Bug Fixes

* **debug:** fix output when passing Error instance ([86f8d17](https://github.com/cheminfo/rest-on-couch/commit/86f8d17))
* **test:** adapt test to api now returning json on error ([765fe17](https://github.com/cheminfo/rest-on-couch/commit/765fe17))
* **ui:** make GroupEditor a pure component ([f63e253](https://github.com/cheminfo/rest-on-couch/commit/f63e253))


### Features

* couch api and rest api to sync individual ldap group ([133ab2a](https://github.com/cheminfo/rest-on-couch/commit/133ab2a))
* EditableText field handle escape key press ([1f39786](https://github.com/cheminfo/rest-on-couch/commit/1f39786))
* **client:** add ldap group synchro ([6e0494e](https://github.com/cheminfo/rest-on-couch/commit/6e0494e))
* **client:** EditableTextField auto focus and cancel on blur ([6a61f0d](https://github.com/cheminfo/rest-on-couch/commit/6a61f0d))
* **client:** group editor success and error alerts ([a3e00b4](https://github.com/cheminfo/rest-on-couch/commit/a3e00b4))
* **client:** ldap group type ([3d0ae33](https://github.com/cheminfo/rest-on-couch/commit/3d0ae33))
* **debug:** allow multiple arguments to be passed ([d798ca4](https://github.com/cheminfo/rest-on-couch/commit/d798ca4))
* **debug:** always print stack trace of an Error ([e671447](https://github.com/cheminfo/rest-on-couch/commit/e671447))
* **groups:** ldap sync ([ee3cb04](https://github.com/cheminfo/rest-on-couch/commit/ee3cb04))
* **server:** ldap group type ([c5d5fb7](https://github.com/cheminfo/rest-on-couch/commit/c5d5fb7))


### BREAKING CHANGES

* errors are now returned as a json: {"error": "error message"}
errors were previously returned as text



<a name="5.2.0"></a>
# [5.2.0](https://github.com/cheminfo/rest-on-couch/compare/v5.1.1...v5.2.0) (2017-08-30)


### Bug Fixes

* **client:** update group membership component each time it is loaded ([a89b849](https://github.com/cheminfo/rest-on-couch/commit/a89b849))
* **import:** 2 bug fixes in new import ([097c0ac](https://github.com/cheminfo/rest-on-couch/commit/097c0ac)), closes [#76](https://github.com/cheminfo/rest-on-couch/issues/76)
* compare first owner ([a9f6d30](https://github.com/cheminfo/rest-on-couch/commit/a9f6d30))
* do not allow anonymous users to create tokens ([beb5994](https://github.com/cheminfo/rest-on-couch/commit/beb5994))
* use lowercase startkey ([7e728d8](https://github.com/cheminfo/rest-on-couch/commit/7e728d8))


### Features

* add from, owner and includeDocs options to getEntriesByUserAndRights ([59658be](https://github.com/cheminfo/rest-on-couch/commit/59658be))
* add support for user tokens ([#78](https://github.com/cheminfo/rest-on-couch/issues/78)) ([8a04be0](https://github.com/cheminfo/rest-on-couch/commit/8a04be0))



<a name="5.1.1"></a>
## [5.1.1](https://github.com/cheminfo/rest-on-couch/compare/v5.1.0...v5.1.1) (2017-07-28)


### Bug Fixes

* pass full user info to getLDAPUserEmail ([1318f22](https://github.com/cheminfo/rest-on-couch/commit/1318f22))
* **import:** insert entry with appropriate user ([3b1bc5e](https://github.com/cheminfo/rest-on-couch/commit/3b1bc5e))



<a name="5.1.0"></a>
# [5.1.0](https://github.com/cheminfo/rest-on-couch/compare/v5.0.1...v5.1.0) (2017-06-26)



<a name="5.0.1"></a>
## [5.0.1](https://github.com/cheminfo/rest-on-couch/compare/v5.0.0...v5.0.1) (2017-06-22)



<a name="5.0.0"></a>
# [5.0.0](https://github.com/cheminfo/rest-on-couch/compare/v4.2.2...v5.0.0) (2017-06-22)


* put all custom CouchDB views in another design doc by default ([eb17185](https://github.com/cheminfo/rest-on-couch/commit/eb17185))


### BREAKING CHANGES

* * Custom CouchDB views are now put in a design doc called "customApp". This change should only affect scripts that work directly with CouchDB instead of ROC.
* In the administration UI, the URLs are now using a HashRouter instead of a BrowserRouter to avoid any issue with proxies.



<a name="4.2.2"></a>
## [4.2.2](https://github.com/cheminfo/rest-on-couch/compare/v4.2.1...v4.2.2) (2017-06-12)


### Bug Fixes

* do not wrap key in an array for queryEntriesByRight ([ffe6fd8](https://github.com/cheminfo/rest-on-couch/commit/ffe6fd8))



<a name="4.2.1"></a>
## [4.2.1](https://github.com/cheminfo/rest-on-couch/compare/v4.2.0...v4.2.1) (2017-05-30)


### Bug Fixes

* do not use setInterval for auth renewal ([e56c92c](https://github.com/cheminfo/rest-on-couch/commit/e56c92c))



<a name="4.2.0"></a>
# [4.2.0](https://github.com/cheminfo/rest-on-couch/compare/v4.1.0...v4.2.0) (2017-04-27)


### Bug Fixes

* debugrest typo ([7c8ade4](https://github.com/cheminfo/rest-on-couch/commit/7c8ade4))
* default error message should be an empty string ([e05c760](https://github.com/cheminfo/rest-on-couch/commit/e05c760))


### Features

* add group membership page ([847d57c](https://github.com/cheminfo/rest-on-couch/commit/847d57c))
* api to add and remove groups from defaultGroups ([639a707](https://github.com/cheminfo/rest-on-couch/commit/639a707))
* global right administration ([9214c4c](https://github.com/cheminfo/rest-on-couch/commit/9214c4c)), closes [#47](https://github.com/cheminfo/rest-on-couch/issues/47)
* route to get groups a user is member of ([4ce6fda](https://github.com/cheminfo/rest-on-couch/commit/4ce6fda)), closes [#69](https://github.com/cheminfo/rest-on-couch/issues/69)
* set selected database via query parameter ([7641069](https://github.com/cheminfo/rest-on-couch/commit/7641069)), closes [#48](https://github.com/cheminfo/rest-on-couch/issues/48)



<a name="4.1.0"></a>
# [4.1.0](https://github.com/cheminfo/rest-on-couch/compare/v4.0.2...v4.1.0) (2017-03-29)


### Bug Fixes

* **import:** error in update type constants ([fbece32](https://github.com/cheminfo/rest-on-couch/commit/fbece32))


### Features

* **import:** add new importation method ([0813df0](https://github.com/cheminfo/rest-on-couch/commit/0813df0))



<a name="4.0.2"></a>
## [4.0.2](https://github.com/cheminfo/rest-on-couch/compare/v4.0.1...v4.0.2) (2017-03-09)


### Bug Fixes

* more fixes to database config loader ([b203410](https://github.com/cheminfo/rest-on-couch/commit/b203410))



<a name="4.0.1"></a>
## [4.0.1](https://github.com/cheminfo/rest-on-couch/compare/v4.0.0...v4.0.1) (2017-03-01)


### Bug Fixes

* **init:** make sure to update nano and db instances on open ([54060a0](https://github.com/cheminfo/rest-on-couch/commit/54060a0))
* update react-router and fix webpack configuration ([c416082](https://github.com/cheminfo/rest-on-couch/commit/c416082))



<a name="4.0.0"></a>
# [4.0.0](https://github.com/cheminfo/rest-on-couch/compare/v3.5.0...v4.0.0) (2017-03-01)


* upgrade koa to 2.0.1 ([c1ae71b](https://github.com/cheminfo/rest-on-couch/commit/c1ae71b))


### Bug Fixes

* **import:** fix error in shouldIgnore step ([33b2a1c](https://github.com/cheminfo/rest-on-couch/commit/33b2a1c))
* **import:** fix import ([16e7239](https://github.com/cheminfo/rest-on-couch/commit/16e7239))
* **import:** fix import ([5245848](https://github.com/cheminfo/rest-on-couch/commit/5245848))
* terminate process if config loading generates an error ([1b36055](https://github.com/cheminfo/rest-on-couch/commit/1b36055))


### Code Refactoring

* move connection to CouchDB to a global state ([cdc4c60](https://github.com/cheminfo/rest-on-couch/commit/cdc4c60))


### Features

* **import:** add filedir to config callbacks ([ee4704b](https://github.com/cheminfo/rest-on-couch/commit/ee4704b))
* **import:** add noFileMove option ([26ce803](https://github.com/cheminfo/rest-on-couch/commit/26ce803))
* **import:** add shouldIgnore config callback ([ef25e39](https://github.com/cheminfo/rest-on-couch/commit/ef25e39))
* add entryUnicity option ([34ba61e](https://github.com/cheminfo/rest-on-couch/commit/34ba61e))
* add route to change CouchDB password ([e073e64](https://github.com/cheminfo/rest-on-couch/commit/e073e64))
* add sessionKey and sessionPath to server options ([4655fcd](https://github.com/cheminfo/rest-on-couch/commit/4655fcd))


### BREAKING CHANGES

* Before this change, the config would be silently skipped.
Now an Error is thrown and its stack trace printed.
* From now on, only one CouchDB connection per ROC instance will be supported.
It was possible to specify different CouchDB URLs or credentials in each database config but
this was never used.
* From now on, the project will only be compatible with Node.js >= 7.6.0
because of the use of async functions.



<a name="3.5.0"></a>
# [3.5.0](https://github.com/cheminfo/rest-on-couch/compare/v3.4.1...v3.5.0) (2017-01-30)



<a name="3.4.1"></a>
## [3.4.1](https://github.com/cheminfo/rest-on-couch/compare/v3.4.0...v3.4.1) (2017-01-26)


### Bug Fixes

* **import:** allow noUpload with and without jpath or without field ([7fbd4da](https://github.com/cheminfo/rest-on-couch/commit/7fbd4da))



<a name="3.4.0"></a>
# [3.4.0](https://github.com/cheminfo/rest-on-couch/compare/v3.3.0...v3.4.0) (2017-01-25)


### Bug Fixes

* **login:** return a response when couchDB login fails ([39f8b02](https://github.com/cheminfo/rest-on-couch/commit/39f8b02))


### Features

* **bin:** add rest-on-couch-import global script ([ae1ca45](https://github.com/cheminfo/rest-on-couch/commit/ae1ca45))
* **import:** add dryRun option and enable single file import ([6a28969](https://github.com/cheminfo/rest-on-couch/commit/6a28969))



<a name="3.3.0"></a>
# [3.3.0](https://github.com/cheminfo/rest-on-couch/compare/v3.2.0...v3.3.0) (2017-01-17)


### Features

* add custom title for CouchDB login ([6661378](https://github.com/cheminfo/rest-on-couch/commit/6661378))



<a name="3.2.0"></a>
# [3.2.0](https://github.com/cheminfo/rest-on-couch/compare/v3.1.3...v3.2.0) (2016-12-22)


### Features

* add getUserInfo ([b25c1e9](https://github.com/cheminfo/rest-on-couch/commit/b25c1e9))



<a name="3.1.3"></a>
## [3.1.3](https://github.com/cheminfo/rest-on-couch/compare/v3.1.2...v3.1.3) (2016-12-19)



<a name="3.1.2"></a>
## [3.1.2](https://github.com/cheminfo/rest-on-couch/compare/v3.1.1...v3.1.2) (2016-12-15)


### Bug Fixes

* do not use ES6 in design doc ([f7f3a95](https://github.com/cheminfo/rest-on-couch/commit/f7f3a95))
* **security:** give no default right when a database is created ([191c900](https://github.com/cheminfo/rest-on-couch/commit/191c900))



<a name="3.1.1"></a>
## [3.1.1](https://github.com/cheminfo/rest-on-couch/compare/v3.1.0...v3.1.1) (2016-12-09)


### Bug Fixes

* **client:** only first owner cannot be removed ([c3dd5a6](https://github.com/cheminfo/rest-on-couch/commit/c3dd5a6))



<a name="3.1.0"></a>
# [3.1.0](https://github.com/cheminfo/rest-on-couch/compare/v3.0.1...v3.1.0) (2016-12-09)


### Bug Fixes

* allow any email address and allow a dot in group names ([c7a1ed6](https://github.com/cheminfo/rest-on-couch/commit/c7a1ed6))
* don't throw if default group does not exist ([9e3aa62](https://github.com/cheminfo/rest-on-couch/commit/9e3aa62))


### Features

* add API to manage default groups doc ([321e951](https://github.com/cheminfo/rest-on-couch/commit/321e951))
* **client:** add group owners edition ([2021a36](https://github.com/cheminfo/rest-on-couch/commit/2021a36))
* **core:** move administrators to superAdministrators ([de79db2](https://github.com/cheminfo/rest-on-couch/commit/de79db2))
* **server:** add API to manage global rights doc ([badfc64](https://github.com/cheminfo/rest-on-couch/commit/badfc64))



<a name="3.0.1"></a>
## [3.0.1](https://github.com/cheminfo/rest-on-couch/compare/v3.0.0...v3.0.1) (2016-12-07)


### Bug Fixes

* normalize use of the proxy prefix ([f902010](https://github.com/cheminfo/rest-on-couch/commit/f902010))
* **client:** google auth popup URL ([0ce760a](https://github.com/cheminfo/rest-on-couch/commit/0ce760a))
* **server:** fix wrong routing in the presence of bundle.js ([adce947](https://github.com/cheminfo/rest-on-couch/commit/adce947))



<a name="3.0.0"></a>
# [3.0.0](https://github.com/cheminfo/rest-on-couch/compare/v2.1.2...v3.0.0) (2016-12-07)


### Features

* **import:** allow to disable upload of main file and add more attachments ([a130482](https://github.com/cheminfo/rest-on-couch/commit/a130482))
* **import:** allow to do everything in the same callback (fullProcess) ([0199155](https://github.com/cheminfo/rest-on-couch/commit/0199155))


* remove support for Node.js v4 ([7acbddf](https://github.com/cheminfo/rest-on-couch/commit/7acbddf))


### BREAKING CHANGES

* Support for Node.js v4 has been dropped.



<a name="2.1.2"></a>
## [2.1.2](https://github.com/cheminfo/rest-on-couch/compare/v2.1.1...v2.1.2) (2016-11-28)



<a name="2.1.1"></a>
## [2.1.1](https://github.com/cheminfo/rest-on-couch/compare/v2.1.0...v2.1.1) (2016-11-28)


### Bug Fixes

* **import:** correct wrong condition ([fe0fb54](https://github.com/cheminfo/rest-on-couch/commit/fe0fb54))



<a name="2.1.0"></a>
# [2.1.0](https://github.com/cheminfo/rest-on-couch/compare/v2.0.2...v2.1.0) (2016-11-28)


### Features

* **import:** add sort option and improve walking structure when limit is set ([7f28c26](https://github.com/cheminfo/rest-on-couch/commit/7f28c26))



<a name="2.0.2"></a>
## [2.0.2](https://github.com/cheminfo/rest-on-couch/compare/v2.0.1...v2.0.2) (2016-11-22)



<a name="2.0.1"></a>
## [2.0.1](https://github.com/cheminfo/rest-on-couch/compare/v2.0.0...v2.0.1) (2016-11-22)



<a name="2.0.0"></a>
# [2.0.0](https://github.com/cheminfo/rest-on-couch/compare/v1.2.0...v2.0.0) (2016-11-21)


### Bug Fixes

* **core:** use more common interpreter ([653ac29](https://github.com/cheminfo/rest-on-couch/commit/653ac29))
* add array-includes for v4 compatibility ([29e11ab](https://github.com/cheminfo/rest-on-couch/commit/29e11ab))
* **login:** recover existing session ([d52fd87](https://github.com/cheminfo/rest-on-couch/commit/d52fd87))
* **server:** only serve bundle if it exists ([5460303](https://github.com/cheminfo/rest-on-couch/commit/5460303))


### Code Refactoring

* remove addGroupToEntry ([cee70f8](https://github.com/cheminfo/rest-on-couch/commit/cee70f8))
* remove all methods that accept a $id ([a141dec](https://github.com/cheminfo/rest-on-couch/commit/a141dec))
* remove removeGroupFromEntry ([e156587](https://github.com/cheminfo/rest-on-couch/commit/e156587))


### Features

* **api:** add getDocsAsOwner ([ba6fe67](https://github.com/cheminfo/rest-on-couch/commit/ba6fe67))
* **api:** add owner management routes for groups ([6fa2aa8](https://github.com/cheminfo/rest-on-couch/commit/6fa2aa8))
* **api:** add routes to add and remove users from groups ([9fcd324](https://github.com/cheminfo/rest-on-couch/commit/9fcd324))
* **views:** allow reduce ([1c203d4](https://github.com/cheminfo/rest-on-couch/commit/1c203d4))


### BREAKING CHANGES

* it is now replaced by removeOwnersFromDoc
* it is now replaced by addOwnersToDoc
* All methods ending with "ById" are removed but one.
getEntryById remains but only returns something if the user requesting the document is its original owner ($owners[0])



<a name="1.2.0"></a>
# [1.2.0](https://github.com/cheminfo/rest-on-couch/compare/v1.1.0...v1.2.0) (2016-10-21)


### Bug Fixes

* renew the session on each request ([f812862](https://github.com/cheminfo/rest-on-couch/commit/f812862))


### Features

* add hasRightForEntry (couch api + rest api) ([2b1856a](https://github.com/cheminfo/rest-on-couch/commit/2b1856a))



<a name="1.1.0"></a>
# [1.1.0](https://github.com/cheminfo/rest-on-couch/compare/v1.0.0...v1.1.0) (2016-09-28)


### Features

* **design docs:** query a view of the design doc when it changes ([0110a03](https://github.com/cheminfo/rest-on-couch/commit/0110a03))



<a name="1.0.0"></a>
# [1.0.0](https://github.com/cheminfo/rest-on-couch/compare/v0.2.0...v1.0.0) (2016-09-26)


### Bug Fixes

* automatically create structure in addFileToJpath ([f056e4b](https://github.com/cheminfo/rest-on-couch/commit/f056e4b))
* do not let unicode characters in the filename ([b1438a5](https://github.com/cheminfo/rest-on-couch/commit/b1438a5))
* don't update design doc if custom is absent ([21ac98a](https://github.com/cheminfo/rest-on-couch/commit/21ac98a))
* make queryViewByUser more efficient ([d228f44](https://github.com/cheminfo/rest-on-couch/commit/d228f44)), closes [#30](https://github.com/cheminfo/rest-on-couch/issues/30)
* rename default config file ([d0c4b23](https://github.com/cheminfo/rest-on-couch/commit/d0c4b23))
* **custom views:** add lib to all design docs ([b8284a8](https://github.com/cheminfo/rest-on-couch/commit/b8284a8))
* **custom views:** fix case where no custom views are defined ([97e82bf](https://github.com/cheminfo/rest-on-couch/commit/97e82bf))
* **import:** don't treat hidden files ([3e21473](https://github.com/cheminfo/rest-on-couch/commit/3e21473))
* **login:** use relative url for google login in login page ([f0dd746](https://github.com/cheminfo/rest-on-couch/commit/f0dd746))
* **nanoPromise:** cached hasOwnProperty ([7f3d370](https://github.com/cheminfo/rest-on-couch/commit/7f3d370))
* **nanoPromise:** reduce param for views should be false by default ([c0089a8](https://github.com/cheminfo/rest-on-couch/commit/c0089a8))
* **server:** fix response when token is not found ([1e24810](https://github.com/cheminfo/rest-on-couch/commit/1e24810))
* **tests:** use node v4 compatible syntax ([7714438](https://github.com/cheminfo/rest-on-couch/commit/7714438))
* **tests:** use node v4 compatible syntax ([47830f7](https://github.com/cheminfo/rest-on-couch/commit/47830f7))


### Features

* add cli tool to batch add groups ([9385fe5](https://github.com/cheminfo/rest-on-couch/commit/9385fe5))
* add close method to Couch object, rename _init to open ([589f52e](https://github.com/cheminfo/rest-on-couch/commit/589f52e))
* add support for custom libraries in views ([f9a8c86](https://github.com/cheminfo/rest-on-couch/commit/f9a8c86))
* add token methods ([b0678f2](https://github.com/cheminfo/rest-on-couch/commit/b0678f2))
* **server:** allow the use of tokens to get a document ([c1bf0f1](https://github.com/cheminfo/rest-on-couch/commit/c1bf0f1))
* allow addGroup and removeGroup to receive an array of groups ([f9e7915](https://github.com/cheminfo/rest-on-couch/commit/f9e7915))
* **design docs:** split views in several design documents ([c4f822d](https://github.com/cheminfo/rest-on-couch/commit/c4f822d))
* **query:** add "mine" option ([9b861ee](https://github.com/cheminfo/rest-on-couch/commit/9b861ee))
* **query:** filter query results by groups ([5c69bf0](https://github.com/cheminfo/rest-on-couch/commit/5c69bf0))
* allow to extend content from file import ([f54cba6](https://github.com/cheminfo/rest-on-couch/commit/f54cba6))
* load from source if REST_ON_COUCH_ASYNC_AWAIT variable is set ([a9ffad7](https://github.com/cheminfo/rest-on-couch/commit/a9ffad7))
* **rest-api:** add getGroups to rest api ([0dff073](https://github.com/cheminfo/rest-on-couch/commit/0dff073))
* **server:** add token routes ([cefb2d9](https://github.com/cheminfo/rest-on-couch/commit/cefb2d9))



<a name="0.2.0"></a>
# 0.2.0 (2016-01-05)
