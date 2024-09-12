# Data model

## Account

The account model is composed of the following properties

```jsonc
[
  {
    "apiKey": "",
    "name": "John Doe",
    "createdDate": "2021-09-01T00:00:00Z",
    "updatedDate": "2021-09-01T00:00:00Z"
  }
]
```

## Identifier

The identifier model is composed of the following properties

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

## URI model

The URI model is composed from the entry identity resolver data and the linkset is constructed from the entry data.

```jsonc
// /gs1/01/9781234567890.json
{
  "unixtime": 1715668718,
  "/10/ABC123": {
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
    ],
    "linkset": {
      "anchor": "http://localhost/01/09359502000041/10/ABC123/254/123456789",
      "itemDescription": "Aggregation Event",
      "unixtime": 1715668718,
      "https://dlr.com/voc/defaultLink": [
        {
          "href": "http://example.com",
          "title": "DPP"
        }
      ],
      "https://dlr.com/voc/certificationInfo": [
        {
          "href": "http://example.com",
          "title": "DPP",
          "type": "text/html",
          "hreflang": ["en"]
        }
      ]
    },
    "linkHeaderText": "<http://localhost:3000/verify>; rel=\"dlr:certificationInfo\"; type=\"text/html\"; hreflang=\"en\"; title=\"DPP\", <https://dlr.com/01/9781234567890/10/ABC123>; rel=\"owl:sameAs\""
  }
}
```
