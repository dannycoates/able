able A/B testing service
========================

# API Endpoints

Authorization is done with an oauth token from the [FxA Oauth Server](https://github.com/mozilla/fxa-oauth-server)

## POST /v1/{ app }/variables

Returns an object mapping configuration variables to values based on currently
running experiments. Only variables affected by experiments are returned therefore
the result may be an empty object.

___Parameters___

* subject - (optional) an object with subject attributes used by experiments
* enrolled - (optional) an array of experiment names that this subject is enrolled in

Authorization is optional. When used the service stores which experiments the user
is enrolled in, so the `enrolled` parameter is not required.

The `user` id from the oauth token is made available to experiments automatically
if the request is authenticated, so it does not need to be set in the `subject`

### Request

```sh
curl -v \
-X POST \
-H "Content-Type: application/json" \
-H "Authorization: Bearer 558f9980ad5a9c279beb52123653967342f702e84d3ab34c7f80427a6a37e2c0" \
"https://ab.accounts.firefox.com/v1/fxa_content_server/variables" \
-d '
{
  "subject": {
    "postId": 123
  },
  "enrolled": ["test1"]
}
'
```

### Response

A json object with zero or more keys

```json
{
  "highlyExperimentalFeatureEnabled": true,
  "fontSize": 12
}
```

## POST /v1/{ app }/variables/{ variable }

Same as `/v1/{ app }/variables` but only returns the `variable` specified.

### Request

```sh
curl -v \
-X POST \
-H "Content-Type: application/json" \
-H "Authorization: Bearer 558f9980ad5a9c279beb52123653967342f702e84d3ab34c7f80427a6a37e2c0" \
"https://ab.accounts.firefox.com/v1/foo/variables/colorScheme" \
-d '
{
  "subject": {
    "postId": 123
  },
  "enrolled": ["test1"]
}
'
```

### Response

A json object with zero or more keys

```json
{
  "colorScheme": "spacegray"
}
```

## GET /v1/{ app }/attributes

Get all the subject attributes used by the current set of experiments

### Request

```sh
curl -v "https://ab.accounts.firefox.com/v1/foo/attributes"
```

### Response

An array of subject attribute names

```json
["uid","sessionId"]
```
