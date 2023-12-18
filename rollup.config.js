import { nodeResolve } from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import babel from "@rollup/plugin-babel";
import terser from "@rollup/plugin-terser";
import run from "@rollup/plugin-run";
import json from "@rollup/plugin-json";
import del from "rollup-plugin-delete";
import copy from "rollup-plugin-copy";

const dev = process.env.ROLLUP_WATCH === "true";

const config = {
  input: dev ? "test/start.js" : "src/index.js",
  output: {
    file: "dist/index.js",
    inlineDynamicImports: true,
    sourcemap: false,
  },
  plugins: [
    nodeResolve({ preferBuiltins: true }),
    commonjs(),
    json(),
    babel({ exclude: "node_modules/**", babelHelpers: "runtime" }),
  ],
  external: [/@babel\/runtime/, /node_modules/],
};

if (!dev) {
  config.plugins = [
    ...config.plugins,

    terser(),
    del({ targets: "dist/*" }),
    copy({
      targets: [
        {
          src: "package.json",
          dest: "dist",
        },
      ],
    }),
  ];
} else {
  Object.assign(config.output, {
    sourcemap: true,
  });

  config.plugins = [
    ...config.plugins,

    run({
      execArgv: ["-r", "source-map-support/register"],
    }),
  ];
}

export default config;
