import { BrandLogo } from "@/components/BrandLogo";

type Props = {
  title?: string;
  message?: string;
  variant?: "default" | "teacher" | "student" | "game";
};

export function LoadingState({
  title = "Carregant AFAJICS",
  message = "En Jic està preparant la pantalla.",
  variant = "default"
}: Props) {
  return (
    <main className={`page loading-page loading-${variant}`} aria-live="polite" aria-busy="true">
      <div className="shell">
        <section className="loading-panel">
          <BrandLogo label={title} />
          <div className="loading-jic" aria-hidden="true">
            <div className="loading-eye left" />
            <div className="loading-eye right" />
            <div className="loading-smile" />
          </div>
          <p className="loading-message">{message}</p>
          <div className="loading-bar">
            <span />
          </div>
          <div className="loading-skeleton-grid">
            <div className="loading-skeleton tall" />
            <div className="loading-skeleton" />
            <div className="loading-skeleton" />
          </div>
        </section>
      </div>
    </main>
  );
}
