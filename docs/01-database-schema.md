# Esquema de Base de Datos

Plataforma educativa gamificada para primaria, con roles de profesor y alumno, modo aula sin login por alumno, modo casa con login, actividades tipo JClic y feedback visual estilo Kahoot usando exclusivamente la paleta de marca.

## Principios del Modelo

- El correo del alumno es el identificador estable entre el modo aula y el modo casa.
- Un alumno puede existir primero como perfil creado por un profesor y, más tarde, enlazarse a una cuenta de usuario si inicia sesion desde casa.
- Las actividades se versionan para que los resultados historicos no cambien si el profesor edita un juego.
- Los intentos registran puntuacion, tiempo y detalle de respuestas.
- Los records personales se guardan en una tabla dedicada para consulta rapida.

## Tablas Principales

### users

Usuarios con capacidad de iniciar sesion.

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash TEXT,
  name VARCHAR(160) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('teacher', 'student', 'admin')),
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);
```

### teachers

Perfil ampliado del profesor.

```sql
CREATE TABLE teachers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  school_name VARCHAR(180),
  created_at TIMESTAMP NOT NULL DEFAULT now()
);
```

### students

Perfil academico del alumno. Puede o no estar enlazado a un usuario con login.

```sql
CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES users(id) ON DELETE SET NULL,
  teacher_owner_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  name VARCHAR(160) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  avatar_key VARCHAR(80),
  grade_level INT NOT NULL CHECK (grade_level BETWEEN 1 AND 6),
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);
```

### classes

Grupos o clases creadas por un profesor.

```sql
CREATE TABLE classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  name VARCHAR(120) NOT NULL,
  grade_level INT CHECK (grade_level BETWEEN 1 AND 6),
  color_theme VARCHAR(20) NOT NULL DEFAULT 'brand-purple',
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);
```

### class_students

Relacion entre clases y alumnos.

```sql
CREATE TABLE class_students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  joined_at TIMESTAMP NOT NULL DEFAULT now(),
  UNIQUE (class_id, student_id)
);
```

## Juegos y Contenido

### games

Metadatos de cada actividad.

```sql
CREATE TABLE games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  title VARCHAR(180) NOT NULL,
  description TEXT,
  type VARCHAR(30) NOT NULL CHECK (type IN ('matching', 'fill_blanks', 'basic_typing')),
  subject VARCHAR(80) NOT NULL,
  grade_min INT NOT NULL CHECK (grade_min BETWEEN 1 AND 6),
  grade_max INT NOT NULL CHECK (grade_max BETWEEN 1 AND 6),
  difficulty VARCHAR(20) NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  estimated_time_seconds INT NOT NULL DEFAULT 90,
  is_published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now(),
  CHECK (grade_min <= grade_max)
);
```

### game_versions

Contenido versionado del juego.

```sql
CREATE TABLE game_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  version_number INT NOT NULL,
  content_json JSONB NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  UNIQUE (game_id, version_number)
);
```

Ejemplo para `matching`:

```json
{
  "instructions": "Relaciona cada animal con su habitat.",
  "settings": {
    "timeLimitSeconds": 90,
    "shuffle": true,
    "instantFeedback": true
  },
  "pairs": [
    {
      "id": "pair-1",
      "left": { "type": "text", "value": "Pez" },
      "right": { "type": "text", "value": "Mar" }
    }
  ]
}
```

Ejemplo para `fill_blanks`:

```json
{
  "instructions": "Completa las frases.",
  "settings": {
    "timeLimitSeconds": 120,
    "interaction": "drag"
  },
  "text": "El {{blank:1}} vive en el mar.",
  "blanks": [
    {
      "id": "blank-1",
      "answer": "delfin",
      "displayAnswer": "delfin"
    }
  ],
  "wordBank": ["delfin", "camello", "aguila"]
}
```

Ejemplo para `basic_typing`:

```json
{
  "instructions": "Escribe la respuesta correcta.",
  "settings": {
    "timeLimitSeconds": 60,
    "caseSensitive": false,
    "accentSensitive": false,
    "trimWhitespace": true
  },
  "prompts": [
    {
      "id": "prompt-1",
      "question": "Cuanto es 7 + 5?",
      "acceptedAnswers": ["12", "doce"]
    }
  ]
}
```

## Sesiones, Intentos y Records

### game_sessions

Ejecucion concreta de un juego, presencial o remota.

```sql
CREATE TABLE game_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  game_version_id UUID NOT NULL REFERENCES game_versions(id),
  class_id UUID REFERENCES classes(id) ON DELETE SET NULL,
  teacher_id UUID REFERENCES teachers(id) ON DELETE SET NULL,
  mode VARCHAR(20) NOT NULL CHECK (mode IN ('classroom', 'remote')),
  started_at TIMESTAMP NOT NULL DEFAULT now(),
  ended_at TIMESTAMP
);
```

### game_attempts

Resultado de una partida individual.

```sql
CREATE TABLE game_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES game_sessions(id) ON DELETE SET NULL,
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  game_version_id UUID NOT NULL REFERENCES game_versions(id),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  score INT NOT NULL,
  correct_answers INT NOT NULL,
  wrong_answers INT NOT NULL,
  total_items INT NOT NULL,
  time_spent_seconds INT NOT NULL,
  speed_bonus INT NOT NULL DEFAULT 0,
  accuracy_bonus INT NOT NULL DEFAULT 0,
  completed BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);
```

### answer_events

Detalle pedagogico de cada respuesta.

```sql
CREATE TABLE answer_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id UUID NOT NULL REFERENCES game_attempts(id) ON DELETE CASCADE,
  item_id VARCHAR(80) NOT NULL,
  answer_given JSONB NOT NULL,
  is_correct BOOLEAN NOT NULL,
  response_time_ms INT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);
```

### student_game_records

Record personal por alumno y juego.

```sql
CREATE TABLE student_game_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  best_score INT NOT NULL,
  best_time_seconds INT NOT NULL,
  best_attempt_id UUID NOT NULL REFERENCES game_attempts(id) ON DELETE CASCADE,
  achieved_at TIMESTAMP NOT NULL DEFAULT now(),
  UNIQUE (student_id, game_id)
);
```

## Formula Inicial de Puntuacion

```txt
base_score = correct_answers * 100
penalty = wrong_answers * 25
speed_bonus = max(0, time_limit_seconds - time_spent_seconds) * 2
accuracy_bonus = 300 si correct_answers == total_items

score = max(0, base_score - penalty + speed_bonus + accuracy_bonus)
```

Al finalizar un intento:

1. Se guarda `game_attempts`.
2. Se guardan los `answer_events`.
3. Se consulta `student_game_records`.
4. Si no existe record o `score > best_score`, se actualiza.
5. Si hay empate de puntos, puede usarse `time_spent_seconds < best_time_seconds` como desempate.

