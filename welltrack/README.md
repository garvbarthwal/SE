# WellTrack

AI-powered fitness and wellness ecosystem. Track workouts, nutrition, and hydration in one place.

## Tech Stack

- **Frontend:** Next.js 15 (App Router) + TypeScript + Tailwind CSS
- **Auth:** NextAuth v5 (Credentials provider)
- **Database:** PostgreSQL + Prisma ORM
- **Validation:** Zod
- **Password Hashing:** bcryptjs

## Getting Started

### Prerequisites

- Node.js 18+
- Docker (for local PostgreSQL)
- npm

### Local Development

1. **Start PostgreSQL**

```bash
docker compose up -d
```

Or use an existing PostgreSQL instance and update `DATABASE_URL` in `.env`.

2. **Install dependencies**

```bash
npm install
```

3. **Set up environment**

```bash
cp .env.example .env
# Edit .env with your database credentials
```

4. **Run migrations**

```bash
npx prisma migrate dev
```

5. **Start dev server**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx
│   │   ├── page.tsx              # Dashboard
│   │   ├── workouts/page.tsx
│   │   ├── nutrition/page.tsx
│   │   └── hydration/page.tsx
│   └── api/
│       ├── auth/
│       │   ├── [...nextauth]/route.ts
│       │   └── register/route.ts
│       ├── workouts/route.ts
│       ├── nutrition/route.ts
│       ├── hydration/route.ts
│       └── dashboard/route.ts
├── components/
│   ├── ui/
│   │   ├── Button.tsx
│   │   └── Input.tsx
│   └── layout/
│       ├── Header.tsx
│       └── Sidebar.tsx
└── lib/
    ├── auth.ts
    ├── prisma.ts
    ├── validations.ts
    └── utils.ts
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/[...nextauth]` | Login (NextAuth) |
| GET/POST | `/api/workouts` | List/Create workouts |
| DELETE | `/api/workouts/[id]` | Delete workout |
| GET/POST | `/api/nutrition` | List/Create nutrition logs |
| DELETE | `/api/nutrition/[id]` | Delete nutrition log |
| GET/POST | `/api/hydration` | List/Create hydration logs |
| DELETE | `/api/hydration/[id]` | Delete hydration log |
| GET | `/api/dashboard` | Today's stats summary |

## Deployment

### Vercel (Frontend)

1. Connect GitHub repo to Vercel
2. Add environment variables:
   - `DATABASE_URL` (Neon PostgreSQL URL)
   - `NEXTAUTH_SECRET`
   - `NEXTAUTH_URL` (your Vercel URL)
3. Deploy

### Production Database

Use [Neon](https://neon.tech) for hosted PostgreSQL:
1. Create a Neon project
2. Copy the connection string
3. Set as `DATABASE_URL` in Vercel env vars
4. Run `npx prisma migrate deploy` to apply schema

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
