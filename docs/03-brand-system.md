# Sistema Visual de Marca

Paleta oficial extraida del logo corporativo `www-afaescolasantsalvador-org.png`.

## Colores

```css
:root {
  --brand-purple: #c000d8;
  --brand-cyan: #18a0e8;
  --brand-orange: #f05800;
  --brand-black: #101014;
  --brand-white: #ffffff;
}
```

## Uso Semantico

### Purpura `#C000D8`

- Acciones principales.
- Estado seleccionado.
- Elementos de identidad AFA.
- Pantallas de inicio de juego.
- Celebracion de record personal.

### Azul Cian `#18A0E8`

- Progreso.
- Temporizador.
- Confirmacion de respuesta correcta.
- Conexiones correctas en actividades de relacionar.
- Bordes activos de inputs.

### Naranja `#F05800`

- Bonus.
- Energia visual.
- Llamadas de atencion.
- Botones secundarios destacados.
- Avisos pedagogicos no punitivos.

### Negro `#101014`

- Texto principal.
- Pantallas de celebracion de alto contraste.
- Cabeceras compactas en modo juego.

### Blanco `#FFFFFF`

- Fondo principal.
- Superficies de lectura.
- Tarjetas de profesor.
- Texto sobre fondos negros o saturados.

## Reglas de Composicion

- No usar colores fuera de la paleta corporativa.
- No introducir verde para aciertos ni rojo para errores.
- El acierto se comunica con azul cian, iconografia y sonido.
- El error o reintento se comunica con naranja, microanimacion y texto breve.
- El record se comunica con fondo negro, texto blanco y confeti purpura, cian y naranja.
- Las pantallas de lectura deben priorizar blanco y negro para no cansar.
- Las pantallas de juego pueden usar bloques grandes de purpura, cian y naranja.

## Tokens Recomendados

```css
:root {
  --color-action-primary: var(--brand-purple);
  --color-action-secondary: var(--brand-orange);
  --color-focus: var(--brand-cyan);
  --color-success: var(--brand-cyan);
  --color-warning: var(--brand-orange);
  --color-record: var(--brand-purple);
  --color-text: var(--brand-black);
  --color-background: var(--brand-white);
}
```

## Componentes

- Boton principal: fondo purpura, texto blanco.
- Boton secundario: fondo naranja, texto blanco.
- Campo activo: borde cian, texto negro.
- Barra de progreso: relleno cian sobre pista blanca o negra.
- Tarjeta seleccionada: fondo negro, borde cian, texto blanco.
- Tarjeta de opcion: fondo blanco, borde purpura/cian/naranja alternado.
- Nuevo record: fondo negro, titular blanco, numeros en naranja, confeti tricolor.

