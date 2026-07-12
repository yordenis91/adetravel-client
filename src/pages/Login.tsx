import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { Loader2, Lock, Eye, EyeOff } from "lucide-react";

// 🛡️ Validación estricta y segura
const loginSchema = z.object({
  email: z.string().email("Por favor, ingresa un correo corporativo válido"),
  password: z.string().min(1, "La contraseña es obligatoria"),
});

type LoginValues = z.infer<typeof loginSchema>;

export default function Login() {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  useEffect(() => {
    // Si ya está logueado, lo expulsamos del login automáticamente
    const token = localStorage.getItem("ade_token");
    // Evitar rebotes: sólo redirigir si el contexto está autenticado y el token existe en localStorage
    if (isAuthenticated && token) {
      navigate("/dashboard", { replace: true });
    }
  }, [navigate, isAuthenticated]);

  const onSubmit = async (values: LoginValues) => {
    try {
      setLoading(true);
      await login(values.email, values.password);
      toast.success("Autenticación exitosa", { description: "Bienvenido al panel administrativo" });
      navigate("/dashboard", { replace: true });
    } catch (error: any) {
      // 🔒 Seguridad: Mensaje genérico para evitar filtración de usuarios
      toast.error("Credenciales inválidas", {
        description: "El correo o la contraseña no son correctos. Intenta nuevamente."
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A1128] text-slate-100 flex items-center justify-center p-4 sm:p-6 selection:bg-gold/30">

      <div className="w-full max-w-md md:max-w-5xl md:grid gap-8 md:grid-cols-[1.2fr_1fr] md:rounded-[2rem] md:border md:border-white/10 md:bg-navy/80 md:p-8 lg:p-10 md:shadow-2xl md:backdrop-blur-xl md:min-h-[500px]">

        {/* Panel Izquierdo: Branding corporativo */}
        <div className="hidden md:flex flex-col justify-center gap-10 text-white p-4">
          <div className="space-y-4">

            {/* Logo para la vista PC/Desktop */}
            <img
              src="/cropped-logo-png-2.png"
              alt="ADE Travel Logo"
              className="h-16 w-auto object-contain"
            />
            <h1 className="text-4xl sm:text-5xl font-playfair font-bold leading-tight">
              Accede a tu panel administrativo
            </h1>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-md">
              Ingresa con tus credenciales corporativas para administrar clientes, cotizaciones, pagos y todo el flujo operativo de la agencia.
            </p>
          </div>

          <div className="rounded-2xl bg-white/5 p-5 border border-white/10 backdrop-blur-sm max-w-md">
            <div className="flex items-start gap-4">
              <div className="bg-gold/20 p-2 rounded-lg text-gold mt-0.5">
                <Lock size={20} />
              </div>
              <div>
                <p className="font-bold text-white text-sm mb-1">Acceso Exclusivo</p>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Esta plataforma no admite registro público. Si eres parte del equipo y necesitas acceso, por favor contacta al administrador de la agencia para recibir tu invitación.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Panel Derecho: Formulario funcional */}
        <Card className="bg-white text-slate-900 shadow-2xl md:shadow-xl border-0 flex flex-col justify-center p-6 sm:p-8 rounded-[2rem] w-full">
          <CardHeader className="pb-6 px-0 pt-0 text-center md:text-left">

            {/* Branding exclusivo para móvil con Logo */}
            <div className="md:hidden mb-6 flex justify-center">
              <img
                src="/cropped-logo-png-2.png"
                alt="ADE Travel Logo"
                className="h-14 w-auto object-contain drop-shadow-sm"
              />
            </div>

            <CardTitle className="text-2xl sm:text-3xl font-playfair font-bold text-navy">
              Iniciar sesión
            </CardTitle>
            <CardDescription className="text-slate-500 text-sm mt-1">
              Introduce tu correo y contraseña para continuar.
            </CardDescription>
          </CardHeader>

          <CardContent className="px-0 pb-0 text-left">
            <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
              <div className="space-y-2">
                <Label htmlFor="email" className="font-semibold text-navy text-sm">Correo electrónico</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="nombre@adetravel.cl"
                  className="h-12 bg-slate-50 border-slate-200 focus-visible:ring-primary focus-visible:border-primary transition-all text-base"
                  disabled={loading}
                  {...register("email")}
                />
                {errors.email && <p className="text-xs font-medium text-destructive">{errors.email.message}</p>}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="font-semibold text-navy text-sm">Contraseña</Label>
                  <Link to="/auth/forgot-password" className="text-xs font-semibold text-primary hover:text-navy transition-colors">
                    ¿Olvidaste tu contraseña?
                  </Link>
                </div>

                {/* Contenedor relativo para el input y el botón de visibilidad */}
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    className="h-12 bg-slate-50 border-slate-200 focus-visible:ring-primary focus-visible:border-primary transition-all font-mono text-base pr-10"
                    disabled={loading}
                    {...register("password")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-navy transition-colors"
                    disabled={loading}
                    aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>

                {errors.password && <p className="text-xs font-medium text-destructive">{errors.password.message}</p>}
              </div>

              <Button
                type="submit"
                className="w-full h-12 bg-navy hover:bg-navy-light text-white font-bold text-base shadow-md transition-all mt-6 rounded-xl"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Validando credenciales...
                  </>
                ) : (
                  "Iniciar sesión"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}