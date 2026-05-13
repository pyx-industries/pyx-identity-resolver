/**
 * Loose `type/subtype` shape check for MIME types. Permits any
 * well-formed media type the resolver might be asked to advertise.
 * Not a full RFC 6838 conformance validator (notably, it accepts
 * `_` in subtypes which RFC 6838 disallows).
 *
 * @see https://www.rfc-editor.org/rfc/rfc6838 RFC 6838 Media Type Specifications
 */
export const MIME_TYPE_REGEX = /^\w+\/[-+.\w]+$/;
