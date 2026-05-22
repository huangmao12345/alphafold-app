// src/lib/schema.ts
import { Pool } from 'pg';

// Assumed database connection pool export from your local setup
// e.g., export const pool = new Pool({ database: 'vaxcyte_alphafold' });
import { pool } from './db'; 

export const typeDefs = `
  enum JobStatus {
    SUBMITTED
    APPROVED
    IN_PROCESS
    PROCESSED
    FAILED
  }

  enum Role {
    USER
    SUPERUSER
  }

  type User {
    id: ID!
    email: String!
    first_name: String!
    last_name: String!
    job_title: String
    department: String
    role: Role!
    created_at: String!
    updated_at: String!
  }

  type Project {
    id: ID!
    name: String!
    description: String
    created_at: String!
  }

  type Sequence {
    id: ID!
    name: String!
    amino_acids: String!
    status: JobStatus!
    pdb_url: String
    confidence: Float
    project_id: String!
    created_by_at: String!
    created_at: String!
    updated_at: String!
    
    # Relational field definitions for GraphQL nesting
    project: Project!
    creator: User!
  }

  type Query {
    sequences: [Sequence!]!
    projects: [Project!]!
    sequence(id: ID!): Sequence
  }

  type Mutation {
    createProject(
      name: String!
      description: String
    ): Project!

    createSequence(
      name: String!
      amino_acids: String!
      project_id: String!
      created_by_at: String!
    ): Sequence!
  }
`;

export const resolvers = {
  Query: {
    // 1. Fetch all structural targets sorted by recent runs
    sequences: async () => {
      const query = 'SELECT * FROM "Sequence" ORDER BY created_at DESC';
      const result = await pool.query(query);
      return result.rows;
    },

    // 2. Fetch all research antigen tracking projects
    projects: async () => {
      const query = 'SELECT * FROM "Project" ORDER BY created_at DESC';
      const result = await pool.query(query);
      return result.rows;
    },

    // 3. Fetch an isolated model sequence item
    sequence: async (_parent: any, args: { id: string }) => {
      const query = 'SELECT * FROM "Sequence" WHERE id = $1';
      const result = await pool.query(query, [args.id]);
      return result.rows[0] || null;
    }
  },

  // 👇 Pure Relational Fields Layer (No more complex SQL joins required!)
  Sequence: {
    // Fetches the parent project record when requested in the GraphQL tree
    project: async (parent: { project_id: string }) => {
      const query = 'SELECT * FROM "Project" WHERE id = $1';
      const result = await pool.query(query, [parent.project_id]);
      return result.rows[0];
    },
    // Fetches the scientist record who owned this model generation run
    creator: async (parent: { created_by_at: string }) => {
      const query = 'SELECT * FROM "User" WHERE id = $1';
      const result = await pool.query(query, [parent.created_by_at]);
      return result.rows[0];
    }
  },

  Mutation: {
    // 4. Mutation to create a project first so we have a valid parent row
    createProject: async (_parent: any, args: { name: string; description?: string }) => {
      const { name, description } = args;
      const newId = crypto.randomUUID(); // Native Web Crypto API, no npm installations required!
      
      const query = `
        INSERT INTO "Project" (id, name, description)
        VALUES ($1, $2, $3)
        RETURNING *
      `;
      const result = await pool.query(query, [newId, name, description || null]);
      return result.rows[0];
    },

    // 5. Mutation to submit a structural folding target safely linking to the real parents
    createSequence: async (
      _parent: any, 
      args: { name: string; amino_acids: string; project_id: string; created_by_at: string }
    ) => {
      const { name, amino_acids, project_id, created_by_at } = args;
      const newId = crypto.randomUUID();
      const now = new Date().toISOString();
      
      const query = `
        INSERT INTO "Sequence" (id, name, amino_acids, status, project_id, created_by_at, created_at, updated_at)
        VALUES ($1, $2, $3, 'SUBMITTED', $4, $5, $6, $7)
        RETURNING *
      `;
      const values = [newId, name, amino_acids, project_id, created_by_at, now, now];
      const result = await pool.query(query, values);
      return result.rows[0];
    }
  }
};