import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const pin = request.cookies.get('app_pin')?.value;
  
  const isLoginPage = request.nextUrl.pathname === '/login';
  
  if (!pin || pin !== '1712') {
    if (!isLoginPage) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  } else {
    if (isLoginPage) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|manifest.json).*)'],
};
