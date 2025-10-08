import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

let nextConfig = [];
try {
  nextConfig = compat.extends("next/core-web-vitals");
} catch (error) {
  if (process.env.NODE_ENV !== "production") {
    console.warn(
      'Warning: unable to load "next/core-web-vitals" ESLint config. Falling back to a minimal config.'
    );
  }
}

const eslintConfig = [
  ...nextConfig,
  {
    ignores: ["node_modules/**", ".next/**"],
  },
];

export default eslintConfig;
