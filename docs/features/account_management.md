# Account management

The account management is simple management that allows the account use the api key to access the identity resolver API when registering the identity resolver. The Api Key currently is configured in the `.env.development` file with the `API_KEY` variable.

The anonymous user can access only the resolver API to query the identity resolver. The authorized user can configure the identifiers, register the identity resolver, ect.

# Account management with NestJS

Currently, the account management is implemented with NestJS and follows the [Passport strategies](https://docs.nestjs.com/recipes/passport#implementing-passport-strategies) to authenticate the user. To add the new strategy, the user can add the new strategy in the `src/auth/strategies` folder and add the new strategy in the `src/auth/auth.module.ts` file. The guard now supports the `api-key` only.

The user can use the `@Public()` decorator to config the public route that does not require the authentication. The private routes are the routes that require the authentication.
