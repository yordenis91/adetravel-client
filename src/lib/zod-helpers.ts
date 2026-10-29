import { z } from "zod";

/**
 * Número que acepta texto (los `<input type="number">` entregan cadenas) y lo convierte al validar.
 * En zod 4 `z.coerce.number()` declara su entrada como `unknown`, lo que rompe los tipos de
 * react-hook-form; aquí se mantiene el tipo de entrada `number` y el comportamiento en tiempo de ejecución.
 */
export const coerceNumber = () => z.coerce.number() as unknown as z.ZodNumber;
