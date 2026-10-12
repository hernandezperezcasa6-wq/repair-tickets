import { NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: Request) {
  try {
    // 1. Verificar sesión del administrador
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { data: adminProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (adminProfile?.role !== 'admin') {
      return NextResponse.json({ error: 'Permisos insuficientes' }, { status: 403 });
    }

    // 2. Parsear datos del nuevo cliente
    const body = await request.json();
    const { fullName, email, phone, password, preferredPhotoChannel } = body;

    if (!fullName || !email || !password) {
      return NextResponse.json(
        { error: 'Nombre, correo y contraseña son obligatorios' },
        { status: 400 }
      );
    }

    // 3. Crear usuario mediante Supabase Admin API
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        {
          error:
            'Falta configurar SUPABASE_SERVICE_ROLE_KEY en el archivo .env.local para permitir la creación directa de cuentas desde el panel.',
        },
        { status: 500 }
      );
    }

    const adminClient = createAdminClient();

    const { data: createdUser, error: authError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        contact_phone: phone || '',
        role: 'client',
        preferred_photo_channel: preferredPhotoChannel || 'WhatsApp',
      },
    });

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    // Asegurar que el perfil exista y tenga los datos completos
    if (createdUser?.user) {
      await adminClient
        .from('profiles')
        .upsert({
          id: createdUser.user.id,
          full_name: fullName,
          email,
          role: 'client',
          contact_phone: phone || '',
          preferred_photo_channel: preferredPhotoChannel || 'WhatsApp',
          account_status: 'active',
        });
    }

    return NextResponse.json({ success: true, user: createdUser.user });
  } catch (error: unknown) {
    console.error('Error creating client:', error);
    return NextResponse.json(
      { error: (error as Error)?.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
