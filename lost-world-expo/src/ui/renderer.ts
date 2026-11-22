import * as THREE from 'three';

/** Minimal shape of the expo-gl context we rely on (also satisfied by a browser WebGL2 context). */
export interface GLLike {
  drawingBufferWidth: number;
  drawingBufferHeight: number;
  getContextAttributes?: () => unknown;
  [key: string]: unknown;
}

type MakeRenderer = (params: THREE.WebGLRendererParameters) => THREE.WebGLRenderer;

const defaultMake: MakeRenderer = (params) => new THREE.WebGLRenderer(params);

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

/** Some native GL contexts return null here; three.js reads `.alpha` from it. */
function ensureContextAttributes(gl: GLLike) {
  const original = typeof gl.getContextAttributes === 'function' ? gl.getContextAttributes.bind(gl) : null;
  const fallback = { alpha: true, antialias: false, depth: true, stencil: false, premultipliedAlpha: true,
    preserveDrawingBuffer: false, powerPreference: 'default', failIfMajorPerformanceCaveat: false, desynchronized: false };
  gl.getContextAttributes = () => original?.() ?? fallback;
}

export function isWebGL2(gl: GLLike): boolean {
  return gl.supportsWebGL2 !== false && typeof gl.createVertexArray === 'function' && typeof gl.texImage3D === 'function';
}

/**
 * Create a three.js renderer on an expo-gl (or browser) context.
 *
 * Expo Go builds whose native expo-gl predates the fix make WebGL2RenderingContext inherit from
 * WebGLRenderingContext. three.js r163+ then mistakes the WebGL 2 context for WebGL 1 and throws
 * ("WebGL 1 is not supported since r163"). When the context really is WebGL 2, we hide the
 * WebGLRenderingContext global only while three.js runs that constructor check, then restore it.
 */
export function createRenderer(gl: GLLike, make: MakeRenderer = defaultMake): THREE.WebGLRenderer {
  if (!isWebGL2(gl)) {
    throw new Error('This device only provided a WebGL 1 (OpenGL ES 2) context. The Lost World needs WebGL 2 (OpenGL ES 3).');
  }
  ensureContextAttributes(gl);

  const g = globalThis as { WebGLRenderingContext?: unknown };
  const WebGL1 = g.WebGLRenderingContext;
  const misclassified = typeof WebGL1 === 'function' && gl instanceof (WebGL1 as new () => object);
  if (misclassified) g.WebGLRenderingContext = undefined;
  let renderer: THREE.WebGLRenderer;
  try {
    renderer = make({ canvas: fakeCanvas(gl), context: gl as unknown as WebGL2RenderingContext, antialias: false });
  } finally {
    if (misclassified) g.WebGLRenderingContext = WebGL1;
  }
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
