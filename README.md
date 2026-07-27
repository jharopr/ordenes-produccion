# Órdenes de producción

MVP para gestionar clientes, sedes y órdenes de producción de SALABUS. Es un monorepo con NestJS, React, TypeORM y PostgreSQL.

## Requisitos

- Node.js 22
- npm
- Docker Desktop

## Desarrollo local

```powershell
npm install
Copy-Item apps/backend/.env.example apps/backend/.env
Copy-Item apps/frontend/.env.example apps/frontend/.env
docker compose up -d
npm run migration:run
npm run seed
npm run dev:backend
```

En otra terminal:

```powershell
npm run dev:frontend
```

Frontend: `http://localhost:5173`  
API: `http://localhost:3000/api`  
Swagger: `http://localhost:3000/api/docs`

## Variables de entorno

Backend:

```env
PORT=3000
NODE_ENV=development
DATABASE_URL=postgresql://postgres:postgres@localhost:5440/ordenes_produccion
DATABASE_SSL=false
DATABASE_SYNCHRONIZE=false
DATABASE_LOGGING=true
```

Frontend en desarrollo:

```env
VITE_API_URL=http://localhost:3000/api
```

En producción se compila con `VITE_API_URL=/api`, NestJS escucha `PORT` en `0.0.0.0` y sirve el frontend compilado.

## Comandos

```powershell
npm run migration:show
npm run migration:run
npm run migration:revert
npm run seed
npm run build
docker build -t ordenes-produccion .
docker run --env-file apps/backend/.env -p 3000:3000 ordenes-produccion
```

El seed es idempotente, usa a Salabus como cliente predeterminado y solo se ejecuta manualmente; nunca se inicia automáticamente en producción.

## Logo del cliente

Los datos y el logo de Salabus se administran desde la página `/clientes`, seleccionando el cliente y entrando en **Configurar**. Las imágenes se guardan localmente en `apps/backend/uploads` y se sirven desde `/uploads`.

Los archivos cargados están excluidos de Git. En un contenedor o Railway, esta carpeta requiere un volumen persistente para conservar imágenes entre despliegues. La migración futura a Supabase Storage queda fuera del MVP actual.

## Endpoints

- `POST/GET /api/customers`
- `GET/PATCH /api/customers/:id`
- `GET /api/locations`
- `POST/GET /api/production-orders`
- `GET/PATCH/DELETE /api/production-orders/:id`
- `PATCH /api/production-orders/:id/status`
- `POST /api/production-orders/:id/payments`
- `GET /api/production-orders/:id/pdf`
- `GET /api/production-orders/dashboard`
- `GET /api/docs`

Estados de orden: `DRAFT`, `ORDERED`, `CANCELLED`. Estados de pago: `UNPAID`, `PARTIALLY_PAID`, `PAID`. La fecha de cada pago se registra automáticamente en el backend y los pagos no se incluyen en el PDF.

## Alcance pendiente

Autenticación, roles, carga real de facturas, almacenamiento externo, notificaciones, facturación electrónica y multiempresa quedan fuera del MVP.
