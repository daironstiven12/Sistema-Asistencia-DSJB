const babel = require("@babel/core");

module.exports = {
  process(src, path) {
    const output = babel.transformSync(src, {
      filename: path,
      babelrc: false,
      configFile: false,
      presets: [[require("@babel/preset-env"), { targets: { node: "current" }, modules: "commonjs" }]],
      plugins: [[require("@babel/plugin-proposal-decorators"), { version: "legacy" }]],
    });
    return { code: output.code };
  },
};
