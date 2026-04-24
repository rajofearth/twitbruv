import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './src/schema/index.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? 'postgres://twotter:twotter@localhost:5432/twotter',
  },
  casing: 'snake_case',
  verbose: true,
  strict: true,
})
