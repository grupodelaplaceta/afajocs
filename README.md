# AFAJICS

Plataforma web educativa gamificada para alumnos de 1º a 6º de primaria.

El proyecto combina:

- Estructura pedagogica tipo JClic: actividades formales, medibles y reutilizables.
- Energia visual tipo Kahoot: feedback inmediato, puntuacion, records y celebraciones.
- Paleta de marca estricta: purpura/magenta, azul cian, naranja, negro y blanco.

## Documentacion inicial

- [Esquema de base de datos](docs/01-database-schema.md)
- [Arquitectura de interfaz de juegos](docs/02-game-interface-architecture.md)
- [Sistema visual de marca](docs/03-brand-system.md)

## Siguiente paso tecnico recomendado

La aplicacion fullstack ya esta iniciada con:

- Next.js + React para la interfaz.
- MongoDB Atlas para persistencia.
- Mongoose para el modelo de datos.
- Autenticacion por email/password para profesores y alumnos remotos.
- Motor de juegos compartido para `matching`, `fill_blanks` y `basic_typing`.

## Desarrollo local

```bash
npm install
npm run dev
```

La aplicacion usa variables de entorno:

```txt
MONGODB_URI=
JWT_SECRET=
NEXT_PUBLIC_APP_URL=
```

`MONGODB_URI` y `JWT_SECRET` deben configurarse en `.env.local` en desarrollo y en Vercel como Environment Variables.

## Deploy en Vercel

1. Crear repositorio en GitHub.
2. Subir el codigo sin `.env.local`.
3. Importar el repo desde Vercel.
4. Añadir variables:
   - `MONGODB_URI`
   - `JWT_SECRET`
   - `NEXT_PUBLIC_APP_URL`
5. Ejecutar deploy.

## Seguridad

- Las contraseñas se guardan con hash `bcrypt`.
- La sesion usa JWT firmado en cookie `httpOnly`.
- `.env.local` esta ignorado por Git.
- Antes de hacer publico el repo, conviene rotar cualquier contraseña que haya sido compartida por chat.
