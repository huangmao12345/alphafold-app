import { createYoga, createSchema } from 'graphql-yoga';
import { typeDefs, resolvers } from '@/lib/schema';
import { NextRequest } from 'next/server';

const schema = createSchema({
  typeDefs,
  resolvers,
});

// Configure Yoga to look at Next.js App Router endpoints explicitly
const yoga = createYoga({
  schema,
  graphqlEndpoint: '/api/graphql',
  fetchAPI: { Response },
});

// Explicitly wrap the handlers so they satisfy Next.js RouteHandlerConfig
export async function GET(request: NextRequest) {
  return yoga.handle(request);
}

export async function POST(request: NextRequest) {
  return yoga.handle(request);
}