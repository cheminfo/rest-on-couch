# HTTP API

## Login / Logout

| Method | Route | Action | Description |
| ------ | ----- | ------ | ----------- |
| GET | `/login/:method` | login | Creates a session.<br>Method can be `couch`, `github`, `google`, ... |
| GET | `/logout` | logout |

## Database

| Method | Route | Action | Description |
| ------ | ----- | ------ | ----------- |
| GET | `/db/:dbname/entries/all` | Get all entries | Returns an array of documents |
| GET | `/db/:dbname/:id` | Get an entry by UUID |
| GET | `/db/:dbname/:id/:attachment` | Get an attachment |
| GET | `/db/:dbname/_view/:view` | Query a custom view | Returns an array of documents |
| PUT | `/db/:dbname/:id` | Update an entry by UUID |
