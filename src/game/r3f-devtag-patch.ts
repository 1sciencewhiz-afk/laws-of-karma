import React from "react";

/**
 * The preview tooling injects a `data-tsd-source` prop onto every JSX element.
 * react-three-fiber treats dashed props as "pierced" paths (data -> tsd -> source)
 * and throws on every prop update inside <Canvas>, blanking the scene.
 *
 * Fix: strip that debug prop from non-DOM (three.js) elements before React sees it.
 */
const TAG = "data-tsd-source";

const isDomTag = (() => {
  const cache = new Map<string, boolean>();
  return (type: string) => {
    if (typeof document === "undefined") return true;
    let hit = cache.get(type);
    if (hit === undefined) {
      let ok = true;
      try {
        ok = !(document.createElement(type) instanceof HTMLUnknownElement);
      } catch {
        ok = false;
      }
      cache.set(type, ok);
      hit = ok;
    }
    return hit;
  };
})();

type CreateElement = typeof React.createElement;
const R = React as unknown as { createElement: CreateElement; __devTagPatched?: boolean };

if (!R.__devTagPatched) {
  R.__devTagPatched = true;
  const original = R.createElement.bind(React) as CreateElement;
  R.createElement = ((type: unknown, props: Record<string, unknown> | null, ...children: unknown[]) => {
    if (props && TAG in props && typeof type === "string" && !isDomTag(type)) {
      const { [TAG]: _omit, ...rest } = props;
      return original(type as never, rest as never, ...(children as never[]));
    }
    return original(type as never, props as never, ...(children as never[]));
  }) as CreateElement;
}

export {};
