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
import { Loader2, Mail, ArrowLeft } from "lucide-react";
import { api } from "@/lib/api";

// 🛡️ Validación de email
const forgotPasswordSchema = z.object({
  email: z.string().email("Por favor, ingresa un correo válido"),
});

type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [sentEmail, setSentEmail] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  useEffect(() => {
    // Si el usuario ya tiene acceso, redirige al dashboard
    const token = localStorage.getItem("ade_token");
    if (token) {
      navigate("/dashboard", { replace: true });
    }
  }, [navigate]);

  const onSubmit = async (values: ForgotPasswordValues) => {
    try {
      setLoading(true);
      await api.post("/auth/forgot-password", {
        email: values.email,
      });
      
      // Mostrar mensaje de éxito genérico (sin revelar si el email existe)
      setSentEmail(values.email);
      setEmailSent(true);
      toast.success("Correo enviado", {
        description: "Si el correo existe en nuestro sistema, recibirás instrucciones para recuperar tu contraseña.",
      });
    } catch (error: any) {
      // Mostrar mensaje genérico para no revelar si el email existe
      toast.error("No pudimos procesar tu solicitud", {
        description: "Si el correo existe en nuestro sistema, recibirás instrucciones.",
      });
    } finally {
      setLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="min-h-screen bg-[#0A1128] text-slate-100 flex items-center justify-center p-4 sm:p-6 selection:bg-gold/30">
        <Card className="bg-white text-slate-900 shadow-2xl border-0 flex flex-col justify-center p-6 sm:p-8 rounded-[2rem] w-full max-w-md">
          <CardHeader className="pb-6 px-0 pt-0 text-center">
            <div className="mb-6 flex justify-center">
              <div className="bg-green-100 p-4 rounded-full text-green-600">
                <Mail size={32} />
              </div>
            </div>
            <CardTitle className="text-2xl sm:text-3xl font-playfair font-bold text-navy">
              Revisa tu correo
            </CardTitle>
            <CardDescription className="text-slate-500 text-sm mt-3">
              Hemos enviado instrucciones de recuperación a <strong>{sentEmail}</strong>
            </CardDescription>
          </CardHeader>

          <CardContent className="px-0 pb-0 text-center space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-slate-700 leading-relaxed">
                Si el correo existe en nuestro sistema, recibirás un enlace para restablecer tu contraseña en los próximos minutos. 
                <strong> No expirará en una hora</strong>, así que puedes tomarte el tiempo que necesites.
              </p>
            </div>

            <div className="space-y-3">
              <p className="text-xs text-slate-500">¿No recibiste el correo?</p>
              <Button
                onClick={() => setEmailSent(false)}
                className="w-full bg-navy hover:bg-navy-light text-white font-bold py-2 rounded-lg transition-all"
              >
                Intentar con otro correo
              </Button>
            </div>

            <Link
              to="/auth/login"
              className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-navy transition-colors"
            >
              <ArrowLeft size={16} />
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
              Recupera tu acceso
            </h1>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-md">
              Ingresa tu correo corporativo y te enviaremos un enlace para restablecer tu contraseña de forma segura.
            </p>
          </div>

          <div className="rounded-2xl bg-white/5 p-5 border border-white/10 backdrop-blur-sm max-w-md">
            <div className="flex items-start gap-4">
              <div className="bg-gold/20 p-2 rounded-lg text-gold mt-0.5">
                <Mail size={20} />
              </div>
              <div>
                <p className="font-bold text-white text-sm mb-1">Seguro y rápido</p>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Recibirás un enlace seguro por correo electrónico. El enlace es válido por 1 hora.
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
              Recuperar contraseña
            </CardTitle>
            <CardDescription className="text-slate-500 text-sm mt-1">
              Ingresa tu correo y te guiaremos en el proceso.
            </CardDescription>
          </CardHeader>

          <CardContent className="px-0 pb-0 text-left">
            <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
              <div className="space-y-2">
                <Label htmlFor="email" className="font-semibold text-navy text-sm">
                  Correo electrónico
                </Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="nombre@adetravel.cl"
                  className="h-12 bg-slate-50 border-slate-200 outline-none focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary focus-visible:ring-offset-0 transition-colors text-base"
                  disabled={loading}
                  {...register("email")}
                />
                {errors.email && (
                  <p className="text-xs font-medium text-destructive">
                    {errors.email.message}
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
                    Enviando enlace...
                  </>
                ) : (
                  "Enviar enlace de recuperación"
                )}
              </Button>
            </form>

            <div className="flex items-center gap-2 mt-8 pt-6 border-t border-slate-200">
              <Link
                to="/auth/login"
                className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-navy transition-colors"
              >
                <ArrowLeft size={16} />
                Volver al login
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
