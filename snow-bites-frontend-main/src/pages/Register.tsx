import { useState, useCallback, useMemo } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Eye, EyeOff, User, Mail, Lock, Phone, ArrowRight, UserPlus } from "lucide-react";

const Register = () => {
  const navigate = useNavigate();
  const { register, isAuthenticated, isAdmin } = useAuth();
  const { t } = useLanguage();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const fieldErrors = useMemo(() => {
    const e: Record<string, string> = {};
    if (touched.fullName && !fullName.trim()) e.fullName = "Full name is required";
    else if (touched.fullName && fullName.trim().length < 3) e.fullName = "Name must be at least 3 characters";
    if (touched.email && !email.trim()) e.email = "Email is required";
    else if (touched.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = "Enter a valid email";
    if (touched.password && !password) e.password = "Password is required";
    else if (touched.password && password.length < 6) e.password = "Password must be at least 6 characters";
    if (touched.phone && phone && phone.trim().length < 7) e.phone = "Enter a valid phone number";
    return e;
  }, [fullName, email, password, phone, touched]);

  const handleSubmit = useCallback(async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setTouched({ fullName: true, email: true, password: true, phone: true });
    if (Object.keys(fieldErrors).length > 0) return;

    setError("");
    setLoading(true);

    try {
      await register(fullName, email, password, phone || undefined);
      navigate("/account/dashboard", { replace: true });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Registration failed.");
    } finally {
      setLoading(false);
    }
  }, [fullName, email, password, phone, fieldErrors, register, navigate]);

  if (isAuthenticated) {
    return <Navigate to={isAdmin ? "/admin" : "/account/dashboard"} replace />;
  }

  return (
    <>
      <Header onCartOpen={() => { }} />

      <main className="min-h-screen bg-bg pt-20 pb-16 flex items-center justify-center px-4">
        <div className="w-full max-w-[460px]">
          {/* Glow background */}
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_center_top,hsl(var(--glow3))_0%,transparent_50%)] pointer-events-none" />

          <div className="rounded-3xl border border-border bg-bg-3 p-8 md:p-12 overflow-hidden relative">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-primary via-accent to-primary" />

            {/* Header */}
            <div className="mb-8 text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/30 mb-4">
                <UserPlus size={24} className="text-primary" />
              </div>
              <p className="text-[.68rem] uppercase tracking-[4px] text-primary font-semibold mb-3">{t('auth.newCustomer')}</p>
              <h1 className="font-display text-[clamp(1.8rem,5vw,2.4rem)] font-extrabold tracking-[-1px] mb-2">
                {t('auth.createAccount')}
              </h1>
              <p className="text-sm text-txt-3 leading-[1.6]">
                {t('auth.registerSubtitle')}
              </p>
            </div>

            {/* Form */}
            <form className="space-y-5 mb-6" onSubmit={handleSubmit}>
              {/* Full Name Field */}
              <div>
                <label className="mb-2 block text-[.72rem] font-semibold uppercase tracking-[1px] text-txt-3">
                  {t('checkout.fullName')}
                </label>
                <div className="relative">
                  <User size={14} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-txt-4" />
                  <input
                    type="text"
                    autoComplete="name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    onBlur={() => setTouched((p) => ({ ...p, fullName: true }))}
                    placeholder="Camila Rojas"
                    className={`w-full rounded-xl border bg-glass py-3.5 pl-10 pr-4 text-sm outline-none transition-all placeholder:text-txt-4 focus:border-primary focus:bg-bg-4 focus:shadow-[0_0_0_3px_hsl(var(--glow3))] ${touched.fullName && fieldErrors.fullName ? "border-destructive" : "border-border"
                      }`}
                  />
                </div>
                {touched.fullName && fieldErrors.fullName && <p className="mt-1.5 text-[.68rem] text-destructive font-medium">{fieldErrors.fullName}</p>}
              </div>

              {/* Email Field */}
              <div>
                <label className="mb-2 block text-[.72rem] font-semibold uppercase tracking-[1px] text-txt-3">
                  {t('auth.email')} *
                </label>
                <div className="relative">
                  <Mail size={14} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-txt-4" />
                  <input
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onBlur={() => setTouched((p) => ({ ...p, email: true }))}
                    placeholder="cliente@kabobplaces.cl"
                    className={`w-full rounded-xl border bg-glass py-3.5 pl-10 pr-4 text-sm outline-none transition-all placeholder:text-txt-4 focus:border-primary focus:bg-bg-4 focus:shadow-[0_0_0_3px_hsl(var(--glow3))] ${touched.email && fieldErrors.email ? "border-destructive" : "border-border"
                      }`}
                  />
                </div>
                {touched.email && fieldErrors.email && <p className="mt-1.5 text-[.68rem] text-destructive font-medium">{fieldErrors.email}</p>}
              </div>

              {/* Phone Field */}
              <div>
                <label className="mb-2 block text-[.72rem] font-semibold uppercase tracking-[1px] text-txt-3">
                  {t('checkout.phone')}
                </label>
                <div className="relative">
                  <Phone size={14} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-txt-4" />
                  <input
                    type="tel"
                    autoComplete="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    onBlur={() => setTouched((p) => ({ ...p, phone: true }))}
                    placeholder="+569 9103 0440"
                    className={`w-full rounded-xl border bg-glass py-3.5 pl-10 pr-4 text-sm outline-none transition-all placeholder:text-txt-4 focus:border-primary focus:bg-bg-4 focus:shadow-[0_0_0_3px_hsl(var(--glow3))] ${touched.phone && fieldErrors.phone ? "border-destructive" : "border-border"
                      }`}
                  />
                </div>
                {touched.phone && fieldErrors.phone && <p className="mt-1.5 text-[.68rem] text-destructive font-medium">{fieldErrors.phone}</p>}
              </div>

              {/* Password Field */}
              <div>
                <label className="mb-2 block text-[.72rem] font-semibold uppercase tracking-[1px] text-txt-3">
                  {t('auth.password')} *
                </label>
                <div className="relative">
                  <Lock size={14} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-txt-4" />
                  <input
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onBlur={() => setTouched((p) => ({ ...p, password: true }))}
                    placeholder="••••••••"
                    className={`w-full rounded-xl border bg-glass py-3.5 pl-10 pr-10 text-sm outline-none transition-all placeholder:text-txt-4 focus:border-primary focus:bg-bg-4 focus:shadow-[0_0_0_3px_hsl(var(--glow3))] ${touched.password && fieldErrors.password ? "border-destructive" : "border-border"
                      }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-txt-4 hover:text-txt-2 transition-colors"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {touched.password && fieldErrors.password && <p className="mt-1.5 text-[.68rem] text-destructive font-medium">{fieldErrors.password}</p>}
              </div>

              {/* Error Message */}
              {error && (
                <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || Object.keys(fieldErrors).length > 0}
                className="w-full py-3.5 rounded-xl bg-gradient-to-br from-primary to-accent text-[#071F07] font-bold text-sm transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_30px_hsl(var(--glow))] disabled:opacity-50 disabled:hover:translate-y-0 flex items-center justify-center gap-2.5 shadow-[0_4px_20px_hsl(var(--glow))] relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                {loading ? (
                  <>
                    <div className="w-4 h-4 rounded-full border-2 border-[#071F07]/30 border-t-[#071F07] animate-spin" />
                    {t('auth.creatingAccount')}
                  </>
                ) : (
                  <>
                    <UserPlus size={16} />
                    {t('auth.createAccount')}
                    <ArrowRight size={14} />
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-3 mb-6">
              <div className="flex-1 h-px bg-gradient-to-r from-border to-transparent" />
              <span className="text-[.68rem] text-txt-4 font-semibold">OR</span>
              <div className="flex-1 h-px bg-gradient-to-l from-border to-transparent" />
            </div>

            {/* Footer Links */}
            <p className="text-center text-sm text-txt-3">
              {t('auth.haveAccount')}{" "}
              <Link to="/login" className="text-primary font-semibold hover:text-accent transition-colors">
                {t('auth.signIn')}
              </Link>
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
};

export default Register;