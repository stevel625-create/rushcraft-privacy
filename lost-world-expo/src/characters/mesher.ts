import * as THREE from 'three';
import type { BoneName } from './rig';

/**
 * Accumulates skinned geometry for one character: positions, UVs, vertex colours, bone weights,
 * split into two material buckets (skin, gear). Built once, then turned into one SkinnedMesh.
 */
export type Bucket = 'skin' | 'gear';
export type Weights = [BoneName, number][];

interface Part {
  pos: number[];
  uv: number[];
  col: number[];
  idx: number[];
  skin: number[]; // 4 bone indices per vertex
  wgt: number[];  // 4 weights per vertex
}

const newPart = (): Part => ({ pos: [], uv: [], col: [], idx: [], skin: [], wgt: [] });

export interface Ring {
  c: THREE.Vector3;
  rx: number;
  rz: number;
  color: number;
  w: Weights;
}

export class Mesher {
  private readonly parts: Record<Bucket, Part> = { skin: newPart(), gear: newPart() };

  constructor(private boneIndex: (n: BoneName) => number) {}

  private pushVertex(b: Bucket, p: THREE.Vector3, u: number, v: number, color: THREE.Color, w: Weights) {
    const part = this.parts[b];
    part.pos.push(p.x, p.y, p.z);
    part.uv.push(u, v);
    part.col.push(color.r, color.g, color.b);
    const sorted = [...w].sort((a, c) => c[1] - a[1]).slice(0, 4);
    const total = sorted.reduce((s, [, x]) => s + x, 0) || 1;
    for (let i = 0; i < 4; i++) {
      part.skin.push(sorted[i] ? this.boneIndex(sorted[i][0]) : 0);
      part.wgt.push(sorted[i] ? sorted[i][1] / total : 0);
    }
    return part.pos.length / 3 - 1;
  }

  /**
   * Tube through a list of rings (elliptical cross-sections). Each ring is oriented perpendicular to the
   * path; `up` picks which way rz faces. Caps close the ends. Sharp colour changes: repeat a ring.
   */
  loft(b: Bucket, rings: Ring[], segs = 14, caps: [boolean, boolean] = [true, true], up = new THREE.Vector3(0, 0, 1)) {
    const part = this.parts[b];
    const start = part.pos.length / 3;
    let along = 0;
    const tmp = new THREE.Vector3();
    rings.forEach((r, i) => {
      const prev = rings[Math.max(0, i - 1)].c, next = rings[Math.min(rings.length - 1, i + 1)].c;
      const axis = tmp.copy(next).sub(prev).normalize();
      if (axis.lengthSq() < 1e-8) axis.set(0, 1, 0);
      const e2 = up.clone().sub(axis.clone().multiplyScalar(up.dot(axis))).normalize();
      const e1 = new THREE.Vector3().crossVectors(e2, axis).normalize();
      if (i > 0) along += r.c.distanceTo(rings[i - 1].c);
      const col = new THREE.Color(r.color);
      for (let s = 0; s <= segs; s++) {
        const t = (s / segs) * Math.PI * 2;
        const p = r.c.clone().addScaledVector(e1, Math.cos(t) * r.rx).addScaledVector(e2, Math.sin(t) * r.rz);
        this.pushVertex(b, p, s / segs, along * 4, col, r.w);
      }
    });
    const row = segs + 1;
    for (let i = 0; i < rings.length - 1; i++)
      for (let s = 0; s < segs; s++) {
        const a = start + i * row + s, c = a + row;
        // Ring basis e1 = e2 x axis, so (a, a+1, c) faces outward (normal ~ e1).
        part.idx.push(a, a + 1, c, a + 1, c + 1, c);
      }
    const cap = (ringIdx: number, flip: boolean) => {
      const r = rings[ringIdx];
      const center = this.pushVertex(b, r.c, 0.5, 0.5, new THREE.Color(r.color), r.w);
      const base = start + ringIdx * row;
      for (let s = 0; s < segs; s++) {
        if (flip) part.idx.push(center, base + s + 1, base + s);
        else part.idx.push(center, base + s, base + s + 1);
      }
    };
    if (caps[0]) cap(0, true);
    if (caps[1]) cap(rings.length - 1, false);
  }

  /** Add an arbitrary three.js geometry (transformed by `m`) rigidly or with given weights. */
  geometry(b: Bucket, geo: THREE.BufferGeometry, m: THREE.Matrix4, color: number | ((p: THREE.Vector3) => number), w: Weights | ((p: THREE.Vector3) => Weights)) {
    const g = geo.index ? geo : geo.toNonIndexed();
    const pos = g.attributes.position as THREE.BufferAttribute;
    const uv = g.attributes.uv as THREE.BufferAttribute | undefined;
    const part = this.parts[b];
    const map: number[] = [];
    const p = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) {
      p.fromBufferAttribute(pos, i).applyMatrix4(m);
      const c = new THREE.Color(typeof color === 'function' ? color(p) : color);
      map.push(this.pushVertex(b, p.clone(), uv ? uv.getX(i) : 0, uv ? uv.getY(i) : 0, c, typeof w === 'function' ? w(p) : w));
    }
    if (g.index) for (let i = 0; i < g.index.count; i++) part.idx.push(map[g.index.getX(i)]);
    else for (let i = 0; i < pos.count; i++) part.idx.push(map[i]);
  }

  /** One BufferGeometry with two groups (skin = 0, gear = 1). */
  build(): THREE.BufferGeometry {
    const order: Bucket[] = ['skin', 'gear'];
    const pos: number[] = [], uv: number[] = [], col: number[] = [], skin: number[] = [], wgt: number[] = [], idx: number[] = [];
    const geo = new THREE.BufferGeometry();
    let groupStart = 0;
    order.forEach((b, gi) => {
      const part = this.parts[b];
      const base = pos.length / 3;
      pos.push(...part.pos); uv.push(...part.uv); col.push(...part.col); skin.push(...part.skin); wgt.push(...part.wgt);
      for (const i of part.idx) idx.push(i + base);
      geo.addGroup(groupStart, part.idx.length, gi);
      groupStart += part.idx.length;
    });
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    geo.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(skin, 4));
    geo.setAttribute('skinWeight', new THREE.Float32BufferAttribute(wgt, 4));
    geo.setIndex(idx);
    geo.computeVertexNormals();
    geo.computeBoundingBox();
    geo.computeBoundingSphere();
    return geo;
  }
}

/** Blend weights linearly between two bones by t (0 = all a, 1 = all b). */
export const blend = (a: BoneName, b: BoneName, t: number): Weights => {
  const k = Math.max(0, Math.min(1, t));
  if (k <= 0) return [[a, 1]];
  if (k >= 1) return [[b, 1]];
  return [[a, 1 - k], [b, k]];
};
