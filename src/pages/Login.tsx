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
import { Loader2 } from "lucide-react";

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
    if (isAuthenticated) {
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
    <div className="min-h-screen bg-[#0A1128] text-slate-100 flex items-center justify-center p-4 sm:p-8 selection:bg-gold/30">
      <div className="w-full max-w-5xl grid gap-8 rounded-[2rem] border border-white/10 bg-navy/80 p-6 sm:p-10 shadow-2xl backdrop-blur-xl md:grid-cols-[1.2fr_1fr]">
        
        {/* Panel Izquierdo: Branding corporativo */}
        <div className="flex flex-col justify-center gap-8 text-white p-4">
          <div className="space-y-4">
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-gold">ADE Travel</p>
            <h1 className="text-4xl sm:text-5xl font-playfair font-bold leading-tight">
              Accede a tu panel administrativo
            </h1>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-md">
              Ingresa con tus credenciales corporativas para administrar clientes, cotizaciones, pagos y todo el flujo operativo de la agencia.
            </p>
          </div>

          <div className="space-y-4 rounded-3xl bg-white/5 p-6 text-sm text-slate-300 ring-1 ring-white/10 backdrop-blur-sm">
            <div>
              <p className="font-bold text-white text-base mb-1">¿Nuevo en ADE Travel?</p>
              <p className="text-slate-400">Regístrate con un usuario autorizado para comenzar a trabajar en la plataforma.</p>
            </div>
            <Button asChild variant="outline" className="bg-gold border-none text-navy font-bold hover:bg-gold-light transition-colors">
              <Link to="/auth/register">Crear cuenta corporativa</Link>
            </Button>
          </div>
        </div>

        {/* Panel Derecho: Formulario funcional */}
        <Card className="bg-white text-slate-900 shadow-xl border-0 flex flex-col justify-center p-2 sm:p-6 rounded-3xl">
          <CardHeader className="pb-6">
            <CardTitle className="text-3xl font-playfair font-bold text-navy">Iniciar sesión</CardTitle>
            <CardDescription className="text-slate-500">
              Introduce tu correo y contraseña para continuar.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
              <div className="space-y-2">
                <Label htmlFor="email" className="font-semibold text-navy">Correo electrónico</Label>
                <Input 
                  id="email" 
                  type="email" 
                  autoComplete="email"
                  placeholder="nombre@adetravel.cl" 
                  className="h-12 bg-slate-50 border-slate-200 focus-visible:ring-primary focus-visible:border-primary transition-all"
                  disabled={loading}
                  {...register("email")} 
                />
                {errors.email && <p className="text-xs font-medium text-destructive">{errors.email.message}</p>}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="font-semibold text-navy">Contraseña</Label>
                  <Link to="/auth/forgot-password" className="text-xs font-semibold text-primary hover:text-navy transition-colors">
                    ¿Olvidaste tu contraseña?
                  </Link>
                </div>
                <Input 
                  id="password" 
                  type="password" 
                  autoComplete="current-password"
                  placeholder="••••••••" 
                  className="h-12 bg-slate-50 border-slate-200 focus-visible:ring-primary focus-visible:border-primary transition-all font-mono"
                  disabled={loading}
                  {...register("password")} 
                />
                {errors.password && <p className="text-xs font-medium text-destructive">{errors.password.message}</p>}
              </div>

              <Button 
                type="submit" 
                className="w-full h-12 bg-navy hover:bg-navy-light text-white font-bold text-base shadow-md transition-all mt-4" 
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

            <div className="mt-8 text-center text-sm text-slate-500">
              <span>¿No tienes cuenta?</span>{" "}
              <Link to="/auth/register" className="font-bold text-navy hover:text-primary transition-colors underline decoration-gold/50 underline-offset-4">
                Regístrate ahora
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}