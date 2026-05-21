import Link from "next/link";
import { Trophy } from "lucide-react";
import { JicGuide } from "@/components/JicGuide";

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
          <h1>NOU RÈCORD PERSONAL!</h1>
          <p style={{ color: "#f05800", fontSize: "3rem", fontWeight: 900 }}>{score} punts</p>
          <JicGuide compact tone="orange" message="Uau! Has superat el teu rècord personal. Vols provar una altra ronda?" />
          <Link className="button secondary" href={`/play/${gameId}`}>
            Una altra ronda
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
          <p className="eyebrow">Partida desada</p>
          <h1 style={{ color: "#101014" }}>Bona feina!</h1>
          <p style={{ color: "#f05800", fontSize: "2.5rem", fontWeight: 900 }}>{score} punts</p>
          <JicGuide compact tone="cyan" message="Puntuació guardada. Pots tornar a jugar per millorar temps, encerts i punts." />
          <Link className="button" href={`/play/${gameId}`}>
            Tornar a jugar
          </Link>
        </section>
      </div>
    </main>
  );
}
