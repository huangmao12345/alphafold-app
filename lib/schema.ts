import { pool } from './db'; 
import { GraphQLError } from 'graphql';

// Standard 20 known amino acids rule
const AMINO_ACID_REGEX = /^[ACDEFGHIKLMNPQRSTVWY]+$/;

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
    firstName: String!
    lastName: String!
    jobTitle: String
    department: String
    role: Role!
    createdAt: String!
    updatedAt: String!
  }

  type Project {
    id: ID!
    name: String!
    description: String
    createdAt: String!
  }

  type Sequence {
    id: ID!
    name: String!
    aminoAcids: String!
    status: JobStatus!
    pdbUrl: String
    confidence: Float
    projectId: String!
    createdByAt: String!
    createdAt: String!
    updatedAt: String!
    project: Project!
    creator: User!
  }

  # Input object designed for multi-row submission actions
  input SequenceInput {
    name: String!
    aminoAcids: String!
    projectId: String!
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
      aminoAcids: String!
      projectId: String!
    ): Sequence!

    # New Batch-enabled sequence submission pipeline
    submitBulkSequences(
      sequences: [SequenceInput!]!
    ): [Sequence!]!
  }
`;

interface SequenceInputArgs {
  name: string;
  aminoAcids: string;
  projectId: string;
}

export const resolvers = {
  Query: {
    sequences: async () => {
      const query = `
        SELECT 
          id, 
          name, 
          amino_acids AS "aminoAcids", 
          status, 
          pdb_url AS "pdbUrl", 
          confidence, 
          project_id AS "projectId", 
          created_by_at AS "createdByAt", 
          created_at AS "createdAt", 
          updated_at AS "updatedAt" 
        FROM "Sequence" 
        ORDER BY created_at DESC
      `;
      const result = await pool.query(query);
      return result.rows;
    },

    projects: async () => {
      const query = `
        SELECT 
          id, 
          name, 
          description, 
          created_at AS "createdAt" 
        FROM "Project" 
        ORDER BY created_at DESC
      `;
      const result = await pool.query(query);
      return result.rows;
    },

    sequence: async (_parent: any, args: { id: string }) => {
      const query = `
        SELECT 
          id, 
          name, 
          amino_acids AS "aminoAcids", 
          status, 
          pdb_url AS "pdbUrl", 
          confidence, 
          project_id AS "projectId", 
          created_by_at AS "createdByAt", 
          created_at AS "createdAt", 
          updated_at AS "updatedAt" 
        FROM "Sequence" 
        WHERE id = $1
      `;
      const result = await pool.query(query, [args.id]);
      return result.rows[0] || null;
    }
  },

  Sequence: {
    project: async (parent: { projectId: string }) => {
      const query = `
        SELECT id, name, description, created_at AS "createdAt" 
        FROM "Project" 
        WHERE id = $1
      `;
      const result = await pool.query(query, [parent.projectId]);
      return result.rows[0];
    },
    creator: async (parent: { createdByAt: string }) => {
      const query = `
        SELECT 
          id, 
          email, 
          first_name AS "firstName", 
          last_name AS "lastName", 
          job_title AS "jobTitle", 
          department, 
          role, 
          created_at AS "createdAt", 
          updated_at AS "updatedAt" 
        FROM "User" 
        WHERE id = $1
      `;
      const result = await pool.query(query, [parent.createdByAt]);
      return result.rows[0];
    }
  },

  Mutation: {
    createProject: async (_parent: any, args: { name: string; description?: string }) => {
      const { name, description } = args;
      const query = `
        INSERT INTO "Project" (name, description)
        VALUES ($1, $2)
        RETURNING id, name, description, created_at AS "createdAt"
      `;
      const result = await pool.query(query, [name, description || null]);
      return result.rows[0];
    },

    createSequence: async (
      _parent: any, 
      args: { name: string; aminoAcids: string; projectId: string }
    ) => {
      const { name, aminoAcids, projectId } = args;
      const query = `
        INSERT INTO "Sequence" (name, amino_acids, status, project_id, created_by_at, updated_at)
        VALUES ($1, $2, 'SUBMITTED', $3, 'cmpb7jyds00007u2gz853b5ic', NOW())
        RETURNING 
          id, 
          name, 
          amino_acids AS "aminoAcids", 
          status, 
          pdb_url AS "pdbUrl", 
          confidence, 
          project_id AS "projectId", 
          created_by_at AS "createdByAt", 
          created_at AS "createdAt", 
          updated_at AS "updatedAt"
      `;
      const values = [name, aminoAcids, projectId];
      const result = await pool.query(query, values);
      return result.rows[0];
    },

    submitBulkSequences: async (
      _parent: any,
      args: { sequences: SequenceInputArgs[] }
    ) => {
      const { sequences } = args;

      if (!sequences || sequences.length === 0) {
        throw new GraphQLError("Submission payload must contain at least one protein entry.");
      }

      const standardizedSequences = sequences.map(item => ({
        ...item,
        aminoAcids: item.aminoAcids.trim().toUpperCase()
      }));

      // --- CRITICAL DOMAIN RULES VALIDATION PIPELINE ---
      for (const item of standardizedSequences) {
        if (!item.name.trim() || !item.projectId || !item.aminoAcids) {
          throw new GraphQLError(`Validation failure for sequence "${item.name}": Complete text structure inputs are required.`);
        }

        if (item.aminoAcids.length > 1500) {
          throw new GraphQLError(`Validation failure for sequence "${item.name}": Chain length exceeds the 1500 limit.`);
        }

        if (!AMINO_ACID_REGEX.test(item.aminoAcids)) {
          throw new GraphQLError(`Validation failure for sequence "${item.name}": Contains invalid letters or symbols.`);
        }
      }

      // Check against Database for pre-existing chains targeting standard snake_case column
      const uniqueChains = Array.from(new Set(standardizedSequences.map(s => s.aminoAcids)));
      const checkDuplicateQuery = `
        SELECT amino_acids AS "aminoAcids" 
        FROM "Sequence" 
        WHERE amino_acids = ANY($1)
      `;
      const duplicateCheckResult = await pool.query(checkDuplicateQuery, [uniqueChains]);
      
      if (duplicateCheckResult.rows.length > 0) {
        const structuralCollisions = duplicateCheckResult.rows.map(r => r.aminoAcids);
        const offendingTarget = standardizedSequences.find(s => structuralCollisions.includes(s.aminoAcids));
        throw new GraphQLError(
          `Validation failure: A matching structural variant sequence already exists in the records for candidate: "${offendingTarget?.name}".`
        );
      }

      // --- ALL PIPELINE CHECKS PASSED: RUN TRANSACTION STORAGE ---
      const insertedRecords = [];
      const client = await pool.connect();

      try {
        await client.query('BEGIN');
        
        // Structured using lowercase snake_case targets, returned with exact camelCase aliases
        const insertQuery = `
          INSERT INTO "Sequence" (name, amino_acids, status, project_id, created_by_at, updated_at)
          VALUES ($1, $2, 'SUBMITTED', $3, 'cmpb7jyds00007u2gz853b5ic', NOW())
          RETURNING 
            id, 
            name, 
            amino_acids AS "aminoAcids", 
            status, 
            project_id AS "projectId", 
            created_by_at AS "createdByAt", 
            created_at AS "createdAt", 
            updated_at AS "updatedAt"
        `;

        for (const item of standardizedSequences) {
          const result = await client.query(insertQuery, [
            item.name.trim(),
            item.aminoAcids,
            item.projectId
          ]);
          insertedRecords.push(result.rows[0]);
        }

        await client.query('COMMIT');
        return insertedRecords;

      } catch (transactionError) {
        await client.query('ROLLBACK');
        throw new GraphQLError("Database error processing batch queue pipeline. All actions rolled back.");
      } finally {
        client.release();
      }
    }
  }
};