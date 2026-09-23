export type Dir = "up" | "down" | "left" | "right";

const keys = { up: false, down: false, left: false, right: false, jump: false, interact: false };
const touch = { up: false, down: false, left: false, right: false, jump: false, interact: false };

export function setTouch(k: keyof typeof touch, v: boolean) {
  touch[k] = v;
}

export function clearTouch() {
  (Object.keys(touch) as (keyof typeof touch)[]).forEach((k) => (touch[k] = false));
}

export function readInput() {
  return {
    up: keys.up || touch.up,
    down: keys.down || touch.down,
    left: keys.left || touch.left,
    right: keys.right || touch.right,
    jump: keys.jump || touch.jump,
    interact: keys.interact || touch.interact,
  };
}

export function consumeJump() {
  const j = keys.jump || touch.jump;
  keys.jump = false;
  touch.jump = false;
  return j;
}

export function bindKeyboard(onKey: (code: string) => void) {
  const down = (e: KeyboardEvent) => {
    switch (e.code) {
      case "KeyW":
      case "ArrowUp":
        keys.up = true;
        break;
      case "KeyS":
      case "ArrowDown":
        keys.down = true;
        break;
      case "KeyA":
      case "ArrowLeft":
        keys.left = true;
        break;
      case "KeyD":
      case "ArrowRight":
        keys.right = true;
        break;
      case "Space":
        keys.jump = true;
        e.preventDefault();
        break;
      case "KeyE":
        keys.interact = true;
        break;
      default:
        break;
    }
    onKey(e.code);
  };
  const up = (e: KeyboardEvent) => {
    switch (e.code) {
      case "KeyW":
      case "ArrowUp":
        keys.up = false;
        break;
      case "KeyS":
      case "ArrowDown":
        keys.down = false;
        break;
      case "KeyA":
      case "ArrowLeft":
        keys.left = false;
        break;
      case "KeyD":
      case "ArrowRight":
        keys.right = false;
        break;
      case "Space":
        keys.jump = false;
        break;
      case "KeyE":
        keys.interact = false;
        break;
      default:
        break;
    }
  };
  window.addEventListener("keydown", down);
  window.addEventListener("keyup", up);
  return () => {
    window.removeEventListener("keydown", down);
    window.removeEventListener("keyup", up);
  };
}
