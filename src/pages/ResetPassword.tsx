import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Link, useNavigate, useParams } from "react-router-dom";
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
import { Loader2, Lock, Eye, EyeOff, CheckCircle2, AlertCircle } from "lucide-react";
import { api } from "@/lib/api";

// 🛡️ Validación estricta de contraseña
const resetPasswordSchema = z.object({
  newPassword: z
    .string()
    .min(8, "La contraseña debe tener al menos 8 caracteres")
    .regex(/[A-Z]/, "Debe incluir al menos una letra mayúscula")
    .regex(/[0-9]/, "Debe incluir al menos un número")
    .regex(/[!@#$%^&*]/, "Debe incluir al menos un carácter especial (!@#$%^&*)"),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;

// Componente para mostrar requisitos de contraseña
const PasswordRequirements = ({ password }: { password: string }) => {
  const requiredLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*]/.test(password);

  const requirements = [
    { label: "Al menos 8 caracteres", met: requiredLength },
    { label: "Una letra mayúscula", met: hasUppercase },
    { label: "Un número", met: hasNumber },
    { label: "Un carácter especial (!@#$%^&*)", met: hasSpecial },
  ];

  return (
    <div className="space-y-2">
      {requirements.map((req, idx) => (
        <div key={idx} className="flex items-center gap-2 text-xs">
          {req.met ? (
            <CheckCircle2 size={14} className="text-green-600" />
          ) : (
            <AlertCircle size={14} className="text-slate-300" />
          )}
          <span className={req.met ? "text-green-700 font-medium" : "text-slate-500"}>
            {req.label}
          </span>
        </div>
      ))}
    </div>
  );
};

export default function ResetPassword() {
  const navigate = useNavigate();
  const { token } = useParams<{ token: string }>();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [tokenValid, setTokenValid] = useState(true);
  const [validatingToken, setValidatingToken] = useState(true);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
  });

  const newPassword = watch("newPassword");

  // Validar que el token sea válido
  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setTokenValid(false);
        setValidatingToken(false);
        return;
      }

      try {
        // Hacemos un request al backend para validar el token
        await api.post("/auth/validate-reset-token", { token });
        setTokenValid(true);
      } catch (error) {
        setTokenValid(false);
      } finally {
        setValidatingToken(false);
      }
    };

    validateToken();
  }, [token]);

  // Si el usuario ya está logueado, redirige al dashboard
  useEffect(() => {
    const authToken = localStorage.getItem("ade_token");
    if (authToken) {
      navigate("/dashboard", { replace: true });
    }
  }, [navigate]);

  const onSubmit = async (values: ResetPasswordValues) => {
    if (!token) {
      toast.error("Token inválido", {
        description: "No se encontró el token de recuperación.",
      });
      return;
    }

    try {
      setLoading(true);
      await api.post("/auth/reset-password", {
        token,
        newPassword: values.newPassword,
      });

      toast.success("Contraseña actualizada", {
        description: "Tu contraseña ha sido restablecida exitosamente.",
      });

      // Redirige al login después de 2 segundos
      setTimeout(() => {
        navigate("/auth/login", { replace: true });
      }, 2000);
    } catch (error: any) {
      let message = "No pudimos restablecer tu contraseña";
      
      try {
        const errorData = JSON.parse(error.message);
        message = errorData.error || message;
      } catch {
        // Si no se puede parsear como JSON, usar el mensaje como está
        message = error.message || message;
      }
      
      toast.error("Error al restablecer contraseña", {
        description: message,
      });
    } finally {
      setLoading(false);
    }
  };

  if (validatingToken) {
    return (
      <div className="min-h-screen bg-[#0A1128] text-slate-100 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
          <p className="text-slate-300">Validando enlace de recuperación...</p>
        </div>
      </div>
    );
  }

  if (!tokenValid || !token) {
    return (
      <div className="min-h-screen bg-[#0A1128] text-slate-100 flex items-center justify-center p-4">
        <Card className="bg-white text-slate-900 shadow-2xl border-0 flex flex-col justify-center p-6 sm:p-8 rounded-[2rem] w-full max-w-md">
          <CardHeader className="pb-6 px-0 pt-0 text-center">
            <div className="mb-6 flex justify-center">
              <div className="bg-red-100 p-4 rounded-full text-red-600">
                <AlertCircle size={32} />
              </div>
            </div>
            <CardTitle className="text-2xl sm:text-3xl font-playfair font-bold text-navy">
              Enlace inválido o expirado
            </CardTitle>
          </CardHeader>

          <CardContent className="px-0 pb-0 text-center space-y-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-slate-700 leading-relaxed">
                El enlace de recuperación no es válido o ha expirado. Los enlaces tienen una validez de 1 hora.
              </p>
            </div>

            <Link
              to="/auth/forgot-password"
              className="inline-block w-full bg-navy hover:bg-navy-light text-white font-bold py-2 rounded-lg transition-all"
            >
              Solicitar nuevo enlace
            </Link>

            <Link
              to="/auth/login"
              className="inline-flex items-center justify-center gap-2 text-sm font-semibold text-primary hover:text-navy transition-colors w-full"
            >
              Volver al login
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A1128] text-slate-100 flex items-center justify-center p-4 sm:p-6 selection:bg-gold/30">
      <div className="w-full max-w-md md:max-w-5xl md:grid gap-8 md:grid-cols-[1.2fr_1fr] md:rounded-[2rem] md:border md:border-white/10 md:bg-navy/80 md:p-8 lg:p-10 md:shadow-2xl md:backdrop-blur-xl md:min-h-[500px]">

        {/* Panel Izquierdo: Branding */}
        <div className="hidden md:flex flex-col justify-center gap-10 text-white p-4">
          <div className="space-y-4">
            <img
              src="/cropped-logo-png-2.png"
              alt="ADE Travel Logo"
              className="h-16 w-auto object-contain"
            />
            <h1 className="text-4xl sm:text-5xl font-playfair font-bold leading-tight">
              Nueva contraseña
            </h1>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-md">
              Elige una contraseña fuerte y segura para proteger tu cuenta. Debe contener mayúsculas, números y caracteres especiales.
            </p>
          </div>

          <div className="rounded-2xl bg-white/5 p-5 border border-white/10 backdrop-blur-sm max-w-md">
            <div className="flex items-start gap-4">
              <div className="bg-gold/20 p-2 rounded-lg text-gold mt-0.5">
                <Lock size={20} />
              </div>
              <div>
                <p className="font-bold text-white text-sm mb-1">Contraseña segura</p>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Asegurate de usar una contraseña única que no hayas utilizando en otras plataformas.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Panel Derecho: Formulario */}
        <Card className="bg-white text-slate-900 shadow-2xl md:shadow-xl border-0 flex flex-col justify-center p-6 sm:p-8 rounded-[2rem] w-full">
          <CardHeader className="pb-6 px-0 pt-0 text-center md:text-left">
            <div className="md:hidden mb-6 flex justify-center">
              <img
                src="/cropped-logo-png-2.png"
                alt="ADE Travel Logo"
                className="h-14 w-auto object-contain drop-shadow-sm"
              />
            </div>

            <CardTitle className="text-2xl sm:text-3xl font-playfair font-bold text-navy">
              Restablecer contraseña
            </CardTitle>
            <CardDescription className="text-slate-500 text-sm mt-1">
              Ingresa tu nueva contraseña segura.
            </CardDescription>
          </CardHeader>

          <CardContent className="px-0 pb-0 text-left">
            <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
              {/* Nueva contraseña */}
              <div className="space-y-2">
                <Label htmlFor="newPassword" className="font-semibold text-navy text-sm">
                  Nueva contraseña
                </Label>

                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="••••••••"
                    className="h-12 bg-slate-50 border-slate-200 outline-none focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary focus-visible:ring-offset-0 transition-colors font-mono text-base pr-10"
                    disabled={loading}
                    {...register("newPassword")}
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

                {newPassword && (
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <PasswordRequirements password={newPassword} />
                  </div>
                )}

                {errors.newPassword && (
                  <p className="text-xs font-medium text-destructive">
                    {errors.newPassword.message}
                  </p>
                )}
              </div>

              {/* Confirmar contraseña */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="font-semibold text-navy text-sm">
                  Confirmar contraseña
                </Label>

                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="••••••••"
                    className="h-12 bg-slate-50 border-slate-200 outline-none focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary focus-visible:ring-offset-0 transition-colors font-mono text-base pr-10"
                    disabled={loading}
                    {...register("confirmPassword")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-navy transition-colors"
                    disabled={loading}
                    aria-label={showConfirmPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  >
                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>

                {errors.confirmPassword && (
                  <p className="text-xs font-medium text-destructive">
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full h-12 bg-navy hover:bg-navy-light text-white font-bold text-base shadow-md transition-all mt-6 rounded-xl"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Restableciendo contraseña...
                  </>
                ) : (
                  "Restablecer contraseña"
                )}
              </Button>
            </form>

            <div className="mt-8 pt-6 border-t border-slate-200">
              <Link
                to="/auth/login"
                className="inline-flex items-center justify-center gap-2 text-sm font-semibold text-primary hover:text-navy transition-colors w-full"
              >
                Volver al login
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
