#!/usr/bin/env bash

COUCHDB_HOST=${COUCHDB_HOST:-localhost}
COUCHDB_PORT=${COUCHDB_PORT:-5984}

# CouchDB takes some time to start. We have to wait before setting it up.
while [ $(curl --write-out %{http_code} --silent --output /dev/null http://${COUCHDB_HOST}:${COUCHDB_PORT}/_users) == "000" ]; do
    echo "CouchDB is starting up..."
    sleep 5
done

curl -X POST -H "Content-Type: application/json" http://admin:admin@${COUCHDB_HOST}:${COUCHDB_PORT}/_cluster_setup -d '{"action": "finish_cluster"}'

curl -X PUT "http://admin:admin@${COUCHDB_HOST}:${COUCHDB_PORT}/_users/org.couchdb.user:a@a.com" -H "Content-Type: application/json" -d '{"password": "123", "type": "user", "name": "a@a.com", "roles":[]}'
curl -X PUT "http://admin:admin@${COUCHDB_HOST}:${COUCHDB_PORT}/_users/org.couchdb.user:b@b.com" -H "Content-Type: application/json" -d '{"password": "123", "type": "user", "name": "b@b.com", "roles":[]}'
curl -X PUT "http://admin:admin@${COUCHDB_HOST}:${COUCHDB_PORT}/_users/org.couchdb.user:admin@a.com" -H "Content-Type: application/json" -d '{"password": "123", "type": "user", "name": "admin@a.com", "roles":[]}'
curl -X PUT "http://admin:admin@${COUCHDB_HOST}:${COUCHDB_PORT}/_users/org.couchdb.user:rest-on-couch" -H "Content-Type: application/json" -d '{"password": "roc-123", "type": "user", "name": "rest-on-couch", "roles":[]}'

curl -X PUT "http://admin:admin@${COUCHDB_HOST}:${COUCHDB_PORT}/test"
# curl -X PUT "http://admin:admin@${COUCHDB_HOST}:${COUCHDB_PORT}/test/_security" \
#           -H 'Content-Type: application/json' \
#           -d '{ "admins": { "names": ["rest-on-couch"], "roles": [] }, "members": { "names": ["rest-on-couch"], "roles": [] } }'