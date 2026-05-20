{
  "name": "luxedrive",
  "version": "1.0.0",
  "private": true,
  "workspaces": [
    "apps/*",
    "packages/*"
  ],
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "start": "turbo run start",
    "lint": "turbo run lint",
    "type-check": "turbo run type-check",
    "test": "turbo run test",
    "db:migrate": "cd apps/api && npx prisma migrate dev",
    "db:seed": "cd apps/api && npx ts-node src/utils/seed.ts",
    "db:studio": "cd apps/api && npx prisma studio"
  },
  "devDependencies": {
    "turbo": "^1.13.0",
    "typescript": "^5.4.0",
    "prettier": "^3.2.5",
    "@types/node": "^20.12.0"
  },
  "engines": {
    "node": ">=18.0.0",
    "npm": ">=9.0.0"
  }
}
