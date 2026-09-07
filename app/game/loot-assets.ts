import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import type { RenderKit, Surface } from './render-kit';

/**
 * Copy into app/game/loot-assets.ts.
 * buildPickup(kit, entityGroup, 'fuel');
 * buildPickup(kit, contentsGroup, 'fuse', {scale:.3, detail:'compact', decorative:true});
 *
 * Ownership: every retained geometry/material belongs to the RenderKit pools.
 * The returned Group contains no sprites, private textures, lights or hit areas.
 * Remove it with kit.disposeLocal(group); never dispose its mesh resources directly.
 * Default/full size fits inside a 0.78-tile diameter at every yaw. Scale is 0 < s <= 1.
 * Model origin is ground-centred. The lowest visible surface sits at y=0.012.
 * Decorative contents should inherit the enclosing container's selection behavior.
 */
export const PICKUP_IDS = [
  'crowbar', 'axe', 'jacket', 'vest', 'helmet', 'medkit', 'bottle', 'fuse',
  'fuel', 'keycard', 'sample', 'samplecase', 'battery', 'scrap', 'chair', 'tire', 'toolbox', 'ration',
] as const;
export type PickupId = typeof PICKUP_IDS[number];
export type PickupOptions = {
  scale?: number;
  yaw?: number;
  lift?: number;
  detail?: 'full' | 'compact';
  decorative?: boolean;
};

const C = {
  steel: 0x9daea5, edge: 0xc4cfc0, dark: 0x293c36, seam: 0x475348,
  rust: 0x87664a, copper: 0xbb8c56, cloth: 0xb99c74, ivory: 0xd8d7bd,
  red: 0x9f4f38, yellow: 0xd5b66b, green: 0x526e50, rubber: 0x33413b,
};
const Y = new THREE.Vector3(0, 1, 0);
const VERSION = 'loot:v1:';
type V3 = [number, number, number];

function object(
  kit: RenderKit, parent: THREE.Object3D, key: string,
  make: () => THREE.BufferGeometry, color: number, surface?: Surface,
) {
  const mesh = new THREE.Mesh(kit.geometry(VERSION + key, make), kit.material(color, surface));
  mesh.castShadow = true; mesh.receiveShadow = true; parent.add(mesh); return mesh;
}
function joint(parent: THREE.Object3D, x = 0, y = 0, z = 0) {
  const group = new THREE.Group(); group.position.set(x, y, z); parent.add(group); return group;
}
function rod(kit: RenderKit, parent: THREE.Object3D, a: V3, b: V3, r: number, color: number, surface?: Surface) {
  const start = new THREE.Vector3(...a), end = new THREE.Vector3(...b);
  const direction = end.clone().sub(start), length = direction.length();
  const mesh = kit.cylinder(parent, 0, -length / 2, 0, r, length, color, r, surface);
  mesh.position.copy(start.add(end).multiplyScalar(.5));
  mesh.quaternion.setFromUnitVectors(Y, direction.normalize()); return mesh;
}
function loop(
  kit: RenderKit, parent: THREE.Object3D, x: number, y: number, z: number,
  radius: number, tube: number, color: number, surface?: Surface, arc = Math.PI * 2,
) {
  const mesh = object(kit, parent, 'ring:' + radius + ':' + tube + ':' + arc,
    () => new THREE.TorusGeometry(radius, tube, 6, 24, arc), color, surface);
  mesh.rotation.x = Math.PI / 2; mesh.position.set(x, y, z); return mesh;
}
function profile(
  kit: RenderKit, parent: THREE.Object3D, key: string, points: number[][],
  depth: number, color: number, surface?: Surface, flat = false,
) {
  return object(kit, parent, key, () => {
    const shape = new THREE.Shape();
    points.forEach(([x, y], i) => i ? shape.lineTo(x, y) : shape.moveTo(x, y)); shape.closePath();
    const geometry = new THREE.ExtrudeGeometry(shape, {
      depth, bevelEnabled: true, bevelThickness: .003, bevelSize: .003,
      bevelSegments: 1, steps: 1, curveSegments: 6,
    });
    if (flat) { geometry.rotateX(Math.PI / 2); geometry.translate(0, depth, 0); }
    else geometry.translate(0, 0, -depth / 2);
    return geometry;
  }, color, surface);
}
function bolt(kit: RenderKit, parent: THREE.Object3D, x: number, y: number, z: number, radius = .012) {
  const mesh = object(kit, parent, 'bolt:' + radius,
    () => new THREE.CylinderGeometry(radius, radius, .009, 6), C.edge, 'brushedSteel');
  mesh.position.set(x, y, z); return mesh;
}
function fitToFootprint(root: THREE.Group) {
  root.updateMatrixWorld(true);
  const bounds = new THREE.Box3().setFromObject(root), center = bounds.getCenter(new THREE.Vector3());
  const point = new THREE.Vector3(); let radius = 0;
  root.traverse(child => {
    if (!(child instanceof THREE.Mesh)) return;
    const positions = child.geometry.getAttribute('position');
    for (let i = 0; i < positions.count; i++) {
      point.fromBufferAttribute(positions, i).applyMatrix4(child.matrixWorld);
      radius = Math.max(radius, Math.hypot(point.x - center.x, point.z - center.z));
    }
  });
  const factor = radius > .39 ? .39 / radius : 1;
  root.scale.setScalar(factor);
  root.position.set(-center.x * factor, -bounds.min.y * factor + .012, -center.z * factor);
}
function batch(kit: RenderKit, root: THREE.Group, signature: string) {
  root.updateMatrixWorld(true);
  const byMaterial = new Map<THREE.Material, THREE.Mesh[]>();
  root.traverse(child => {
    if (!(child instanceof THREE.Mesh) || Array.isArray(child.material)) return;
    const meshes = byMaterial.get(child.material) || [];
    meshes.push(child); byMaterial.set(child.material, meshes);
  });
  const combined: THREE.Mesh[] = []; let index = 0;
  for (const [material, meshes] of byMaterial) {
    const geometry = kit.geometry(VERSION + 'batch:' + signature + ':' + index++, () => {
      const temporary = meshes.map(mesh => {
        const geometry = mesh.geometry.index ? mesh.geometry.toNonIndexed() : mesh.geometry.clone();
        geometry.applyMatrix4(mesh.matrixWorld); return geometry;
      });
      const merged = mergeGeometries(temporary, false);
      temporary.forEach(geometry => geometry.dispose());
      if (!merged) throw new Error('Pickup geometry could not be combined: ' + signature);
      return merged;
    });
    const mesh = new THREE.Mesh(geometry, material); mesh.castShadow = true; mesh.receiveShadow = true;
    combined.push(mesh);
  }
  root.clear(); root.add(...combined);
}

export function buildPickup(
  kit: RenderKit, parent: THREE.Group, itemId: string, options: PickupOptions = {},
): THREE.Group {
  const root = new THREE.Group(), model = new THREE.Group();
  const detailed = options.detail !== 'compact';
  const B = (
    g: THREE.Object3D, x: number, y: number, z: number, w: number, h: number, d: number,
    color: number, surface?: Surface, rounded = true,
  ) => kit.box(g, x, y, z, w, h, d, color, surface, 0, rounded);
  const R = (a: V3, b: V3, r: number, color: number, surface?: Surface) => rod(kit, model, a, b, r, color, surface);

  switch (itemId) {
    case 'crowbar': {
      R([-.05, .04, -.34], [-.05, .04, .20], .021, C.steel, 'brushedSteel');
      R([-.05, .04, .20], [.005, .04, .27], .024, C.steel, 'brushedSteel');
      R([.005, .04, .27], [.10, .04, .275], .024, C.edge, 'brushedSteel');
      for (const z of [.261, .289]) B(model, .125, .023, z, .08, .025, .021, C.edge, 'brushedSteel');
      B(model, -.05, .028, -.105, .061, .038, .19, C.rubber, 'rubber');
      const tail = profile(kit, model, 'crowbar:pry', [[-.076, -.32], [-.095, -.385], [-.007, -.385], [-.025, -.32]], .022, C.edge, 'brushedSteel', true);
      tail.position.y = .025;
      if (detailed) for (let i = 0; i < 5; i++) B(model, -.05, .066, -.18 + i * .036, .059, .007, .012, C.seam);
      break;
    }
    case 'axe': {
      R([-.03, .047, -.36], [.015, .047, .295], .026, 0x997750, 'wood');
      B(model, -.023, .025, -.205, .061, .06, .205, C.rubber, 'rubber');
      const head = profile(kit, model, 'axe:head', [
        [-.08, .15], [.11, .16], [.225, .095], [.265, .30], [.15, .32], [-.09, .245],
      ], .075, C.red, undefined, true); head.position.y = .028;
      const edge = profile(kit, model, 'axe:edge', [[.225, .095], [.265, .30], [.224, .307], [.19, .112]], .078, C.edge, 'brushedSteel', true);
      edge.position.y = .027;
      B(model, -.075, .037, .20, .087, .062, .095, C.steel, 'brushedSteel');
      if (detailed) {
        for (let i = 0; i < 5; i++) B(model, -.023, .085, -.28 + i * .036, .059, .008, .011, C.seam);
        bolt(kit, model, .015, .109, .225, .015);
      }
      break;
    }
    case 'jacket': {
      B(model, 0, .015, 0, .39, .095, .47, 0x987142, 'jacket');
      for (const side of [-1, 1]) {
        const sleeve = joint(model, side * .238, .01, .016); sleeve.rotation.y = side * -.17;
        B(sleeve, 0, .009, 0, .17, .083, .36, 0x987142, 'jacket');
        B(sleeve, 0, .013, .148, .175, .075, .053, C.seam, 'canvas');
        B(model, side * .105, .111, .022, .132, .019, .128, 0x8b714c, 'canvas');
        B(model, side * .105, .133, -.025, .134, .008, .028, 0x6e6546, 'canvas');
      }
      B(model, 0, .113, 0, .013, .009, .423, C.dark);
      const collar = loop(kit, model, 0, .108, -.184, .071, .018, 0x817043, 'jacket', Math.PI * 1.65);
      collar.rotation.z = .55;
      B(model, .012, .128, -.075, .018, .009, .034, C.edge, 'brushedSteel');
      if (detailed) for (const side of [-1, 1]) {
        R([side * .172, .118, -.19], [side * .172, .118, .20], .005, 0xc3ae82);
        bolt(kit, model, side * .105, .143, -.025, .008);
      }
      break;
    }
    case 'vest': {
      profile(kit, model, 'vest:outline', [
        [-.23, .255], [.23, .255], [.24, .04], [.19, -.09], [.18, -.25],
        [.08, -.27], [.055, -.19], [-.055, -.19], [-.08, -.27], [-.18, -.25], [-.19, -.09], [-.24, .04],
      ], .095, 0x566b4f, 'canvas', true);
      B(model, 0, .102, -.058, .32, .029, .215, 0x374e42);
      for (const x of [-.155, 0, .155]) {
        B(model, x, .097, .16, .129, .066, .142, 0x647752, 'canvas');
        B(model, x, .165, .13, .13, .013, .037, C.seam, 'canvas');
      }
      for (const x of [-.225, .225]) B(model, x, .084, -.008, .047, .031, .083, C.dark, 'rubber');
      if (detailed) {
        for (const z of [-.105, -.049, .007]) B(model, 0, .134, z, .293, .008, .021, 0x879270, 'canvas');
        for (const x of [-.13, .13]) B(model, x, .103, -.218, .065, .01, .104, 0x879270, 'canvas');
      }
      break;
    }
    case 'helmet': {
      const dome = object(kit, model, 'helmet:dome',
        () => new THREE.SphereGeometry(1, 24, 14, 0, Math.PI * 2, 0, Math.PI / 2), 0x67795c, 'steel');
      dome.scale.set(.278, .225, .259); dome.position.y = .035;
      const brim = loop(kit, model, 0, .035, 0, .278, .015, C.seam, 'rubber'); brim.scale.y = .935;
      B(model, 0, .021, .254, .34, .034, .081, 0x728362, 'steel');
      for (const side of [-1, 1]) {
        R([side * .235, .042, .09], [side * .17, .016, .302], .012, 0x95815b, 'canvas');
        R([side * .17, .016, .302], [side * .052, .016, .337], .011, 0x95815b, 'canvas');
        if (detailed) {
          const rivet = bolt(kit, model, side * .273, .07, .018, .016); rivet.rotation.z = Math.PI / 2;
        }
      }
      B(model, 0, .005, .337, .09, .022, .038, C.steel, 'brushedSteel');
      if (detailed) B(model, -.055, .239, -.045, .074, .008, .075, 0xa9ad86);
      break;
    }
    case 'medkit': {
      B(model, 0, .013, 0, .44, .15, .335, C.ivory, 'canvas');
      B(model, 0, .067, 0, .451, .022, .346, 0x9d9e82);
      B(model, 0, .166, 0, .078, .009, .216, C.red);
      B(model, 0, .166, 0, .216, .009, .078, C.red);
      R([-.084, .08, -.184], [-.084, .08, -.24], .012, C.red, 'canvas');
      R([-.084, .08, -.24], [.084, .08, -.24], .014, C.red, 'canvas');
      R([.084, .08, -.24], [.084, .08, -.184], .012, C.red, 'canvas');
      if (detailed) {
        R([.282, .068, -.058], [.282, .068, .08], .063, C.ivory, 'canvas');
        loop(kit, model, .282, .068, .083, .026, .008, 0x9b9b80).rotation.x = 0;
        B(model, .19, .091, .138, .035, .009, .041, C.steel, 'brushedSteel');
      }
      break;
    }
    case 'bottle': {
      object(kit, model, 'bottle:glass', () => new THREE.LatheGeometry([
        [0, 0], [.085, 0], [.099, .026], [.099, .281], [.09, .325],
        [.039, .379], [.035, .481], [.043, .493], [.043, .515], [0, .515],
      ].map(([x, y]) => new THREE.Vector2(x, y)), 20), 0x6f9d77, 'glass');
      kit.cylinder(model, 0, .118, 0, .1005, .147, 0x9b9970, .1005, 'canvas');
      B(model, 0, .145, .102, .113, .09, .004, 0x496447);
      B(model, 0, .176, .106, .066, .025, .005, C.ivory);
      kit.cylinder(model, 0, .51, 0, .043, .018, C.copper, .043, 'brushedSteel');
      if (detailed) {
        loop(kit, model, 0, .037, 0, .095, .004, 0x91b893, 'glass');
        loop(kit, model, 0, .496, 0, .042, .004, C.edge, 'brushedSteel');
      }
      break;
    }
    case 'fuse': {
      R([0, .072, -.18], [0, .072, .18], .062, C.ivory);
      for (const z of [-.20, .20]) {
        R([0, .072, z - .037], [0, .072, z + .037], .071, C.steel, 'brushedSteel');
        const groove = loop(kit, model, 0, .072, z, .072, .004, C.seam); groove.rotation.x = 0;
      }
      B(model, 0, .133, -.012, .041, .008, .149, C.copper, 'brushedSteel');
      B(model, 0, .124, .083, .083, .012, .022, C.red);
      if (detailed) for (const z of [-.09, -.065, -.04]) B(model, -.017, .14, z, .019, .004, .01, C.dark);
      break;
    }
    case 'fuel': {
      profile(kit, model, 'fuel:can', [
        [-.185, .015], [.185, .015], [.19, .39], [.135, .455], [-.13, .455], [-.185, .409],
      ], .233, 0xb19b50, 'steel');
      B(model, 0, .018, 0, .393, .025, .249, C.seam, 'steel');
      for (const side of [-1, 1]) {
        const z = side * .123;
        R([-.13, .135, z], [.12, .345, z], .013, 0xcfb873);
        R([-.13, .345, z], [.12, .135, z], .013, 0xcfb873);
      }
      R([-.055, .449, 0], [-.055, .551, 0], .025, 0x9c8e4d, 'steel');
      R([-.055, .551, 0], [.11, .551, 0], .028, 0xb6a366, 'steel');
      R([.11, .551, 0], [.13, .448, 0], .025, 0x9c8e4d, 'steel');
      kit.cylinder(model, -.14, .427, .018, .049, .063, C.seam, .049, 'brushedSteel');
      kit.cylinder(model, -.14, .489, .018, .058, .022, C.copper, .058, 'brushedSteel');
      B(model, -.14, .509, .018, .085, .017, .023, C.seam);
      if (detailed) {
        B(model, .089, .283, .127, .087, .069, .006, 0xe0c88e);
        B(model, .089, .312, .134, .018, .03, .003, C.red);
        for (const x of [-.12, .12]) bolt(kit, model, x, .456, -.064, .01);
      }
      break;
    }
    case 'keycard': {
      const card = object(kit, model, 'keycard:card', () => {
        const shape = new THREE.Shape(); shape.moveTo(-.143, -.225);
        shape.lineTo(.143, -.225); shape.lineTo(.143, .225); shape.lineTo(-.143, .225); shape.closePath();
        const hole = new THREE.Path(); hole.absellipse(0, -.18, .043, .014, 0, Math.PI * 2, true); shape.holes.push(hole);
        const geometry = new THREE.ExtrudeGeometry(shape, {depth:.011, bevelEnabled:true, bevelThickness:.002, bevelSize:.006, bevelSegments:2});
        geometry.rotateX(Math.PI / 2); geometry.translate(0, .014, 0); return geometry;
      }, C.ivory);
      card.position.y = .01;
      B(model, 0, .028, .164, .258, .003, .047, C.dark);
      B(model, -.064, .028, -.077, .099, .003, .129, 0x698d8b);
      B(model, .065, .029, -.093, .072, .004, .087, C.copper, 'brushedSteel');
      for (const z of [-.112, -.083]) B(model, .065, .033, z, .071, .002, .004, C.seam);
      B(model, .065, .033, -.093, .004, .002, .084, C.seam);
      for (const [z, width] of [[.021, .19], [.048, .16], [.078, .208]]) B(model, 0, .029, z, width, .003, .008, 0x768574);
      R([-.026, .033, -.188], [-.053, .018, -.316], .01, C.seam, 'canvas');
      R([-.053, .018, -.316], [.039, .018, -.363], .01, C.seam, 'canvas');
      R([.039, .018, -.363], [.042, .024, -.189], .01, C.seam, 'canvas');
      if (detailed) B(model, -.064, .033, -.079, .034, .004, .073, C.ivory);
      break;
    }
    case 'samplecase': {
      B(model,0,.015,0,.48,.25,.34,C.ivory,'brushedSteel');
      B(model,0,.265,0,.49,.045,.35,C.green,'carPaint');
      for(const x of [-.17,.17]){B(model,x,.055,0,.025,.24,.355,C.edge,'brushedSteel');B(model,x,.2,.18,.05,.1,.025,C.dark);}
      R([-.09,.315,0],[-.09,.38,0],.014,C.dark,'rubber');
      R([-.09,.38,0],[.09,.38,0],.014,C.dark,'rubber');
      R([.09,.38,0],[.09,.315,0],.014,C.dark,'rubber');
      B(model,0,.1,.174,.13,.09,.006,C.green);B(model,0,.105,.181,.023,.075,.006,C.ivory);B(model,0,.131,.182,.09,.023,.006,C.ivory);
      break;
    }
    case 'sample': {
      kit.cylinder(model, 0, .025, 0, .091, .32, 0x83c59e, .091, 'glass');
      kit.cylinder(model, 0, .016, 0, .113, .052, C.seam, .113, 'rubber');
      kit.cylinder(model, 0, .353, 0, .115, .068, C.edge, .115, 'brushedSteel');
      kit.cylinder(model, 0, .422, 0, .074, .017, C.yellow, .074);
      for (const angle of [0, Math.PI * 2 / 3, Math.PI * 4 / 3]) {
        const x = Math.cos(angle) * .098, z = Math.sin(angle) * .098;
        R([x, .069, z], [x, .351, z], .009, C.steel, 'brushedSteel');
      }
      B(model, 0, .129, .096, .121, .158, .009, C.ivory);
      B(model, 0, .176, .107, .079, .064, .006, 0x4d8864);
      if (detailed) {
        for (const z of [-.035, 0, .035]) B(model, 0, .44, z, .062, .005, .009, C.seam);
        B(model, 0, .145, .112, .067, .004, .004, C.dark);
      }
      break;
    }
    case 'battery': {
      B(model, 0, .015, 0, .395, .273, .277, C.dark, 'rubber');
      B(model, 0, .289, 0, .416, .042, .293, C.seam, 'rubber');
      for (const [x, color] of [[-.127, C.red], [.127, C.dark]]) {
        kit.cylinder(model, x, .332, -.075, .036, .019, color, .036);
        kit.cylinder(model, x, .352, -.075, .022, .037, C.edge, .022, 'brushedSteel');
      }
      R([-.104, .328, .07], [-.104, .421, .07], .013, C.seam);
      R([-.104, .421, .07], [.104, .421, .07], .018, C.dark, 'rubber');
      R([.104, .421, .07], [.104, .328, .07], .013, C.seam);
      B(model, 0, .099, .141, .272, .128, .006, C.ivory);
      const lightning = profile(kit, model, 'battery:lightning', [[.008, .218], [-.04, .161], [-.005, .16], [-.017, .114], [.042, .18], [.009, .18]], .008, C.red);
      lightning.position.z = .149;
      if (detailed) {
        for (const x of [-.14, -.084, -.028, .028, .084, .14]) kit.cylinder(model, x, .332, -.01, .017, .013, C.copper, .017);
        for (const x of [-.16, -.11, .11, .16]) B(model, x, .051, .142, .011, .198, .014, C.seam);
      }
      break;
    }
    case 'scrap': {
      for (let i = 0; i < 3; i++) {
        const piece = joint(model, (i - 1) * .082, i * .035, 0); piece.rotation.y = (i - 1) * .42;
        B(piece, 0, .02, 0, .26, .021, .46, i === 1 ? C.rust : C.steel, i === 1 ? 'steel' : 'corrugated');
        if (detailed) for (const x of [-.09, -.03, .03, .09]) B(piece, x, .042, 0, .024, .012, .455, C.seam, 'steel');
      }
      R([-.245, .046, -.195], [.20, .118, .22], .018, C.rust, 'steel');
      const angle = profile(kit, model, 'scrap:bent-tab', [[-.15, 0], [.10, 0], [.09, .075], [-.075, .10]], .03, C.copper, 'steel');
      angle.position.set(.045, .11, -.03);
      if (detailed) for (const x of [-.14, .04]) loop(kit, model, x, .129, .08, .026, .009, C.rust, 'brushedSteel');
      break;
    }
    case 'chair': {
      for (const side of [-1, 1]) {
        R([side * .275, .041, -.34], [side * .275, .041, .32], .021, C.steel, 'brushedSteel');
        R([side * .247, .071, -.255], [side * .22, .109, .335], .019, C.steel, 'brushedSteel');
        B(model, side * .275, .019, .307, .058, .05, .068, C.rubber, 'rubber');
        B(model, side * .275, .019, -.313, .058, .05, .062, C.rubber, 'rubber');
      }
      R([-.275, .041, -.34], [.275, .041, -.34], .021, C.steel, 'brushedSteel');
      R([-.22, .109, .335], [.22, .109, .335], .019, C.steel, 'brushedSteel');
      B(model, 0, .075, -.233, .475, .047, .194, 0x728b65, 'canvas');
      B(model, 0, .089, .108, .455, .045, .27, 0x819771, 'canvas');
      for (const side of [-1, 1]) bolt(kit, model, side * .259, .122, .011, .022);
      if (detailed) {
        for (const x of [-.20, .20]) R([x, .138, -.012], [x, .138, .224], .006, 0xacb48f);
        R([-.21, .071, -.01], [.21, .109, .235], .014, C.seam, 'brushedSteel');
      }
      break;
    }
    case 'tire': {
      const tire = object(kit, model, 'tire:body', () => new THREE.LatheGeometry([
        [.187, -.076], [.203, -.103], [.289, -.103], [.326, -.071], [.326, .071],
        [.289, .103], [.203, .103], [.187, .076], [.187, -.076],
      ].map(([x, y]) => new THREE.Vector2(x, y)), 32), C.rubber, 'rubber');
      tire.position.y = .108;
      loop(kit, model, 0, .215, 0, .259, .006, C.seam, 'rubber');
      loop(kit, model, 0, .198, 0, .195, .009, C.dark, 'rubber');
      for (let i = 0; i < (detailed ? 24 : 12); i++) {
        const angle = i / (detailed ? 24 : 12) * Math.PI * 2;
        const tread = B(model, Math.sin(angle) * .327, .057, Math.cos(angle) * .327, .049, .105, .016, C.seam, 'rubber');
        tread.rotation.y = angle + .27;
      }
      break;
    }
    case 'toolbox': {
      B(model, 0, .014, 0, .542, .212, .308, 0x936148, 'steel');
      B(model, 0, .23, 0, .562, .057, .322, 0xac7b53, 'steel');
      B(model, 0, .217, .159, .53, .012, .014, C.dark);
      R([-.106, .29, 0], [-.106, .38, 0], .016, C.steel, 'brushedSteel');
      R([-.106, .38, 0], [.106, .38, 0], .023, C.dark, 'rubber');
      R([.106, .38, 0], [.106, .29, 0], .016, C.steel, 'brushedSteel');
      for (const x of [-.165, .165]) {
        B(model, x, .156, .166, .061, .108, .017, C.steel, 'brushedSteel');
        B(model, x, .185, .178, .034, .032, .017, C.dark);
      }
      if (detailed) for (const x of [-.244, .244]) for (const z of [-.128, .128]) {
        B(model, x, .025, z, .036, .168, .039, C.seam, 'steel');
        bolt(kit, model, x, .293, z, .009);
      }
      break;
    }
    case 'ration': {
      kit.cylinder(model, 0, .012, 0, .131, .273, C.steel, .131, 'brushedSteel');
      kit.cylinder(model, 0, .049, 0, .133, .203, 0x788460, .133, 'canvas');
      for (const y of [.016, .285]) loop(kit, model, 0, y, 0, .13, .008, C.edge, 'brushedSteel');
      B(model, 0, .092, .134, .13, .117, .003, C.ivory);
      B(model, 0, .173, .139, .105, .009, .003, C.red);
      for (const x of [-.031, .027]) kit.ellipsoid(model, x, .139, .142, .017, .027, .004, C.copper);
      const tab = loop(kit, model, .015, .294, .024, .034, .006, C.edge, 'brushedSteel'); tab.scale.y = .66;
      B(model, .015, .289, -.009, .019, .009, .052, C.steel, 'brushedSteel');
      if (detailed) {
        loop(kit, model, 0, .288, 0, .107, .003, C.seam, 'brushedSteel');
        for (const y of [.032, .266]) loop(kit, model, 0, y, 0, .132, .003, C.seam, 'brushedSteel');
      }
      break;
    }
    default: {
      // Keep future item IDs visible until their dedicated model is added.
      B(model, 0, .015, 0, .31, .14, .37, C.cloth, 'canvas');
      B(model, 0, .158, 0, .04, .009, .372, C.seam, 'canvas');
      B(model, 0, .158, 0, .312, .009, .04, C.seam, 'canvas');
    }
  }

  // Normalize before joining a transformed scene/entity parent; cache geometry in local space.
  fitToFootprint(model); root.add(model);
  batch(kit, root, itemId + ':' + (detailed ? 'full' : 'compact'));
  const scale = options.scale !== undefined && Number.isFinite(options.scale) && options.scale > 0
    ? Math.min(1, options.scale) : 1;
  root.scale.setScalar(scale);
  root.rotation.y = Number.isFinite(options.yaw) ? options.yaw! : 0;
  root.position.y = Number.isFinite(options.lift) ? options.lift! : 0;
  root.name = 'pickup:' + itemId; root.userData.pickupId = itemId;
  if (options.decorative) root.traverse(child => { child.userData.noPick = true; });
  parent.add(root); return root;
}
