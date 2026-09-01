import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Eye, EyeOff, KeyRound, Loader2, Save, ShieldCheck, UserCircle2 } from "lucide-react";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { UserRoleBadge } from "@/components/usuarios/UserRoleBadge";

interface CurrentUser {
  id: string;
  email: string;
  fullName: string;
  role: string;
  agencyRole?: string | null;
  department?: string | null;
  phone?: string | null;
  isActive: boolean;
  createdAt?: string;
}

function extractErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error) {
    try {
      const parsed = JSON.parse(error.message);
      if (parsed?.error) return parsed.error;
    } catch {
      if (error.message) return error.message;
    }
  }
  return fallback;
}

const profileSchema = z.object({
  fullName: z.string().min(3, "El nombre debe tener al menos 3 caracteres"),
  phone: z.string().min(6, "Teléfono inválido").or(z.literal("")).optional(),
  department: z.string().min(2, "Departamento inválido").or(z.literal("")).optional(),
});
type ProfileFormValues = z.infer<typeof profileSchema>;

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Ingresa tu contraseña actual"),
    newPassword: z.string().min(8, "La nueva contraseña debe tener al menos 8 caracteres"),
    confirmPassword: z.string().min(1, "Confirma la nueva contraseña"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });
type PasswordFormValues = z.infer<typeof passwordSchema>;

export default function PerfilPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const { data: response, isLoading } = useQuery({
    queryKey: ["current-user"],
    queryFn: () => api.get("/auth/me"),
  });
  const user: CurrentUser | undefined = (response as any)?.data ?? response;

  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { fullName: "", phone: "", department: "" },
  });

  useEffect(() => {
    if (user) {
      profileForm.reset({
        fullName: user.fullName || "",
        phone: user.phone || "",
        department: user.department || "",
      });
    }
  }, [user, profileForm]);

  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  const updateProfileMutation = useMutation({
    mutationFn: (values: ProfileFormValues) =>
      api.patch("/auth/me", {
        fullName: values.fullName,
        phone: values.phone || undefined,
        department: values.department || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["current-user"] });
      toast({ title: "Perfil actualizado", description: "Tus datos se guardaron correctamente." });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "No se pudo guardar",
        description: extractErrorMessage(error, "Ocurrió un error al actualizar tu perfil."),
      });
    },
  });

  const updatePasswordMutation = useMutation({
    mutationFn: (values: PasswordFormValues) =>
      api.patch("/auth/me", {
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      }),
    onSuccess: () => {
      passwordForm.reset({ currentPassword: "", newPassword: "", confirmPassword: "" });
      toast({ title: "Contraseña actualizada", description: "Tu contraseña se cambió correctamente." });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "No se pudo cambiar la contraseña",
        description: extractErrorMessage(error, "Ocurrió un error al cambiar tu contraseña."),
      });
    },
  });

  const initials = user?.fullName
    ? user.fullName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "AD";

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-500 max-w-3xl">
      <div>
        <h1 className="text-3xl font-playfair font-bold text-navy dark:text-white flex items-center gap-3">
          <UserCircle2 className="w-8 h-8 text-primary" />
          Mi Perfil
        </h1>
        <p className="text-muted-foreground mt-2">
          Administra tus datos personales y la seguridad de tu cuenta.
        </p>
      </div>

      <Card className="border-navy/10 shadow-lg">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <Avatar className="h-16 w-16 border border-gray-100">
              <AvatarFallback className="bg-primary/10 text-primary text-lg font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-1">
              <p className="text-lg font-playfair font-bold text-navy dark:text-white">{user?.fullName}</p>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <UserRoleBadge role={user?.role} type="system" />
                {user?.agencyRole && <UserRoleBadge role={user.agencyRole} type="agency" />}
              </div>
            </div>
            {user?.createdAt && (
              <div className="text-xs text-muted-foreground sm:text-right">
                Miembro desde
                <br />
                <span className="font-semibold text-navy dark:text-white">
                  {format(new Date(user.createdAt), "d 'de' MMMM, yyyy", { locale: es })}
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="border-navy/10 shadow-lg">
        <CardHeader className="bg-navy/[0.02] border-b border-navy/5">
          <div className="flex items-center gap-2">
            <UserCircle2 className="w-5 h-5 text-primary" />
            <div>
              <CardTitle className="text-xl font-playfair">Datos Personales</CardTitle>
              <CardDescription>Tu nombre, teléfono y departamento.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <form
            onSubmit={profileForm.handleSubmit((values) => updateProfileMutation.mutate(values))}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="fullName">Nombre Completo</Label>
                <Input id="fullName" {...profileForm.register("fullName")} />
                {profileForm.formState.errors.fullName && (
                  <p className="text-xs text-destructive">{profileForm.formState.errors.fullName.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Correo Electrónico</Label>
                <Input id="email" value={user?.email || ""} disabled />
                <p className="text-[10px] text-muted-foreground">
                  El correo no se puede modificar. Contacta a un administrador si necesitas cambiarlo.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono</Label>
                <Input id="phone" placeholder="+56 9 1234 5678" {...profileForm.register("phone")} />
                {profileForm.formState.errors.phone && (
                  <p className="text-xs text-destructive">{profileForm.formState.errors.phone.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="department">Departamento</Label>
                <Input id="department" placeholder="Ej: Ventas" {...profileForm.register("department")} />
                {profileForm.formState.errors.department && (
                  <p className="text-xs text-destructive">{profileForm.formState.errors.department.message}</p>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button
                type="submit"
                className="gap-2 bg-navy hover:bg-navy-dark text-white"
                disabled={updateProfileMutation.isPending}
              >
                {updateProfileMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Guardar Cambios
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="border-navy/10 shadow-lg">
        <CardHeader className="bg-navy/[0.02] border-b border-navy/5">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-primary" />
            <div>
              <CardTitle className="text-xl font-playfair">Seguridad</CardTitle>
              <CardDescription>Cambia tu contraseña de acceso.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <form
            onSubmit={passwordForm.handleSubmit((values) => updatePasswordMutation.mutate(values))}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="currentPassword">Contraseña Actual</Label>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    type={showCurrentPassword ? "text" : "password"}
                    className="pr-10"
                    {...passwordForm.register("currentPassword")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {passwordForm.formState.errors.currentPassword && (
                  <p className="text-xs text-destructive">
                    {passwordForm.formState.errors.currentPassword.message}
                  </p>
                )}
              </div>

              <Separator className="md:col-span-2" />

              <div className="space-y-2">
                <Label htmlFor="newPassword">Nueva Contraseña</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showNewPassword ? "text" : "password"}
                    className="pr-10"
                    {...passwordForm.register("newPassword")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {passwordForm.formState.errors.newPassword && (
                  <p className="text-xs text-destructive">{passwordForm.formState.errors.newPassword.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Nueva Contraseña</Label>
                <Input
                  id="confirmPassword"
                  type={showNewPassword ? "text" : "password"}
                  {...passwordForm.register("confirmPassword")}
                />
                {passwordForm.formState.errors.confirmPassword && (
                  <p className="text-xs text-destructive">
                    {passwordForm.formState.errors.confirmPassword.message}
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button
                type="submit"
                className="gap-2 bg-navy hover:bg-navy-dark text-white"
                disabled={updatePasswordMutation.isPending}
              >
                {updatePasswordMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <KeyRound className="w-4 h-4" />
                )}
                Cambiar Contraseña
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
