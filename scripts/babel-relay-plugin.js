import { transformAsync } from "@babel/core";
import fs from "node:fs";

export function babelRelayPlugin() {
  return {
    name: "babel-relay",
    setup(build) {
      build.onLoad({ filter: /\.[jt]sx?$/ }, async (args) => {
        const source = await fs.promises.readFile(args.path, "utf8");

        const result = await transformAsync(source, {
          filename: args.path,
          presets: [
            ["@babel/preset-react", { runtime: "automatic", importSource: "react" }],
            "@babel/preset-typescript",
          ],
          plugins: ["relay"],
          sourceMaps: true,
        });

        return {
          contents: result.code,
          loader: args.path.endsWith(".ts") ? "ts" : "tsx",
        };
      });
    },
  };
}

