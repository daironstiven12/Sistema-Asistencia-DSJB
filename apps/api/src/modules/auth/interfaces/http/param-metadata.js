require("reflect-metadata");

function exposeParams(target, method, types) {
  Reflect.defineMetadata("design:paramtypes", types, target.prototype, method);
}

module.exports = { exposeParams };
