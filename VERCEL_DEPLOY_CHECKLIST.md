# Vercel Deploy Checklist

## 1) Before deploy
- Ensure local build succeeds: `npm run build`
- Ensure TypeScript passes: `npx tsc --noEmit`

## 2) Required environment variables
Set these in Vercel Project Settings → Environment Variables:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Use `.env.example` as the template for required keys.

## 3) Deploy (Dashboard)
1. Vercel → New Project
2. Import this GitHub repository
3. Framework Preset: Next.js (auto)
4. Add environment variables
5. Deploy

## 4) Deploy (CLI)
```bash
npm i -g vercel
vercel login
vercel
vercel --prod
```

## 5) Security checks (important)
- Do **not** commit `.env.local`
- Keep `.gitignore` active for all `.env*` local files
- If any secrets were committed before, rotate them in provider console (Supabase)
- Re-deploy after secret rotation

## 6) Post-deploy smoke test
- Open `/projects`
- Open one project and each framework page:
  - SWOT
  - PESTEL
  - McKinsey 7S
  - Double Matrix
  - Persona Model
  - Report
- Verify data loading and realtime updates
