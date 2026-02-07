/**
 * Encryption methods for UNTP link targets.
 * @see https://untp.unece.org/docs/specification/DecentralisedAccessControl
 */
export enum EncryptionMethod {
  None = 'none',
  AES128 = 'AES-128',
  AES256 = 'AES-256',
}

/**
 * UNTP-defined access roles for variant-based disclosure.
 * Values follow the URI pattern untp:accessRole#RoleName.
 * @see https://untp.unece.org/docs/specification/VariantBasedDisclosure
 */
export enum UntpAccessRole {
  Anonymous = 'untp:accessRole#Anonymous',
  Customer = 'untp:accessRole#Customer',
  Regulator = 'untp:accessRole#Regulator',
  Recycler = 'untp:accessRole#Recycler',
  Auditor = 'untp:accessRole#Auditor',
  Owner = 'untp:accessRole#Owner',
}

// Derive arrays from enums for use in @IsIn() validators and Swagger docs
export const ENCRYPTION_METHODS = Object.values(EncryptionMethod);
export const UNTP_ACCESS_ROLES = Object.values(UntpAccessRole);
