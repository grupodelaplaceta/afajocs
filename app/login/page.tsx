import Link from "next/link";
import { loginAction } from "@/lib/actions";
import { BrandLogo } from "@/components/BrandLogo";

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
              <label htmlFor="email">Correo</label>
              <input id="email" name="email" type="email" required />
            </div>
            <div className="field">
              <label htmlFor="password">Contraseña</label>
              <input id="password" name="password" type="password" minLength={8} required />
            </div>
            <button className="button" type="submit">
              Iniciar sesion
            </button>
          </form>
          <p className="muted">
            ¿No tienes cuenta? <Link href="/register">Crear cuenta</Link>
          </p>
        </div>
      </div>
    </main>
  );
}
