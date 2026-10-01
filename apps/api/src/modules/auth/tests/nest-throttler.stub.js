const recorded = new WeakMap();

function Throttle(options) {
  return (target, property) => {
    const holder = property ? target : { class: true };
    const entry = recorded.get(holder) ?? {};
    entry[property ?? "class"] = options;
    recorded.set(holder, entry);
  };
}

function __throttleOf(target, property) {
  return recorded.get(target)?.[property ?? "class"];
}

class ThrottlerGuard {}

const ThrottlerModule = { forRoot: () => ({}) };

module.exports = { Throttle, ThrottlerGuard, ThrottlerModule, __throttleOf };
