import { LoadingState } from "@/components/LoadingState";

export default function StudentLoading() {
  return (
    <LoadingState
      variant="student"
      title="Carregant els teus Jics"
      message="En Jic està mirant els teus deures, punts i rècords."
    />
  );
}
