import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const url = request.nextUrl.clone();
  const pathname = url.pathname;

  // 1. Proteger accesos sin sesión activa
  if (!user && (pathname.startsWith('/dashboard') || pathname.startsWith('/admin'))) {
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // 2. Control de roles y estados de cuenta para usuarios autenticados
  if (user && (pathname.startsWith('/dashboard') || pathname.startsWith('/admin') || pathname === '/login')) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, account_status')
      .eq('id', user.id)
      .single();

    // Cuenta desactivada
    if (profile?.account_status === 'inactive') {
      await supabase.auth.signOut();
      url.pathname = '/login';
      url.searchParams.set('error', 'inactive');
      return NextResponse.redirect(url);
    }

    const role = profile?.role || 'client';

    // Si está en /login y ya inició sesión, redirigir según rol
    if (pathname === '/login') {
      url.pathname = role === 'admin' ? '/admin/tickets' : '/dashboard';
      return NextResponse.redirect(url);
    }

    // Un cliente no puede entrar al panel de administración
    if (pathname.startsWith('/admin') && role !== 'admin') {
      url.pathname = '/dashboard';
      return NextResponse.redirect(url);
    }

    // Un admin se redirige a su panel de gestión si intenta entrar al dashboard de cliente
    if (pathname.startsWith('/dashboard') && role === 'admin') {
      url.pathname = '/admin/tickets';
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
