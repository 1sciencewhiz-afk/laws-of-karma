import * as THREE from "three";

/**
 * The dev tooling injects a `data-tsd-source` prop onto every JSX element.
 * react-three-fiber treats dashed props as "pierced" paths (data -> tsd -> source)
 * and throws when the intermediate objects do not exist, which crashes the scene
 * on any prop update. Giving three's base classes a lazy `data` bag makes the
 * assignment a harmless no-op.
 */
const protos: Array<Record<string, unknown>> = [
  THREE.Object3D.prototype as unknown as Record<string, unknown>,
  THREE.Material.prototype as unknown as Record<string, unknown>,
  THREE.BufferGeometry.prototype as unknown as Record<string, unknown>,
  THREE.Texture.prototype as unknown as Record<string, unknown>,
  THREE.Fog.prototype as unknown as Record<string, unknown>,
  THREE.Color.prototype as unknown as Record<string, unknown>,
];

for (const proto of protos) {
  if (proto && !("data" in proto)) {
    Object.defineProperty(proto, "data", {
      configurable: true,
      get(this: Record<string, unknown>) {
        if (!this["__devTagBag"]) this["__devTagBag"] = { tsd: {} };
        return this["__devTagBag"];
      },
      set(this: Record<string, unknown>, value: unknown) {
        this["__devTagBag"] = value;
      },
    });
  }
}

export {};
