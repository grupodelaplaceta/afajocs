import Link from "next/link";
import { loginAction } from "@/lib/actions";
import { BrandLogo } from "@/components/BrandLogo";
import { SubmitButton } from "@/components/SubmitButton";

export default function LoginPage() {
  return (
    <main className="page">
      <div className="shell" style={{ maxWidth: 520 }}>
        <div className="panel">
          <div style={{ marginBottom: 20 }}>
            <BrandLogo label="Entrar" />
          </div>
          <form className="form" action={loginAction}>
            <div className="field">
              <label htmlFor="email">Correu</label>
              <input id="email" name="email" type="email" required />
            </div>
            <div className="field">
              <label htmlFor="password">Contrasenya</label>
              <input id="password" name="password" type="password" minLength={8} required />
            </div>
            <SubmitButton pendingText="Entrant..." className="button">
              Inicia sessió
            </SubmitButton>
          </form>
          <p className="muted">
            No tens compte? <Link href="/register">Crea un compte</Link>
          </p>
        </div>
      </div>
    </main>
  );
}
