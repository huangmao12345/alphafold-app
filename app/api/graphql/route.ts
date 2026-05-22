// src/app/api/graphql/route.ts
import { createYoga, createSchema } from 'graphql-yoga';
import { typeDefs, resolvers } from '@/lib/schema';

const schema = createSchema({
  typeDefs,
  resolvers,
});

// Create a GraphQL Yoga server instance calibrated for Next.js Edge execution blocks
const { handleRequest } = createYoga({
  schema,
  graphqlEndpoint: '/api/graphql',
  fetchAPI: { Response }
});

export { handleRequest as GET, handleRequest as POST };