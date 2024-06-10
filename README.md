# Next.js Auth Toolkit

## Getting started

Please make sure you have installed the latest version of Node.js.

Install dependencies with:

```
npm install
```

Launch devserver (at http://localhost:3000):

```
npm run dev
```

## Database

NOTE: There are types added for Prisma in globalThis for dev environment. Why? For Next.js hot reload so there is no need to initialize `new PrismaClient()` on every file save (global is not affected by hot reload). Please check the:

```
/lib/db.ts
```

Create `/prisma/schema.prisma` and fill `.env` with fake database url:

```
npx prisma init
```

After obtaining an actual database url update `/prisma/prisma.schema` and `.env` files with proper values.

Run this command to generate your model from Prisma schema so you can access it from `db` object in `/lib/d.ts`:

```
npx prisma generate
```

Push your collection to database (synchronize your Prisma schema):

```
npx prisma db push
```

To clear your database:

```
npx prisma migrate reset
npx prisma db push
```

Preview your database with:

```
npx prisma studio
```

## TODO

- update docs for third-party vendors (OAuth providers, Resend, Vercel)
- fix reading session with `useSession` (client-side) on first render
- fix updating user session values (server-side page)
- add tests
- add GitHub Actions
- add Husky
- add parallel routes
- add RWD
- add SEO metadata
- clean up JSX with reusable components
- migrate to the new ESLint flat config
