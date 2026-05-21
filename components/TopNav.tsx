import Link from "next/link";
import { BookOpen, Home, Library, LogOut, UserRound } from "lucide-react";
import { logoutAction } from "@/lib/actions";
import type { SessionUser } from "@/lib/auth";
import { BrandLogo } from "@/components/BrandLogo";

export function TopNav({
  session,
  title,
  subtitle
}: {
  session: SessionUser | null;
  title: string;
  subtitle?: string;
}) {
  const homeHref = session?.role === "teacher" ? "/teacher" : session?.role === "student" ? "/student" : "/";

  return (
    <header className="topbar app-nav">
      <div>
        <BrandLogo label={title} />
        {subtitle && <p className="muted">{subtitle}</p>}
      </div>
      <nav className="toolbar" aria-label="Menú principal">
        <Link className="button ghost" href={homeHref}>
          <Home size={18} /> Inici
        </Link>
        <Link className="button black" href="/games">
          <Library size={18} /> Biblioteca de Jics
        </Link>
        {session?.role === "student" && (
          <Link className="button cyan" href="/student">
            <BookOpen size={18} /> Deures
          </Link>
        )}
        {session?.role === "teacher" && (
          <Link className="button cyan" href="/teacher">
            <UserRound size={18} /> Professor
          </Link>
        )}
        {session ? (
          <form action={logoutAction}>
            <button className="button ghost" type="submit">
              <LogOut size={18} /> Sortir
            </button>
          </form>
        ) : (
          <Link className="button" href="/login">
            Entrar
          </Link>
        )}
      </nav>
    </header>
  );
}
