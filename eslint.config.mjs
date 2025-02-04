import globals from "globals";
import pluginJs from "@eslint/js";
import pluginJest from 'eslint-plugin-jest';

/** @type {import('eslint').Linter.Config[]} */
export default [
  {
    files: ["**/*.js"],
    languageOptions: { sourceType: "commonjs", globals: globals.node }
  },
  { languageOptions: { globals: globals.browser } },
  {
    languageOptions: { globals: pluginJest.environments.globals.globals },
    plugins: {jest: pluginJest}
  },
  pluginJs.configs.recommended,
];
