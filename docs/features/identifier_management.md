# Identifier management

The authorized user can register the namespace and application identifiers that are used to register the identity resolver. The combine of the namespace and the primary identifier must be unique. They are used to define the file name of the JSON file.

```jsonc
// The identifier management JSON file
{
  "gs1": {
    "namespace": "gs1",
    "applicationIdentifiers": [
      {
        "title": "Serial Shipping Container Code (SSCC) ",
        "label": "SSCC",
        "shortcode": "sscc",
        "ai": "00",
        "format": "N18",
        "type": "I",
        "regex": "(\\d{18})"
      },
      {
        "title": "Global Trade Item Number (GTIN)",
        "label": "GTIN",
        "shortcode": "gtin",
        "ai": "01",
        "format": "N14",
        "type": "I",
        "qualifiers": ["22", "10", "3101", "13", "21"],
        "regex": "(\\d{12,14}|\\d{8})"
      }
    ]
  },
  "integrity-system": {
    "namespace": "integrity-system",
    "applicationIdentifiers": [
      {
        "title": "NLIS ID",
        "label": "NLISID",
        "shortcode": "nlisid",
        "ai": "01",
        "format": "N14",
        "type": "I",
        "qualifiers": ["22", "10", "3101", "13", "21"],
        "regex": "(\\d{12,14}|\\d{8})"
      }
    ]
  }
}
```

In the example above, the `gs1` and `integrity-system` are the namespace. The `00` and `01` are the primary identifiers of the `gs1` namespace. When the user registers the identity resolver, the namespace will combine with a primary identifier to create an unique URI with ID or file name of the JSON file such as `/gs1/01/9781234567890.json`.

#### Application identifier

The application identifier is composed of the following properties:

- `title`: The title of the application identifier.
- `label`: The label of the application identifier.
- `shortcode`: The shortcode of the application identifier.
- `ai`: The application identifier number and it is unique in the namespace.
- `format`: The format of the application identifier.
- `type`: The type of the application identifier, there are 3 kinds of type:
  - `I`: Identifier
  - `D`: Data attribute
  - `Q`: Qualifier
- `qualifiers`: The list of the qualifiers that are used to identify and resolve the identity resolver.
- `regex`: The regular expression of the application identifier.

### Register identity resolver

The authorized user can register the identity resolver through the API. That data will be constructed and stored to the JSON file with then file name is determined by the namespace and primary identifier. The payload of the identity resolver is as follows:

```jsonc
{
  "namespace": "gs1",
  "identificationKeyType": "gtin",
  "identificationKey": "9781234567890",
  "itemDescription": "DPP",
  "qualifierPath": "/10/ABC123",
  "active": true,
  "responses": [
    {
      "defaultLinkType": true,
      "defaultMimeType": true,
      "fwqs": false,
      "active": true,
      "linkType": "dlr:certificationInfo",
      "linkTitle": "DPP",
      "targetUrl": "http://example.com",
      "mimeType": "text/html"
    }
  ]
}
```

#### Response properties

The response is used to construct the link type of link set that follows the [RFC 9264](https://www.rfc-editor.org/rfc/rfc9264.pdf)

- `defaultLinkType`: The property that indicates the default link type when no link type is specified.
- `defaultMimeType`: The property that indicates the default MIME type when no MIME type is specified.
- `fwqs`: The property that forwards the query string to the target URL.
- `active`: The property that indicates the response is active or not.
- `linkType`: The link type is in the list of link types that are defined.
- `linkTitle`: The title of the link.
- `targetUrl`: The target URL of the link.
- `mimeType`: The MIME type of the link such as `text/html`, `application/json`, etc.

### Resolve identity resolver

When the identity resolvers are registered, the anonymous user can make a query with the namespace, identifiers, mime type, and link type to resolve the identity resolver. For example, the user can query the identity resolver with the following URL:

```cURL
curl -X GET "http://localhost:8080/dlr/gs1/01/9781234567890/10/ABC123?linkType=dlr:certificationInfo" \
  --header "Accept: text/html"
```

The response will be redirected to the target URL (http://example.com)
