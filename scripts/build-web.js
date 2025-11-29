import esbuild from "esbuild";
import { babelRelayPlugin } from "./babel-relay-plugin.js";

const ctx = await esbuild.context({
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
});

if (process.argv.includes("--watch")) {
  await ctx.watch();
  console.log("watching...");
} else {
  ctx.rebuild()
    .then(() => {
      console.log("build complete");
      process.exit(0)
    }
    )
    .catch((err) => {
      console.error("build failed", err);
      process.exit(0)
    });
}
