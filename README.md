# Portal Empresa (`ecommerce-portal`)

Portal web para **dueños de comercio (OWNER)**: registro de empresa, inicio de sesión, datos del negocio, productos y vitrina.

Construido con **Next.js 16 (App Router)**, **TypeScript**, **Tailwind CSS v4** y Base UI (misma base que `ecommerce-admin`).

## Rutas

| Ruta | Descripción |
|------|-------------|
| `/auth/register` | Registro de empresa (multipart + RIF) |
| `/auth/login` | Inicio de sesión |
| `/` | Dashboard con TODOs del comercio |
| `/company` | Datos de la empresa |
| `/products` | Catálogo (productos, marcas, modelos) |
| `/storefront` | Vitrina pública |
| `/settings` | Perfil y seguridad |

API backend: prefijo `/portal/*` (BFF en `/api/bff/*`).

## Desarrollo

```bash
pnpm install
pnpm dev
```

Por defecto corre en [http://localhost:3002](http://localhost:3002).

Variables:

- `NEXT_PUBLIC_API_URL` (default `http://localhost:3001`)
- `NEXT_PUBLIC_APP_URL` (default `http://localhost:3002`)
