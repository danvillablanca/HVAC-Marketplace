# Conectar el proyecto oficial de Supabase

Guía para probar la app contra el proyecto **HVAC-Marketplace** de Supabase Cloud
(`paklzafoipzghfyftnfw`) en vez de la réplica local en Docker. El repo ya está vinculado a ese
proyecto (`supabase/.temp/project-ref`).

## 0. Requisitos (los hace el dueño del proyecto)

1. **Restaurar el proyecto si está pausado.** Supabase pausa los proyectos gratuitos sin uso; en
   ese estado su URL deja de existir. Dashboard → proyecto → *Restore project*.
2. **Dar acceso** a quien vaya a desplegar: *Organization settings → Team → Invite* con rol
   *Developer* o superior. Sin esto la CLI responde `403 ... does not have the necessary
   privileges`.

## 1. Subir el esquema

```bash
npx supabase login                                   # abre el navegador
npx supabase link --project-ref paklzafoipzghfyftnfw # pide la contraseña de la base de datos
npx supabase migration list --linked                 # revisar qué hay aplicado en la nube
npx supabase db push                                 # aplica supabase/migrations (0001…0012)
```

- Si la nube ya tiene tablas creadas a mano, `migration list` lo mostrará como migraciones locales
  pendientes; en ese caso revisa con `npx supabase db diff --linked` antes de empujar.
- **Datos de demostración (opcional):** `npx supabase db push --include-seed` carga el catálogo de
  servicios, 36 proveedores, solicitudes de ejemplo y las 5 cuentas demo con contraseña
  `demo1234`. El catálogo de servicios es necesario para que los proveedores elijan servicios; si
  no cargas el seed completo, inserta al menos las tablas `categories` y `services` del principio
  de `supabase/seed.sql`. Ojo: en la nube las cuentas demo son accesibles por cualquiera que
  conozca la contraseña.

## 2. Configurar Auth en el Dashboard

*Authentication → URL Configuration*:
- **Site URL:** `http://localhost:5173` (o la URL del frontend desplegado).
- **Redirect URLs:** `http://localhost:5173/ingresar` y `http://localhost:5173/restablecer`.

*Authentication → Sign In / Providers → Email*: **Confirm email** viene activado en la nube. La app
lo soporta: al registrarse muestra "Revisa tu correo" y, si alguien intenta ingresar sin confirmar,
se lo indica. Para pruebas rápidas puedes desactivarlo.

Plantillas en español (opcional): copia `supabase/templates/recovery.html` y `confirmation.html`
en *Authentication → Emails*, o ejecuta `npx supabase config push` (sube también `site_url` y el
resto de `supabase/config.toml`; revísalo antes).

## 3. Variables en `.env`

Valores en *Project Settings → API Keys* (la `service_role` es secreta: nunca en el frontend ni en
el repo):

```bash
SUPABASE_URL=https://paklzafoipzghfyftnfw.supabase.co
SUPABASE_ANON_KEY=<anon / publishable key>
SUPABASE_SERVICE_ROLE_KEY=<service_role / secret key>
VITE_SUPABASE_URL=https://paklzafoipzghfyftnfw.supabase.co
VITE_SUPABASE_ANON_KEY=<anon / publishable key>
DEMO_MODE=false
VITE_DEMO_MODE=false
```

Reinicia `pnpm dev`. `http://localhost:3001/api/health` debe responder `"supabase": true`.

## 4. Verificar

- Registro de una cuenta nueva → correo de confirmación → ingreso.
- Los recorridos de [`tests/real/`](../../tests/real/README.md) funcionan contra la nube cambiando
  `BASE_URL`; los que consultan la base con `docker exec ... psql` solo sirven en local.
