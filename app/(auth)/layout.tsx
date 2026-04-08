export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-[oklch(0.08_0_0)] flex items-center justify-center p-4">
      {children}
    </div>
  )
}
