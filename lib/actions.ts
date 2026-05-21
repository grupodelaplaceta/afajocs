"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { clearSession, createSession, findUserForLogin, getTeacherByUserId, hashPassword, requireUser, verifyPassword } from "@/lib/auth";
import { connectDb } from "@/lib/db";
import { demoGameContent } from "@/lib/demo-content";
import { parseImportedGame } from "@/lib/game-import";
import { calculateScore } from "@/lib/scoring";
import { ClassGroup, Game, GameAttempt, Student, StudentGameRecord, Teacher, User } from "@/lib/models";

const authSchema = z.object({
  name: z.string().min(2).max(160).optional(),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(["teacher", "student"]).default("teacher")
});

export async function registerAction(formData: FormData) {
  const parsed = authSchema.parse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    role: formData.get("role") || "teacher"
  });

  await connectDb();
  const email = parsed.email.toLowerCase().trim();
  const existing = await User.findOne({ email });

  if (existing) {
    throw new Error("Ya existe un usuario con este correo.");
  }

  const user = await User.create({
    email,
    passwordHash: await hashPassword(parsed.password),
    name: parsed.name || email.split("@")[0],
    role: parsed.role
  });

  if (parsed.role === "teacher") {
    await Teacher.create({
      userId: user._id,
      schoolName: "AFA Escola Sant Salvador"
    });
  } else {
    const student = await Student.findOne({ email });
    if (student) {
      student.userId = user._id as never;
      await student.save();
    }
  }

  await createSession({
    id: user._id.toString(),
    email: user.email,
    name: user.name,
    role: user.role as "teacher" | "student" | "admin"
  });

  redirect(parsed.role === "teacher" ? "/teacher" : "/student");
}

export async function loginAction(formData: FormData) {
  const parsed = authSchema.omit({ name: true, role: true }).parse({
    email: formData.get("email"),
    password: formData.get("password")
  });

  const user = await findUserForLogin(parsed.email);
  if (!user || !(await verifyPassword(parsed.password, user.passwordHash))) {
    throw new Error("Correo o contraseña incorrectos.");
  }

  await createSession({
    id: user._id.toString(),
    email: user.email,
    name: user.name,
    role: user.role as "teacher" | "student" | "admin"
  });

  redirect(user.role === "teacher" ? "/teacher" : "/student");
}

export async function logoutAction() {
  await clearSession();
  redirect("/login");
}

const classSchema = z.object({
  name: z.string().min(2).max(120),
  gradeLevels: z.array(z.coerce.number().min(1).max(6)).min(1)
});

export async function createClassAction(formData: FormData) {
  const session = await requireUser("teacher");
  const parsed = classSchema.parse({
    name: formData.get("name"),
    gradeLevels: formData.getAll("gradeLevels")
  });
  const teacher = await getTeacherByUserId(session.id);
  if (!teacher) {
    throw new Error("Perfil de profesor no encontrado.");
  }

  await ClassGroup.create({
    teacherId: teacher._id,
    name: parsed.name,
    gradeLevel: parsed.gradeLevels[0],
    gradeLevels: parsed.gradeLevels,
    studentIds: []
  });

  revalidatePath("/teacher");
}

const studentSchema = z.object({
  name: z.string().min(2).max(160),
  email: z.string().email(),
  gradeLevel: z.coerce.number().min(1).max(6),
  classId: z.string().optional()
});

export async function createStudentAction(formData: FormData) {
  const session = await requireUser("teacher");
  const parsed = studentSchema.parse({
    name: formData.get("name"),
    email: formData.get("email"),
    gradeLevel: formData.get("gradeLevel"),
    classId: formData.get("classId") || undefined
  });
  const teacher = await getTeacherByUserId(session.id);
  if (!teacher) {
    throw new Error("Perfil de profesor no encontrado.");
  }

  const student = await Student.findOneAndUpdate(
    { email: parsed.email.toLowerCase().trim() },
    {
      $setOnInsert: {
        teacherOwnerId: teacher._id,
        name: parsed.name,
        email: parsed.email.toLowerCase().trim(),
        gradeLevel: parsed.gradeLevel
      }
    },
    { upsert: true, new: true }
  );

  if (parsed.classId) {
    await ClassGroup.findOneAndUpdate(
      { _id: parsed.classId, teacherId: teacher._id },
      { $addToSet: { studentIds: student._id } }
    );
  }

  revalidatePath("/teacher");
  revalidatePath("/games");
}

const gameSchema = z.object({
  title: z.string().min(3).max(180),
  subject: z.string().min(2).max(80),
  type: z.enum(["matching", "fill_blanks", "basic_typing"]),
  gradeMin: z.coerce.number().min(1).max(6),
  gradeMax: z.coerce.number().min(1).max(6),
  difficulty: z.enum(["easy", "medium", "hard"])
});

export async function createGameAction(formData: FormData) {
  const session = await requireUser("teacher");
  const parsed = gameSchema.parse({
    title: formData.get("title"),
    subject: formData.get("subject"),
    type: formData.get("type"),
    gradeMin: formData.get("gradeMin"),
    gradeMax: formData.get("gradeMax"),
    difficulty: formData.get("difficulty")
  });
  const teacher = await getTeacherByUserId(session.id);
  if (!teacher) {
    throw new Error("Perfil de profesor no encontrado.");
  }

  await Game.create({
    teacherId: teacher._id,
    title: parsed.title,
    subject: parsed.subject,
    type: parsed.type,
    gradeMin: parsed.gradeMin,
    gradeMax: parsed.gradeMax,
    difficulty: parsed.difficulty,
    estimatedTimeSeconds: 90,
    content: demoGameContent[parsed.type]
  });

  revalidatePath("/teacher");
  revalidatePath("/games");
}

export async function importGameAction(formData: FormData) {
  const session = await requireUser("teacher");
  const rawGame = String(formData.get("gameImport") || "");
  const teacher = await getTeacherByUserId(session.id);
  if (!teacher) {
    throw new Error("Perfil de profesor no encontrado.");
  }

  const imported = parseImportedGame(rawGame);

  await Game.create({
    teacherId: teacher._id,
    title: imported.title,
    subject: imported.subject,
    type: imported.type,
    gradeMin: imported.gradeMin,
    gradeMax: imported.gradeMax,
    difficulty: imported.difficulty,
    estimatedTimeSeconds: imported.estimatedTimeSeconds,
    isPublished: true,
    content: imported.content
  });

  revalidatePath("/teacher");
  revalidatePath("/games");
}

const attemptSchema = z.object({
  gameId: z.string(),
  studentId: z.string(),
  mode: z.enum(["classroom", "remote"]),
  correctAnswers: z.coerce.number().min(0),
  wrongAnswers: z.coerce.number().min(0),
  totalItems: z.coerce.number().min(1),
  timeSpentSeconds: z.coerce.number().min(1),
  timeLimitSeconds: z.coerce.number().min(1)
});

export async function saveAttemptAction(formData: FormData) {
  const parsed = attemptSchema.parse({
    gameId: formData.get("gameId"),
    studentId: formData.get("studentId"),
    mode: formData.get("mode"),
    correctAnswers: formData.get("correctAnswers"),
    wrongAnswers: formData.get("wrongAnswers"),
    totalItems: formData.get("totalItems"),
    timeSpentSeconds: formData.get("timeSpentSeconds"),
    timeLimitSeconds: formData.get("timeLimitSeconds")
  });

  await connectDb();
  const game = await Game.findById(parsed.gameId);
  if (!game) {
    throw new Error("Juego no encontrado.");
  }

  const scoreData = calculateScore(parsed);
  const attempt = await GameAttempt.create({
    gameId: parsed.gameId,
    studentId: parsed.studentId,
    teacherId: game.teacherId,
    mode: parsed.mode,
    score: scoreData.score,
    correctAnswers: parsed.correctAnswers,
    wrongAnswers: parsed.wrongAnswers,
    totalItems: parsed.totalItems,
    timeSpentSeconds: parsed.timeSpentSeconds,
    speedBonus: scoreData.speedBonus,
    accuracyBonus: scoreData.accuracyBonus,
    events: []
  });

  const previous = await StudentGameRecord.findOne({
    studentId: parsed.studentId,
    gameId: parsed.gameId
  });

  const isNewRecord =
    !previous ||
    scoreData.score > previous.bestScore ||
    (scoreData.score === previous.bestScore &&
      parsed.timeSpentSeconds < previous.bestTimeSeconds);

  if (isNewRecord) {
    await StudentGameRecord.findOneAndUpdate(
      { studentId: parsed.studentId, gameId: parsed.gameId },
      {
        studentId: parsed.studentId,
        gameId: parsed.gameId,
        bestScore: scoreData.score,
        bestTimeSeconds: parsed.timeSpentSeconds,
        bestAttemptId: attempt._id,
        achievedAt: new Date()
      },
      { upsert: true }
    );
  }

  redirect(`/play/${parsed.gameId}/result?score=${scoreData.score}&record=${isNewRecord ? "1" : "0"}`);
}
