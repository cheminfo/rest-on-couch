#!/usr/bin/env sh

COUCHDB_HOST=${COUCHDB_HOST:-localhost}

curl -X PUT http://COUCHDB_HOST:5984/_config/admins/admin -H "Content-Type: application/json" -d '"admin"'
curl -X PUT 'http://admin:admin@COUCHDB_HOST:5984/_users/org.couchdb.user:a@a.com' -H "Content-Type: application/json" -d '{"password": "123", "type": "user", "name": "a@a.com", "roles":[]}'
curl -X PUT 'http://admin:admin@COUCHDB_HOST:5984/_users/org.couchdb.user:b@b.com' -H "Content-Type: application/json" -d '{"password": "123", "type": "user", "name": "b@b.com", "roles":[]}'
curl -X PUT 'http://admin:admin@COUCHDB_HOST:5984/_users/org.couchdb.user:admin@a.com' -H "Content-Type: application/json" -d '{"password": "123", "type": "user", "name": "admin@a.com", "roles":[]}'
