import { LoadingState } from "@/components/LoadingState";

export default function TeacherLoading() {
  return (
    <LoadingState
      variant="teacher"
      title="Carregant quadern"
      message="En Jic està reunint alumnes, grups, punts i reptes."
    />
  );
}
