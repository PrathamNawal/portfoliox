// Path-based portfolio route: /p/[slug]
// Re-uses the same rendering logic as the subdomain route app/[slug]/page.tsx
export { default, generateMetadata } from '@/app/[slug]/page'
