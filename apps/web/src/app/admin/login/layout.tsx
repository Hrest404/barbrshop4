// Страница /admin/login использует собственный layout (root layout),
// а не admin layout с NavBar. Это достигается тем, что login/page.tsx
// находится НЕ внутри route group (dashboard).
// Этот файл — пустой layout-overrider для login, чтобы исключить AdminNav.

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
