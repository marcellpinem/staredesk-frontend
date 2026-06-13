// import { NextRequest, NextResponse } from "next/server";

// const PUBLIC_PATHS = ["/login"];

// export function middleware(request: NextRequest) {
//   const { pathname } = request.nextUrl;

//   const isPublic = PUBLIC_PATHS.some((path) => pathname.startsWith(path));
//   const token = request.cookies.get("token")?.value;

//   if (!isPublic && !token) {
//     return NextResponse.redirect(new URL("/login", request.url));
//   }

//   if (isPublic && token) {
//     return NextResponse.redirect(new URL("/dashboard", request.url));
//   }

//   return NextResponse.next();
// }

// export const config = {
//   matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.svg$).*)"],
// };

import { NextRequest, NextResponse } from "next/server";

const AUTH_ENTRY_PATHS = ["/", "/login"];

function isAuthEntryPath(pathname: string) {
  return AUTH_ENTRY_PATHS.includes(pathname);
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("token")?.value;

  const isAuthEntry = isAuthEntryPath(pathname);

  // Sudah login tapi paksa masuk / atau /login
  if (token && isAuthEntry) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Belum login tapi masuk protected page
  if (!token && !isAuthEntry) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|webp|ico)$).*)",
  ],
};
