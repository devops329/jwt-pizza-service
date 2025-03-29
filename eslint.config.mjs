import globals from "globals";
import pluginJs from "@eslint/js";
import pluginJest from 'eslint-plugin-jest';

/** @type {import('eslint').Linter.Config[]} */
export default [
  {
    files: ["**/*.js"],
    languageOptions: { sourceType: "commonjs", globals: globals.node },
    rules: { "no-useless-escape": "off" }
  },
  { 
    languageOptions: { globals: globals.browser },
    rules: { "no-useless-escape": "off" }
  },
  {
    languageOptions: { globals: pluginJest.environments.globals.globals },
    plugins: { jest: pluginJest },
    rules: { "no-useless-escape": "off" }
  },
  {
    ...pluginJs.configs.recommended,
    rules: { ...pluginJs.configs.recommended.rules, "no-useless-escape": "off" }
  },
];
