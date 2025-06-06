This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.js`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/basic-features/font-optimization) to automatically optimize and load Inter, a custom Google Font.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.

```

```

```

```

ㅖ

```
four_social_insurance_system
├─ .eslintrc.json
├─ add-user-to-auth.js
├─ app
│  ├─ (auth)
│  │  ├─ forgot-password
│  │  │  └─ page.jsx
│  │  ├─ login
│  │  │  └─ page.jsx
│  │  ├─ register
│  │  │  ├─ company
│  │  │  │  └─ page.jsx
│  │  │  ├─ labor-office
│  │  │  │  └─ page.jsx
│  │  │  └─ page.jsx
│  │  └─ reset-password
│  │     └─ page.js
│  ├─ access-restricted
│  │  └─ page.jsx
│  ├─ api
│  │  ├─ auth
│  │  │  ├─ change-password
│  │  │  │  └─ route.js
│  │  │  ├─ forgot-password
│  │  │  │  └─ route.js
│  │  │  ├─ login
│  │  │  │  └─ route.js
│  │  │  ├─ logout
│  │  │  │  └─ route.js
│  │  │  ├─ refresh
│  │  │  │  └─ route.js
│  │  │  ├─ register
│  │  │  │  └─ route.js
│  │  │  ├─ resend-verification
│  │  │  │  └─ route.js
│  │  │  ├─ reset-password
│  │  │  │  └─ route.js
│  │  │  ├─ test
│  │  │  │  └─ route.js
│  │  │  ├─ verify
│  │  │  │  └─ route.js
│  │  │  ├─ verify-email
│  │  │  │  └─ route.js
│  │  │  └─ verify-reset-token
│  │  │     └─ route.js
│  │  ├─ debug
│  │  │  ├─ token
│  │  │  │  └─ route.js
│  │  │  └─ user-status
│  │  │     └─ route.js
│  │  ├─ setup
│  │  │  ├─ initial-data
│  │  │  │  └─ route.js
│  │  │  └─ test-user
│  │  │     └─ route.js
│  │  ├─ super-admin
│  │  │  ├─ dashboard
│  │  │  │  └─ route.js
│  │  │  ├─ debug
│  │  │  │  └─ user-status
│  │  │  │     └─ [userId]
│  │  │  │        └─ route.js
│  │  │  └─ users
│  │  │     ├─ optimized
│  │  │     │  └─ route.js
│  │  │     ├─ paginated
│  │  │     │  └─ route.js
│  │  │     ├─ route.js
│  │  │     ├─ simple
│  │  │     │  └─ route.js
│  │  │     └─ [userId]
│  │  │        └─ status
│  │  │           └─ route.js
│  │  └─ test
│  │     ├─ email
│  │     │  └─ route.js
│  │     └─ route.js
│  ├─ company
│  │  ├─ components
│  │  │  ├─ CompanyHeader.jsx
│  │  │  └─ CompanySidebar.jsx
│  │  ├─ dashboard
│  │  │  └─ page.js
│  │  └─ layout.jsx
│  ├─ components
│  │  ├─ admin
│  │  │  └─ DBDebugModal.jsx
│  │  ├─ auth
│  │  │  ├─ AuthGuard.jsx
│  │  │  ├─ AuthProvider.jsx
│  │  │  ├─ EmailVerificationModal.jsx
│  │  │  ├─ LoginForm.jsx
│  │  │  ├─ LoginPageClient.jsx
│  │  │  └─ RegisterForm.jsx
│  │  ├─ layout
│  │  │  └─ HomeNavigation.jsx
│  │  ├─ shared
│  │  │  └─ ErrorBoundary.jsx
│  │  └─ ui
│  │     ├─ Button.jsx
│  │     ├─ Card.jsx
│  │     ├─ FormattedInput.jsx
│  │     ├─ Input.jsx
│  │     ├─ LoadingSpinner.jsx
│  │     └─ Modal.jsx
│  ├─ dashboard
│  │  └─ page.jsx
│  ├─ favicon.ico
│  ├─ file_tree.txt
│  ├─ globals.css
│  ├─ labor-office
│  │  ├─ components
│  │  │  ├─ LaborOfficeHeader.jsx
│  │  │  └─ LaborOfficeSidebar.jsx
│  │  ├─ dashboard
│  │  │  └─ page.js
│  │  └─ layout.jsx
│  ├─ layout.js
│  ├─ page.js
│  ├─ RLS.txt
│  ├─ sql.txt
│  ├─ store
│  │  └─ authStore.js
│  ├─ structure.txt
│  ├─ super-admin
│  │  ├─ layout.jsx
│  │  ├─ page.jsx
│  │  ├─ profile
│  │  │  └─ page.jsx
│  │  └─ users
│  │     └─ page.jsx
│  ├─ utils
│  │  └─ formatters.js
│  ├─ verify-email
│  │  └─ page.js
│  └─ worker
│     ├─ components
│     │  ├─ WorkerHeader.jsx
│     │  └─ WorkerSidebar.jsx
│     ├─ dashboard
│     │  └─ page.jsx
│     └─ layout.jsx
├─ jsconfig.json
├─ lib
│  ├─ auth.js
│  ├─ database.js
│  ├─ emailService.js
│  └─ middleware.js
├─ next.config.js
├─ package-lock.json
├─ package.json
├─ postcss.config.js
├─ public
│  ├─ manifest.json
│  ├─ next.svg
│  └─ vercel.svg
├─ pw.js
├─ README.md
├─ tailwind.config.js
└─ utils
   ├─ apiClient.js
   └─ constants.js

```