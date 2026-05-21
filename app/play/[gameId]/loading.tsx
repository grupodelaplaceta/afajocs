import { LoadingState } from "@/components/LoadingState";

export default function PlayLoading() {
  return (
    <LoadingState
      variant="game"
      title="Preparant el Jic"
      message="En Jic està carregant la partida, la música i els rècords."
    />
  );
}
