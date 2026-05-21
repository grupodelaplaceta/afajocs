import Link from "next/link";
import { Trophy } from "lucide-react";

export default async function ResultPage({
  params,
  searchParams
}: {
  params: Promise<{ gameId: string }>;
  searchParams: Promise<{ score?: string; record?: string }>;
}) {
  const { gameId } = await params;
  const query = await searchParams;
  const isRecord = query.record === "1";
  const score = query.score || "0";

  if (isRecord) {
    return (
      <main className="record-screen">
        <section>
          <Trophy color="#f05800" size={82} />
          <p className="eyebrow">AFAJICS</p>
          <h1>¡NUEVO RECORD PERSONAL!</h1>
          <p style={{ color: "#f05800", fontSize: "3rem", fontWeight: 900 }}>{score} puntos</p>
          <Link className="button secondary" href={`/play/${gameId}`}>
            Otra ronda
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="page">
      <div className="shell" style={{ maxWidth: 720 }}>
        <section className="panel" style={{ textAlign: "center" }}>
          <Trophy color="#18a0e8" size={72} />
          <p className="eyebrow">Partida guardada</p>
          <h1 style={{ color: "#101014" }}>¡Buen trabajo!</h1>
          <p style={{ color: "#f05800", fontSize: "2.5rem", fontWeight: 900 }}>{score} puntos</p>
          <Link className="button" href={`/play/${gameId}`}>
            Jugar otra vez
          </Link>
        </section>
      </div>
    </main>
  );
}

