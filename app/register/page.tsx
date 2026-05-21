import Link from "next/link";
import { registerAction } from "@/lib/actions";
import { BrandLogo } from "@/components/BrandLogo";
import { SubmitButton } from "@/components/SubmitButton";

export default function RegisterPage() {
  return (
    <main className="page">
      <div className="shell" style={{ maxWidth: 560 }}>
        <div className="panel">
          <div style={{ marginBottom: 20 }}>
            <BrandLogo label="Crear compte" />
          </div>
          <form className="form" action={registerAction}>
            <div className="field">
              <label htmlFor="name">Nom</label>
              <input id="name" name="name" required />
            </div>
            <div className="field">
              <label htmlFor="email">Correu</label>
              <input id="email" name="email" type="email" required />
            </div>
            <div className="field">
              <label htmlFor="password">Contrasenya</label>
              <input id="password" name="password" type="password" minLength={8} required />
            </div>
            <div className="field">
              <label htmlFor="role">Tipus de compte</label>
              <select id="role" name="role" defaultValue="teacher">
                <option value="teacher">Professor</option>
                <option value="student">Alumne</option>
              </select>
            </div>
            <SubmitButton pendingText="Creant compte..." className="button secondary">
              Crear compte segur
            </SubmitButton>
          </form>
          <p className="muted">
            Ja tens compte? <Link href="/login">Inicia sessió</Link>
          </p>
        </div>
      </div>
    </main>
  );
}
