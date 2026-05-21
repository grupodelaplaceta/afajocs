import { model, models, Schema, type InferSchemaType, type Model } from "mongoose";

const userSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    role: { type: String, required: true, enum: ["teacher", "student", "admin"] }
  },
  { timestamps: true }
);

const teacherSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    schoolName: { type: String, trim: true }
  },
  { timestamps: true }
);

const studentSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", unique: true, sparse: true },
    teacherOwnerId: { type: Schema.Types.ObjectId, ref: "Teacher", required: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    avatarKey: { type: String, default: "purple" },
    gradeLevel: { type: Number, min: 1, max: 6, required: true }
  },
  { timestamps: true }
);

const classSchema = new Schema(
  {
    teacherId: { type: Schema.Types.ObjectId, ref: "Teacher", required: true },
    name: { type: String, required: true, trim: true },
    gradeLevel: { type: Number, min: 1, max: 6 },
    gradeLevels: [{ type: Number, min: 1, max: 6 }],
    colorTheme: { type: String, default: "brand-purple" },
    studentIds: [{ type: Schema.Types.ObjectId, ref: "Student" }]
  },
  { timestamps: true }
);

const gameSchema = new Schema(
  {
    teacherId: { type: Schema.Types.ObjectId, ref: "Teacher", required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    type: { type: String, required: true, enum: ["matching", "fill_blanks", "basic_typing", "word_search"] },
    subject: { type: String, required: true, trim: true },
    gradeMin: { type: Number, min: 1, max: 6, required: true },
    gradeMax: { type: Number, min: 1, max: 6, required: true },
    difficulty: { type: String, required: true, enum: ["easy", "medium", "hard"] },
    estimatedTimeSeconds: { type: Number, default: 90 },
    isPublished: { type: Boolean, default: true },
    content: { type: Schema.Types.Mixed, required: true },
    version: { type: Number, default: 1 }
  },
  { timestamps: true }
);

const attemptSchema = new Schema(
  {
    gameId: { type: Schema.Types.ObjectId, ref: "Game", required: true },
    studentId: { type: Schema.Types.ObjectId, ref: "Student", required: true },
    teacherId: { type: Schema.Types.ObjectId, ref: "Teacher" },
    mode: { type: String, required: true, enum: ["classroom", "remote"] },
    score: { type: Number, required: true },
    correctAnswers: { type: Number, required: true },
    wrongAnswers: { type: Number, required: true },
    totalItems: { type: Number, required: true },
    timeSpentSeconds: { type: Number, required: true },
    speedBonus: { type: Number, default: 0 },
    accuracyBonus: { type: Number, default: 0 },
    events: [
      {
        itemId: String,
        answerGiven: Schema.Types.Mixed,
        isCorrect: Boolean,
        responseTimeMs: Number
      }
    ]
  },
  { timestamps: true }
);

const recordSchema = new Schema(
  {
    studentId: { type: Schema.Types.ObjectId, ref: "Student", required: true },
    gameId: { type: Schema.Types.ObjectId, ref: "Game", required: true },
    bestScore: { type: Number, required: true },
    bestTimeSeconds: { type: Number, required: true },
    bestAttemptId: { type: Schema.Types.ObjectId, ref: "GameAttempt", required: true },
    achievedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

recordSchema.index({ studentId: 1, gameId: 1 }, { unique: true });

export type UserDoc = InferSchemaType<typeof userSchema>;
export type TeacherDoc = InferSchemaType<typeof teacherSchema>;
export type StudentDoc = InferSchemaType<typeof studentSchema>;
export type ClassDoc = InferSchemaType<typeof classSchema>;
export type GameDoc = InferSchemaType<typeof gameSchema>;
export type AttemptDoc = InferSchemaType<typeof attemptSchema>;
export type RecordDoc = InferSchemaType<typeof recordSchema>;

export const User = (models.User as Model<UserDoc>) || model("User", userSchema);
export const Teacher = (models.Teacher as Model<TeacherDoc>) || model("Teacher", teacherSchema);
export const Student = (models.Student as Model<StudentDoc>) || model("Student", studentSchema);
export const ClassGroup = (models.ClassGroup as Model<ClassDoc>) || model("ClassGroup", classSchema);
export const Game = (models.Game as Model<GameDoc>) || model("Game", gameSchema);
export const GameAttempt =
  (models.GameAttempt as Model<AttemptDoc>) || model("GameAttempt", attemptSchema);
export const StudentGameRecord =
  (models.StudentGameRecord as Model<RecordDoc>) ||
  model("StudentGameRecord", recordSchema);
