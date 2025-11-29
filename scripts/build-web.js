import esbuild from "esbuild";
import { babelRelayPlugin } from "./babel-relay-plugin.js";

esbuild.build({
  entryPoints: ["src/web/client/index.tsx"],
  outfile: "public/app.js",
  bundle: true,
  format: "esm",
  sourcemap: true,
  target: "es2020",
  inject: [],
  plugins: [babelRelayPlugin()],
  define: {
    "process.env.NODE_ENV": JSON.stringify("development"),
  },
}).catch(() => process.exit(1));

