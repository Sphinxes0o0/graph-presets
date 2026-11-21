import esbuild from "esbuild";
import process from "process";

const prod = process.argv[2] === "production";

const buildOptions = {
  entryPoints: ["src/main.ts"],
  bundle: true,
  external: ["obsidian", "electron"],
  format: "cjs",
  target: "es2020",
  logLevel: "info",
  sourcemap: prod ? false : "inline",
  treeShaking: true,
  outfile: "main.js",
};

if (prod) {
  await esbuild.build(buildOptions);
} else {
  const context = await esbuild.context(buildOptions);
  await context.watch();
}
