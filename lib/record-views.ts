import { ClassGroup, StudentGameRecord } from "@/lib/models";

export async function getGameRecordViews(gameId: string, teacherId?: unknown, studentId?: string) {
  const records = await StudentGameRecord.find({ gameId })
    .populate("studentId", "name email")
    .sort({ bestScore: -1, bestTimeSeconds: 1 })
    .lean();

  const classes = teacherId
    ? await ClassGroup.find({ teacherId }).sort({ name: 1 }).lean()
    : await ClassGroup.find({ studentIds: studentId }).sort({ name: 1 }).lean();

  const plainRecords = records.map((record: any) => ({
    studentId: record.studentId?._id?.toString() || record.studentId?.toString(),
    studentName: record.studentId?.name || "Alumno",
    studentEmail: record.studentId?.email || "",
    bestScore: record.bestScore,
    bestTimeSeconds: record.bestTimeSeconds,
    achievedAt: record.achievedAt
  }));

  const classRecords = classes.map((group: any) => {
    const studentIds = new Set((group.studentIds || []).map((id: unknown) => String(id)));
    const best = plainRecords.find((record) => studentIds.has(record.studentId));

    return {
      classId: group._id.toString(),
      className: group.name,
      gradeLevels: group.gradeLevels?.length ? group.gradeLevels : group.gradeLevel ? [group.gradeLevel] : [],
      bestScore: best?.bestScore || 0,
      bestTimeSeconds: best?.bestTimeSeconds || null,
      studentName: best?.studentName || null
    };
  });

  const personalRecord = studentId
    ? plainRecords.find((record) => record.studentId === studentId) || null
    : null;

  return {
    records: plainRecords,
    personalRecord,
    classRecords,
    globalRecord: plainRecords[0] || null
  };
}

