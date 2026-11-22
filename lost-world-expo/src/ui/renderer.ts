import * as THREE from 'three';

/**
 * three.js renderer on an expo-gl context (Expo Go SDK 58), or on a browser WebGL2 context.
 *
 * Compatibility problems this file handles (see README "Renderer compatibility"):
 *
 * 1. "THREE.WebGLRenderer: WebGL 1 is not supported since r163."
 *    expo-gl 57.0.0 (expo/expo#45871) made WebGL2RenderingContext inherit from WebGLRenderingContext.
 *    three.js r163+ throws if `context instanceof WebGLRenderingContext`, so it rejects real WebGL 2
 *    contexts. expo-gl 58.0.4 (expo/expo#51572) fixed this in native code, but Expo Go ships the native
 *    code inside the app binary, built from an earlier 58.0.x, so the bug is still present in Expo Go
 *    whatever JS package version is installed. Upgrading three.js does not help (the check remains).
 *    Fix: when the context really is WebGL 2, hide the WebGLRenderingContext global only for the
 *    duration of the WebGLRenderer constructor, verify it is hidden, and restore it afterwards.
 *
 * 2. expo-gl's pixelStorei() supports only UNPACK_FLIP_Y_WEBGL and UNPACK_ALIGNMENT and logs
 *    "doesn't support this parameter yet!" for the rest. three.js sets ~10 such parameters on every
 *    texture upload, flooding the console. Defaults (0 / false) are dropped silently in JS.
 *
 * 3. expo-gl's getParameter() throws for some *_BINDING queries. three.js r187 doesn't use them, but a
 *    guard returns null instead of crashing if any code path does.
 *
 * 4. getContextAttributes() can return null on some native contexts; three.js reads `.alpha` from it.
 */

/** Minimal shape of the expo-gl context we rely on (also satisfied by a browser WebGL2 context). */
export interface GLLike {
  drawingBufferWidth: number;
  drawingBufferHeight: number;
  getContextAttributes?: () => unknown;
  [key: string]: unknown;
}

type MakeRenderer = (params: THREE.WebGLRendererParameters) => THREE.WebGLRenderer;

const defaultMake: MakeRenderer = (params) => new THREE.WebGLRenderer(params);

/** WebGL enums (stable across implementations). */
const GL = {
  UNPACK_FLIP_Y_WEBGL: 0x9240,
  UNPACK_PREMULTIPLY_ALPHA_WEBGL: 0x9241,
  UNPACK_COLORSPACE_CONVERSION_WEBGL: 0x9243,
  UNPACK_ALIGNMENT: 0x0cf5,
  PACK_ALIGNMENT: 0x0d05,
} as const;

/** three.js needs a canvas-like object; expo-gl gives us only the GL context. */
function fakeCanvas(gl: GLLike) {
  return {
    width: gl.drawingBufferWidth,
    height: gl.drawingBufferHeight,
    style: {},
    clientHeight: gl.drawingBufferHeight,
    addEventListener: () => {},
    removeEventListener: () => {},
    getContext: () => gl,
  } as unknown as HTMLCanvasElement;
}

function ensureContextAttributes(gl: GLLike) {
  const original = typeof gl.getContextAttributes === 'function' ? gl.getContextAttributes.bind(gl) : null;
  const fallback = { alpha: true, antialias: false, depth: true, stencil: false, premultipliedAlpha: true,
    preserveDrawingBuffer: false, powerPreference: 'default', failIfMajorPerformanceCaveat: false, desynchronized: false };
  gl.getContextAttributes = () => original?.() ?? fallback;
}

/** Only on expo-gl (native): drop pixelStorei parameters it doesn't implement when they're at their defaults. */
export function filterPixelStore(gl: GLLike) {
  const original = gl.pixelStorei as ((pname: number, param: number | boolean) => void) | undefined;
  if (typeof original !== 'function' || (gl as { __lwPixelStore?: boolean }).__lwPixelStore) return;
  const supported = new Set<number>([GL.UNPACK_FLIP_Y_WEBGL, GL.UNPACK_ALIGNMENT]);
  gl.pixelStorei = (pname: number, param: number | boolean) => {
    if (supported.has(pname)) return original.call(gl, pname, param);
    // PACK_ALIGNMENT and the UNPACK_* row/skip/premultiply/colorspace parameters at their defaults
    // (0 / false / 4) are what three.js sets for ordinary uploads: nothing to do.
    if (param === 0 || param === false || pname === GL.PACK_ALIGNMENT) return undefined;
    return original.call(gl, pname, param);
  };
  (gl as { __lwPixelStore?: boolean }).__lwPixelStore = true;
}

/** Only on expo-gl: return null instead of throwing for getParameter queries it doesn't implement. */
function guardGetParameter(gl: GLLike) {
  const original = gl.getParameter as ((pname: number) => unknown) | undefined;
  if (typeof original !== 'function') return;
  gl.getParameter = (pname: number) => {
    try {
      return original.call(gl, pname);
    } catch (e) {
      if (String(e).includes("doesn't support")) return null;
      throw e;
    }
  };
}

export function isWebGL2(gl: GLLike): boolean {
  return gl.supportsWebGL2 !== false && typeof gl.createVertexArray === 'function' && typeof gl.texImage3D === 'function';
}

/** expo-gl contexts carry a numeric contextId; browser contexts don't. */
export const isExpoGL = (gl: GLLike) => typeof gl.contextId === 'number';

/**
 * Run `fn` with the WebGLRenderingContext global hidden (see problem 1 above), then restore it exactly.
 * Uses the property descriptor so it also works if the global was defined non-writable.
 */
export function withWebGL1GlobalHidden<T>(fn: () => T): T {
  const g = globalThis as Record<string, unknown>;
  const desc = Object.getOwnPropertyDescriptor(g, 'WebGLRenderingContext');
  if (!desc) return fn();
  try {
    if (desc.configurable) Object.defineProperty(g, 'WebGLRenderingContext', { value: undefined, writable: true, configurable: true });
    else if (desc.writable) g.WebGLRenderingContext = undefined;
  } catch { /* fall through: verified below */ }
  if (typeof g.WebGLRenderingContext !== 'undefined') {
    // Couldn't hide it: three.js will throw with its own message; restore nothing.
    return fn();
  }
  try {
    return fn();
  } finally {
    if (desc.configurable) Object.defineProperty(g, 'WebGLRenderingContext', desc);
    else g.WebGLRenderingContext = desc.value;
  }
}

/** Create a three.js renderer on an expo-gl (or browser) context. */
export function createRenderer(gl: GLLike, make: MakeRenderer = defaultMake): THREE.WebGLRenderer {
  if (!isWebGL2(gl)) {
    throw new Error('This device only provided a WebGL 1 (OpenGL ES 2) context. The Lost World needs WebGL 2 (OpenGL ES 3).');
  }
  ensureContextAttributes(gl);
  if (isExpoGL(gl)) {
    filterPixelStore(gl);
    guardGetParameter(gl);
  }

  const WebGL1 = (globalThis as { WebGLRenderingContext?: unknown }).WebGLRenderingContext;
  const misclassified = typeof WebGL1 === 'function' && gl instanceof (WebGL1 as new () => object);
  const build = () => make({ canvas: fakeCanvas(gl), context: gl as unknown as WebGL2RenderingContext, antialias: false });
  const renderer = misclassified ? withWebGL1GlobalHidden(build) : build();
  configure(renderer);
  return renderer;
}

/** Realistic look: filmic tone mapping and soft-edged sun shadows. */
function configure(renderer: THREE.WebGLRenderer) {
  if (!renderer.shadowMap) return; // test doubles
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
}
