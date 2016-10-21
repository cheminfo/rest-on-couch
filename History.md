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



