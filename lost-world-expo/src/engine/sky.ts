import * as THREE from 'three';

const vertexShader = /* glsl */ `
varying vec3 vDir;
void main() {
  vDir = normalize(position);
  vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  gl_Position = p.xyww; // always at the far plane
}`;

const fragmentShader = /* glsl */ `
uniform vec3 zenith;
uniform vec3 horizon;
uniform vec3 ground;
uniform vec3 sunDir;
uniform vec3 sunColor;
uniform float sunSize;
varying vec3 vDir;
void main() {
  vec3 d = normalize(vDir);
  float h = d.y;
  vec3 col = h > 0.0 ? mix(horizon, zenith, pow(h, 0.55)) : mix(horizon, ground, clamp(-h * 3.0, 0.0, 1.0));
  float s = max(dot(d, normalize(sunDir)), 0.0);
  col += sunColor * (pow(s, 900.0 / sunSize) * 1.6 + pow(s, 12.0) * 0.18);
  gl_FragColor = vec4(col, 1.0);
  #include <colorspace_fragment>
}`;

/** Gradient sky dome with a sun glow. Horizon matches the fog colour so distant scenery blends in. */
export class SkyDome {
  readonly mesh: THREE.Mesh;
  private readonly material: THREE.ShaderMaterial;

  constructor() {
    this.material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        zenith: { value: new THREE.Color() },
        horizon: { value: new THREE.Color() },
        ground: { value: new THREE.Color() },
        sunDir: { value: new THREE.Vector3(0, 1, 0) },
        sunColor: { value: new THREE.Color() },
        sunSize: { value: 1 },
      },
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
    });
    this.mesh = new THREE.Mesh(new THREE.SphereGeometry(200, 24, 12), this.material);
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = -1;
  }

  setTheme(sky: number, fog: number, sunColor: number, sunFrom: { x: number; y: number; z: number }, sunVisible: boolean) {
    const u = this.material.uniforms;
    const zenith = new THREE.Color(sky);
    const hsl = { h: 0, s: 0, l: 0 };
    zenith.getHSL(hsl);
    // Deeper, more saturated overhead than at the horizon, like a real sky.
    u.zenith.value.setHSL(hsl.h, Math.min(1, hsl.s * 1.25), hsl.l * 0.72);
    u.horizon.value.set(fog);
    u.ground.value.set(fog).multiplyScalar(0.55);
    u.sunDir.value.set(sunFrom.x, sunFrom.y, sunFrom.z).normalize();
    u.sunColor.value.set(sunVisible ? sunColor : 0x000000);
  }

  follow(camera: THREE.Camera) {
    this.mesh.position.copy(camera.position);
  }
}
