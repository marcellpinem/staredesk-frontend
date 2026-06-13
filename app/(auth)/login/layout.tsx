export default function LoginLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <main className="min-h-screen bg-[url('/staredesk-background-mobile.svg')] bg-cover bg-center bg-no-repeat lg:flex lg:bg-[url('/background-desktop.svg')]">
      {children}
    </main>
  );
}
