# ⭐ Polaris — Insurance Platform

Group health insurance management platform built with Next.js 14, Azure Cosmos DB, and Tailwind CSS.

## Quick Start

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.local.example .env.local
# Edit .env.local with your Cosmos DB credentials

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — the dashboard works immediately with dummy data.

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── health/        # Health check endpoint
│   │   ├── clients/       # Clients API (TODO)
│   │   ├── members/       # Members API (TODO)
│   │   └── claims/        # Claims API (TODO)
│   ├── (dashboard)/       # Dashboard route group
│   ├── layout.tsx         # Root layout with sidebar
│   ├── page.tsx           # Dashboard page
│   └── globals.css        # Global styles
├── components/
│   ├── dashboard/         # Dashboard-specific components
│   │   ├── kpi-card.tsx
│   │   ├── claims-chart.tsx
│   │   ├── claims-status-chart.tsx
│   │   └── top-clients-table.tsx
│   ├── layout/            # Layout components
│   │   └── sidebar.tsx
│   └── ui/                # Reusable UI primitives
├── lib/
│   ├── cosmos.ts          # Cosmos DB connection & helpers
│   ├── kpi-service.ts     # KPI data service layer
│   ├── dummy-data.ts      # Dev-mode dummy data
│   └── seed.ts            # Database seed script
├── types/
│   └── index.ts           # TypeScript domain models
├── hooks/                 # Custom React hooks
└── styles/                # Additional styles
```

## Azure Cosmos DB Setup

1. Create a Cosmos DB account (NoSQL API) in Azure Portal
2. Get the endpoint URL and primary key
3. Add to `.env.local`:
   ```
   COSMOS_ENDPOINT=https://your-account.documents.azure.com:443/
   COSMOS_KEY=your-primary-key
   COSMOS_DATABASE=polaris
   ```
4. Seed the database:
   ```bash
   npm run db:seed
   ```

The app automatically creates containers (`clients`, `members`, `claims`) on first seed.

## Development Notes

- **Dummy data mode**: The dashboard works without Cosmos DB — it detects missing credentials and falls back to dummy data
- **KPI Service**: `src/lib/kpi-service.ts` abstracts the data source. Flip to live queries when ready
- **Partition keys**: `clients` → `/id`, `members` → `/clientId`, `claims` → `/clientId`

## Tech Stack

| Layer      | Tech                        |
| ---------- | --------------------------- |
| Framework  | Next.js 14 (App Router)     |
| Language   | TypeScript 5.4              |
| Database   | Azure Cosmos DB (NoSQL)     |
| Styling    | Tailwind CSS 3.4            |
| Charts     | Recharts 2.12               |
| Icons      | Lucide React                |

## Roadmap

- [ ] Connect real Cosmos DB queries
- [ ] Clients CRUD pages
- [ ] Members management
- [ ] Claims workflow (submit → review → approve/reject → pay)
- [ ] Authentication (Azure AD)
- [ ] Role-based access control
- [ ] PDF claim reports
- [ ] Email notifications
