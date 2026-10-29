import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist", "coverage"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      // La v7 del plugin añade reglas pensadas para el React Compiler, que este proyecto no usa:
      // marcan patrones válidos (setState en efectos, Date.now en render, etc.). Se mantienen
      // rules-of-hooks y exhaustive-deps, que sí atrapan errores reales.
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/purity": "off",
      "react-hooks/globals": "off",
      "react-hooks/immutability": "off",
      "react-hooks/preserve-manual-memoization": "off",
      "react-hooks/incompatible-library": "off",

      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
      "@typescript-eslint/no-unused-vars": "off",
      // Hay 420 usos heredados de `any`. Se muestran como aviso y el CI (npm run lint:ci) falla si
      // aparece uno más: el número solo puede bajar. Ver docs/CALIDAD.md en el repo del API.
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
  {
    // Componentes generados de shadcn/ui (también fuera de la cobertura): exportan variantes y contextos
    // junto a los componentes por diseño. Las versiones nuevas de eslint-plugin-react-refresh los marcan.
    files: ["src/components/ui/**/*.{ts,tsx}"],
    rules: { "react-refresh/only-export-components": "off" },
  }
);
