import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { ShieldCheck, Mail, Lock, Eye, EyeOff, ArrowRight, ArrowLeft } from "lucide-react";
import kabobLogo from "@/assets/logo.webp";

const AdminLogin = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated, isAdmin, isReady } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // If already authenticated as admin, jump straight to the admin dashboard
  useEffect(() => {
    if (isReady && isAuthenticated && isAdmin) {
      navigate("/admin", { replace: true });
    }
  }, [isReady, isAuthenticated, isAdmin, navigate]);

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setError("");
      setLoading(true);

      try {
        const loggedInUser = await login(email.trim(), password);
        if (loggedInUser.role !== "ADMIN") {
          setError("Acceso denegado: esta cuenta no tiene permisos de administrador.");
          return;
        }
        navigate("/admin", { replace: true });
      } catch (submitError) {
        setError(submitError instanceof Error ? submitError.message : "Error al iniciar sesión.");
      } finally {
        setLoading(false);
      }
    },
    [email, password, login, navigate]
  );

  const fieldErrors: Record<string, string> = {};
  if (touched.email && !email.trim()) fieldErrors.email = "Ingresa tu correo de administrador";
  if (touched.password && !password) fieldErrors.password = "Ingresa tu contraseña";

  return (
    <div className="min-h-screen bg-[#071F07] flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden text-[#F7F5EF]">
      {/* Background radial glow */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_center_top,rgba(242,196,28,0.08)_0%,transparent_60%)] pointer-events-none" />

      <div className="w-full max-w-[440px]">
        {/* Brand & Security Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center mb-3">
            <img src={kabobLogo} alt="Kabob Place" className="h-16 w-auto object-contain drop-shadow" />
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.05] border border-white/10 text-[11px] font-semibold text-primary uppercase tracking-widest mb-2">
            <ShieldCheck className="w-3.5 h-3.5 text-primary" />
            Portal de Administración
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Kabob Place Admin
          </h1>
          <p className="text-xs text-white/50 mt-1">
            Acceso seguro y exclusivo para gestión y operaciones
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-white/10 bg-[#0B3D0B]/70 p-7 md:p-8 shadow-2xl backdrop-blur-xl relative">
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-primary via-[#A0D000] to-primary rounded-t-2xl" />

          {error && (
            <div className="mb-5 rounded-xl border border-red-500/30 bg-red-500/15 p-3.5 text-xs text-red-200">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold text-white/70 uppercase tracking-wider mb-1.5">
                Correo Electrónico
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40 w-4 h-4" />
                <input
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => setTouched((p) => ({ ...p, email: true }))}
                  placeholder="admin@kabobplaces.cl"
                  className="w-full rounded-xl border border-white/15 bg-black/25 py-3 pl-10 pr-4 text-sm text-white placeholder:text-white/30 outline-none focus:border-primary focus:ring-1 focus:ring-primary/40 transition-all"
                  required
                />
              </div>
              {touched.email && fieldErrors.email && (
                <p className="mt-1 text-[11px] text-red-400">{fieldErrors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-[11px] font-bold text-white/70 uppercase tracking-wider mb-1.5">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40 w-4 h-4" />
                <input
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={() => setTouched((p) => ({ ...p, password: true }))}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-white/15 bg-black/25 py-3 pl-10 pr-10 text-sm text-white placeholder:text-white/30 outline-none focus:border-primary focus:ring-1 focus:ring-primary/40 transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {touched.password && fieldErrors.password && (
                <p className="mt-1 text-[11px] text-red-400">{fieldErrors.password}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3.5 rounded-xl bg-primary text-[#071F07] font-bold text-sm transition-all hover:brightness-110 active:scale-[0.99] flex items-center justify-center gap-2 shadow-lg shadow-primary/20 disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-[#071F07]/30 border-t-[#071F07] animate-spin" />
                  Verificando credenciales...
                </>
              ) : (
                <>
                  Ingresar al Panel
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-white/10 text-center">
            <button
              type="button"
              onClick={() => navigate("/")}
              className="inline-flex items-center gap-1.5 text-xs text-white/50 hover:text-white transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Volver al sitio web principal
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
