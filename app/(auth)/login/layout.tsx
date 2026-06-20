export default function LoginLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <main className="min-h-dvh overflow-x-hidden bg-[url('/staredesk-background-mobile.svg')] bg-cover bg-center bg-no-repeat lg:flex lg:h-dvh lg:min-h-dvh lg:overflow-hidden lg:bg-linear-to-tl/srgb lg:from-yellow-800 lg:from-0% lg:via-amber-300 lg:via-35% lg:to-amber-50 lg:to-75%">
      {children}
    </main>
  );
}
