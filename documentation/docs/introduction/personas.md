---
sidebar_position: 2
title: Personas
---

import Disclaimer from './../\_disclaimer.mdx';

<Disclaimer />

# Personas

The Pyx Identity Resolver (IDR) serves a diverse range of personas, each interacting with the service to manage, access, or resolve identifier-linked data.

## Registry operator

The registry operator is the entity that created and maintains
a register of identities such as products,
facilities, equipment, or companies.
Some examples:

- The Australian Tax Office (ATO)
  as the registry operator of the Australian Business Register (ABR)
  which manages Australian Business Numbers (ABN).
- GS1 as there registry operator of the global product register
  with manages Global Trade Identification Numbers (GTIN)

## Registered member

A registered member is the owner of one or more identities
maintained in the register.
Some examples:

- GoSource Pty Ltd is a registered member of the ABR
  that owns the ABN entry
  [41161080146](https://abr.business.gov.au/ABN/View?abn=41161080146)
- GoSource Pty Ltd is also the owner of GS1 prefix 9359502
  and owns several product GTIN in the Global register
  including [9359502000010](https://www.gs1.org/services/verified-by-gs1/results?gtin=9359502000010#productInformation)

## Anonymous user

An anonymous user is anyone who has found (or can guess) an identifier
maintained in any register and uses that identifier
to discover further information about the identifier.
For example:

- An anonymous user may discover a barcode on a pack of pasta
  in a supermarket
  [8076802085738](https://www.gs1.org/services/verified-by-gs1/results?gtin=8076802085738#productInformation)
- An anonymous user who knows a GS1 company prefix or any GTIN
  may guess another GTIN by incrementing a few numbers
  [8076802085776](https://www.gs1.org/services/verified-by-gs1/results?gtin=8076802085776#productInformation).

Note that the last digit in GTIN is a checksum
so the two underlying pasta product numbers
(without checksum) are 807680208573 and 807680208577.
The Barilla company prefix is 8076802
(the first 7 digits of the GTIN).
The message is that most identifiers are guessable
and so it must be assumed that anyone
can access an identity resolver with a valid identifier
even if they have not be previously given the identifier.

## Authorised user

An authorised user is anyone who has found or been given
a registry identifier, but also has some kind of authorisation
to access further data about the identified item or entity.
This user is distinct from the registered member
because they typically have read access
(and maybe limited write access)
over identifiers that are NOT their own.
For example:

- A recycling plant that received an EV battery for recycling
  and requires access to bill-of-materials and disassembly instructions
  that are not normally public information.
- A competent authority such as a customs agency
  that requires access to value or compliance data for goods
  clearance that is not normally public.
