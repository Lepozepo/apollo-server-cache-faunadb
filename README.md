# Apollo Server Cache for FaunaDB

## How to use

Before you can use the cache, you'll need to create a collection and index for it in faunadb. The faunadb class provides 2 functions for that:

```
<!-- init.js -->
import FaunaCache from 'apollo-server-cache-faunadb';

export const cache = new FaunaCache({
  secret, // Your FaunaDB Access Key
  ttl, // How long you want data cached
  collection, // The name of the collection where data will be cached
});

export function up() {
  return cache.stage(); // The function that creates the collection and index your cache needs
}

export function down() {
  return cache.unstage(); // The function that removes the collection and index your cache needs
}
```

Once you have this, you can stage the cache in a migration or some startup script. It is safe to run the `stage` function multiple times (it will not duplicate anything).

Now import your cache so you can use it.

```
import { ApolloServer } from 'apollo-server';
import { cache } from '~/init';

export default new ApolloServer({
  cache,
})
```
