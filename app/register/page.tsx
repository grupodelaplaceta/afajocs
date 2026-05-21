import Link from "next/link";
import { registerAction } from "@/lib/actions";

export default function RegisterPage() {
  return (
    <main className="page">
      <div className="shell" style={{ maxWidth: 560 }}>
        <div className="panel">
          <div className="brand" style={{ marginBottom: 20 }}>
            <span className="brand-mark">
              <span>a</span>
              <span>F</span>
              <span>A</span>
            </span>
            Crear cuenta
          </div>
          <form className="form" action={registerAction}>
            <div className="field">
              <label htmlFor="name">Nombre</label>
              <input id="name" name="name" required />
            </div>
            <div className="field">
              <label htmlFor="email">Correo</label>
              <input id="email" name="email" type="email" required />
            </div>
            <div className="field">
              <label htmlFor="password">Contraseña</label>
              <input id="password" name="password" type="password" minLength={8} required />
            </div>
            <div className="field">
              <label htmlFor="role">Tipo de cuenta</label>
              <select id="role" name="role" defaultValue="teacher">
                <option value="teacher">Profesor</option>
                <option value="student">Alumno</option>
              </select>
            </div>
            <button className="button secondary" type="submit">
              Crear cuenta segura
            </button>
          </form>
          <p className="muted">
            ¿Ya tienes cuenta? <Link href="/login">Iniciar sesion</Link>
          </p>
        </div>
      </div>
    </main>
  );
}

