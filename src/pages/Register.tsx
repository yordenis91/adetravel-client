import { useState, useEffect } from "react";
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
import { auth } from "@/lib/auth";

const registerSchema = z.object({
  fullName: z.string().min(3, "Debes indicar tu nombre completo"),
  email: z.string().email("Correo inválido"),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
  confirmPassword: z.string().min(8, "Confirma tu contraseña"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

type RegisterValues = z.infer<typeof registerSchema>;

export default function Register() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    if (auth.isAuthenticated()) {
      navigate("/dashboard", { replace: true });
    }
  }, [navigate]);

  const onSubmit = async (values: RegisterValues) => {
    try {
      setLoading(true);
      await auth.register({
        fullName: values.fullName.trim(),
        email: values.email.toLowerCase().trim(),
        password: values.password,
      });
      toast.success("Cuenta creada con éxito");
      navigate("/dashboard", { replace: true });
    } catch (error: any) {
      const message =
        typeof error?.message === "string"
          ? error.message
          : "Error al crear la cuenta";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex min-h-screen max-w-6xl items-center justify-center px-6 py-12">
        <div className="grid w-full gap-8 rounded-[2rem] border border-slate-800 bg-navy/95 p-8 shadow-2xl shadow-black/20 md:grid-cols-[1.1fr_1fr]">
          <div className="flex flex-col justify-center gap-6 text-white">
            <div className="space-y-4">
              <p className="text-sm uppercase tracking-[0.3em] text-gold-light/80">ADE Travel</p>
              <h1 className="text-4xl font-playfair font-bold leading-tight">Crea tu cuenta empresarial</h1>
              <p className="max-w-xl text-sm text-slate-300">
                Regístrate con tu correo corporativo y accede a la administración de solicitudes, pagos y operaciones de la agencia.
              </p>
            </div>

            <div className="space-y-3 rounded-3xl bg-white/5 p-6 text-sm text-slate-300 ring-1 ring-white/10 backdrop-blur-lg">
              <p className="font-semibold text-slate-100">¿Ya tienes cuenta?</p>
              <p>Vuelve al inicio de sesión para continuar con tus credenciales.</p>
              <Link
                to="/auth/login"
                className="inline-flex rounded-full bg-gold px-4 py-2 text-sm font-semibold text-navy transition hover:bg-gold-dark"
              >
                Iniciar sesión
              </Link>
            </div>
          </div>

          <Card className="bg-white/95 text-slate-900 shadow-lg shadow-black/10">
            <CardHeader className="pb-1">
              <CardTitle className="text-2xl">Registro</CardTitle>
              <CardDescription>Configura tu acceso a la plataforma ADE Travel.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
                <div className="space-y-2">
                  <Label htmlFor="fullName">Nombre completo</Label>
                  <Input id="fullName" type="text" placeholder="Juan Pérez" {...register("fullName")} />
                  {errors.fullName && <p className="text-sm text-destructive">{errors.fullName.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Correo electrónico</Label>
                  <Input id="email" type="email" placeholder="nombre@empresa.com" {...register("email")} />
                  {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Contraseña</Label>
                  <Input id="password" type="password" placeholder="********" {...register("password")} />
                  {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
                  <Input id="confirmPassword" type="password" placeholder="********" {...register("confirmPassword")} />
                  {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>}
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Creando cuenta…" : "Crear cuenta"}
                </Button>
              </form>

              <div className="text-center text-sm text-slate-500">
                <span>Ya estás listo?</span>{" "}
                <Link to="/auth/login" className="font-semibold text-navy underline decoration-gold/50 underline-offset-4">
                  Accede aquí
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
