import { LoadingState } from "@/components/LoadingState";

export default function GamesLoading() {
  return (
    <LoadingState
      variant="default"
      title="Carregant biblioteca"
      message="En Jic està ordenant els Jics publicats."
    />
  );
}
