# Arquitectura de Interfaz de Juegos

La interfaz combina estructura pedagogica tipo JClic con dinamismo tipo Kahoot, usando exclusivamente la paleta de marca: purpura/magenta vibrante, azul cian brillante, naranja saturado, negro y blanco.

## Tokens Visuales de Marca

Paleta extraida del logo corporativo `www-afaescolasantsalvador-org.png`.

```css
:root {
  --brand-purple: #c000d8;
  --brand-cyan: #18a0e8;
  --brand-orange: #f05800;
  --brand-black: #101014;
  --brand-white: #ffffff;

  --feedback-correct: var(--brand-cyan);
  --feedback-warning: var(--brand-orange);
  --feedback-record: var(--brand-purple);
  --text-primary: var(--brand-black);
  --surface-primary: var(--brand-white);
}
```

Reglas de uso:

- Fondo principal de paneles: blanco.
- Texto principal: negro.
- Acciones principales: purpura.
- Estados activos y progreso: azul cian.
- Celebraciones, bonus y llamadas especiales: naranja.
- Pantallas de juego intensas: fondo negro con piezas purpura, cian y naranja.
- No se introducen verdes, rojos, amarillos ni degradados externos a la marca.

## Principios UX Educativos

- Una instruccion corta por pantalla.
- Interacciones grandes, tactiles y tolerantes al error.
- Feedback inmediato, positivo y claro.
- Evitar castigos visuales agresivos: el error indica reintento o correccion, no fracaso.
- Progreso siempre visible.
- Record personal como motivacion individual, no comparacion publica obligatoria.

## Estructura General

```txt
GameShell
├── GameHeader
│   ├── StudentBadge
│   ├── ScoreCounter
│   ├── TimerBar
│   └── ProgressDots
│
├── InstructionStrip
│
├── GameStage
│   ├── MatchingActivity
│   ├── FillBlanksActivity
│   └── BasicTypingActivity
│
├── FeedbackLayer
│   ├── InstantResult
│   ├── ComboBurst
│   ├── ScorePop
│   └── NewRecordCelebration
│
└── GameControls
    ├── CheckButton
    ├── NextButton
    └── ExitButton
```

`GameShell` se encarga de:

- cargar juego y version,
- seleccionar alumno si es modo aula,
- iniciar temporizador,
- recibir respuestas,
- validar actividad,
- calcular puntuacion parcial,
- emitir feedback visual y sonoro,
- guardar intento,
- comparar record personal,
- mostrar resultado final.

Cada actividad se encarga solo de su mecanica.

## Flujo de Pantallas

### 1. Seleccion de Alumno en Modo Aula

```txt
┌──────────────────────────────────────────────┐
│ ¿Quien juega ahora?                          │
│                                              │
│ [ Buscar por nombre o correo              ]  │
│                                              │
│  Ana Garcia        3ºA                       │
│  Marcos Lopez      3ºA                       │
│  Lucia Perez       3ºA                       │
│                                              │
│                         [ Empezar juego ]    │
└──────────────────────────────────────────────┘
```

Diseño:

- Fondo blanco.
- Barra superior purpura.
- Campo de busqueda con borde azul cian.
- Alumno seleccionado con fondo negro, texto blanco y acento naranja.
- Boton principal purpura.

### 2. Preparacion

```txt
┌──────────────────────────────────────────────┐
│ Mision de lengua                             │
│ Relaciona cada palabra con su significado.   │
│                                              │
│                [ Empezar ]                   │
└──────────────────────────────────────────────┘
```

Diseño:

- Titulo negro grande.
- Iconografia simple usando solo los tres colores de marca.
- Boton de empezar naranja o purpura segun contexto.

### 3. Juego Activo

```txt
┌──────────────────────────────────────────────┐
│ Ana      840 pts      ███████░░░      00:42  │
├──────────────────────────────────────────────┤
│ Relaciona cada animal con su habitat.        │
│                                              │
│ [ Pez      ]       [ Bosque    ]             │
│ [ Conejo   ]       [ Mar       ]             │
│ [ Aguila   ]       [ Cielo     ]             │
│                                              │
│                         [ Comprobar ]        │
└──────────────────────────────────────────────┘
```

Diseño:

- Header compacto, muy legible.
- Barra de tiempo azul cian.
- Puntuacion con contador animado naranja.
- Tarjetas alternando purpura, cian y naranja.
- Fondo blanco para actividades de lectura.
- Fondo negro opcional para rondas especiales o pantalla de record.

### 4. Resultado

```txt
┌──────────────────────────────────────────────┐
│ ¡Buen trabajo, Ana!                          │
│                                              │
│ Puntuacion: 1240                             │
│ Aciertos: 8/10                               │
│ Tiempo: 01:12                                │
│                                              │
│ [ Jugar otra vez ] [ Volver ]                │
└──────────────────────────────────────────────┘
```

### 5. Nuevo Record

```txt
┌──────────────────────────────────────────────┐
│ ¡NUEVO RECORD PERSONAL!                      │
│                                              │
│ Antes: 980                                   │
│ Ahora: 1240                                  │
│                                              │
│ Confeti purpura, azul cian y naranja         │
│                                              │
│ [ Otra ronda ]                               │
└──────────────────────────────────────────────┘
```

Diseño:

- Fondo negro.
- Texto blanco.
- Explosiones visuales en purpura, cian y naranja.
- Sonido breve de celebracion.
- Animacion de puntuacion subiendo.

## Componentes por Tipo de Juego

### MatchingActivity

Objetivo: unir pares.

```txt
MatchingActivity
├── LeftColumn
├── RightColumn
├── ConnectionCanvas
└── MatchValidator
```

Estados:

- `idle`: tarjeta blanca con borde de color.
- `selected`: tarjeta negra con borde cian.
- `connected`: linea entre elementos.
- `correct`: pulso cian.
- `wrong`: vibracion corta y borde naranja.
- `completed`: bloqueo de respuesta y suma de puntos.

Regla visual recomendada:

- Origenes en purpura.
- Destinos en cian.
- Lineas correctas en cian.
- Correcciones o avisos en naranja.

### FillBlanksActivity

Objetivo: completar textos con palabras.

```txt
FillBlanksActivity
├── TextRenderer
├── BlankDropZone
├── WordBank
└── FillValidator
```

Variantes:

- 1º-3º: arrastrar palabras.
- 4º-6º: desplegable o escritura corta.

Estados:

- Hueco vacio: borde punteado purpura.
- Palabra arrastrable: tarjeta naranja.
- Hueco completado: fondo cian suave sobre blanco.
- Error: borde naranja, mensaje breve.

### BasicTypingActivity

Objetivo: escribir una respuesta sencilla.

```txt
BasicTypingActivity
├── PromptCard
├── AnswerInput
├── KeyboardAssist
└── TypingValidator
```

Reglas:

- Input grande.
- Validacion tolerante a mayusculas, espacios y tildes cuando el profesor lo configure.
- Respuestas aceptadas multiples.
- Feedback inmediato al comprobar.

Diseño:

- Pregunta en negro sobre blanco.
- Input con borde cian.
- Boton comprobar purpura.
- Bonus de rapidez en naranja.

## Arquitectura Frontend Recomendada

```txt
app/
  teacher/
    dashboard/
    classes/
    students/
    games/
    reports/
  student/
    dashboard/
    games/
    records/
  play/
    [gameId]/

components/
  brand/
    BrandButton.tsx
    BrandCard.tsx
    BrandProgress.tsx
  game/
    GameShell.tsx
    GameHeader.tsx
    GameStage.tsx
    GameControls.tsx
    FeedbackLayer.tsx
    NewRecordCelebration.tsx
  activities/
    MatchingActivity.tsx
    FillBlanksActivity.tsx
    BasicTypingActivity.tsx

lib/
  game-engine/
    scoring.ts
    validators.ts
    records.ts
    normalize-answer.ts
  db/
    schema.ts
    queries.ts
```

## Contrato de Actividad

Todas las actividades deberian compartir una interfaz similar.

```ts
export type ActivityResult = {
  itemId: string;
  answerGiven: unknown;
  isCorrect: boolean;
  responseTimeMs: number;
};

export type ActivityController = {
  start: () => void;
  submitAnswer: (itemId: string, answer: unknown) => ActivityResult;
  complete: () => ActivityResult[];
  reset: () => void;
};
```

## Motor de Juego

Responsabilidades:

```txt
GameEngine
├── loadGameVersion()
├── startAttempt()
├── trackTime()
├── validateAnswer()
├── calculateLiveScore()
├── completeAttempt()
├── persistAttempt()
├── comparePersonalRecord()
└── emitCelebrationState()
```

## Accesibilidad y Primaria

- Tamaño minimo de objetivo tactil: 44x44 px.
- Texto principal minimo: 18 px en actividades.
- Contraste alto con blanco o negro.
- Sonidos siempre acompañados de feedback visual.
- Animaciones breves y no bloqueantes.
- Botones con icono y texto en edades tempranas.
- Evitar depender solo del color para indicar acierto o error.
