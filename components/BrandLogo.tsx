export function BrandLogo({ label = "AFAJICS" }: { label?: string }) {
  return (
    <div className="brand">
      <img className="brand-logo" src="/assets/afa-logo.png" alt="Logo AFA" />
      {label}
    </div>
  );
}

