import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { ART } from './art';
export type Surface = keyof typeof ART.surfaces;
// Metres per repeat keep planks, tile joints and fabric grain at a consistent scale.
const SURFACES:Record<Surface,{metres:number;roughness:number;metalness:number;bump:number;tint:number}>={
  concrete:{metres:2.5,roughness:.94,metalness:.025,bump:.025,tint:.42},
  asphalt:{metres:2.5,roughness:.91,metalness:.025,bump:.025,tint:.42},
  steel:{metres:2.5,roughness:.69,metalness:.28,bump:.025,tint:.42},
  paving:{metres:2.5,roughness:.91,metalness:.025,bump:.085,tint:.42},
  wood:{metres:1.1,roughness:.98,metalness:0,bump:.038,tint:.78},
  carPaint:{metres:1.8,roughness:.58,metalness:.25,bump:.018,tint:.88},
  rubber:{metres:.55,roughness:.96,metalness:0,bump:.018,tint:.82},
  brushedSteel:{metres:1.1,roughness:.42,metalness:.8,bump:.006,tint:.8},
  tiles:{metres:3.2,roughness:.72,metalness:.05,bump:.016,tint:.86},
  vinyl:{metres:1.4,roughness:.83,metalness:0,bump:.02,tint:.9},
  corrugated:{metres:1.5,roughness:.72,metalness:.35,bump:.055,tint:.78},
  glass:{metres:1.2,roughness:.22,metalness:.2,bump:.002,tint:.88},
  canvas:{metres:.6,roughness:1,metalness:0,bump:.012,tint:.62},
  jacket:{metres:.65,roughness:1,metalness:0,bump:.011,tint:.68},
  denim:{metres:.5,roughness:1,metalness:0,bump:.008,tint:.62},
  bark:{metres:.8,roughness:.98,metalness:0,bump:.055,tint:.8},
};
export function createRenderKit(renderer: THREE.WebGLRenderer) {
  const geometries=new Map<string,THREE.BufferGeometry>();
  const materials=new Map<string,THREE.MeshStandardMaterial>();
  const textures=new Set<THREE.Texture>();
  const maps={} as Record<Surface,THREE.Texture>;
  const detailMaps={} as Record<Surface,THREE.Texture>;
  let disposed=false;
  for(const [name,url] of Object.entries(ART.surfaces)) {
    const texture=new THREE.TextureLoader().load(url,loaded=>{if(disposed)loaded.dispose()});
    texture.colorSpace=THREE.SRGBColorSpace;
    texture.wrapS=texture.wrapT=THREE.MirroredRepeatWrapping;
    texture.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());
    textures.add(texture);maps[name as Surface]=texture;
    const detail=new THREE.TextureLoader().load(url.replace('.webp','-detail.webp'),loaded=>{if(disposed)loaded.dispose()});
    detail.wrapS=detail.wrapT=THREE.MirroredRepeatWrapping;detail.anisotropy=texture.anisotropy;textures.add(detail);detailMaps[name as Surface]=detail;
  }
  const material=(color:number,surface?:Surface,glow=0)=>{
    const key=`${color}:${surface}:${glow}`;
    if(!materials.has(key)){
      const tint=new THREE.Color(color);
      const profile=surface?SURFACES[surface]:undefined;
      if(profile)tint.lerp(new THREE.Color(0xffffff),profile.tint);
      materials.set(key,new THREE.MeshStandardMaterial({
        color:tint,map:surface?maps[surface]:null,bumpMap:surface?detailMaps[surface]:null,bumpScale:profile?.bump??0,roughness:profile?.roughness??.9,
        metalness:profile?.metalness??.025,emissive:glow,emissiveIntensity:glow?2.2:0,
      }));
    }
    return materials.get(key)!;
  };
  const geometry=(key:string,make:()=>THREE.BufferGeometry)=>{
    if(!geometries.has(key))geometries.set(key,make());return geometries.get(key)!;
  };
  const boxGeometry=(w:number,h:number,d:number,rounded=false,metres=2.5)=>geometry(`box:${w}:${h}:${d}:${rounded}:${metres}`,()=>{
    const g=rounded?new RoundedBoxGeometry(w,h,d,2,Math.min(w,h,d)*.16):new THREE.BoxGeometry(w,h,d);
    const p=g.attributes.position,n=g.attributes.normal,uv=g.attributes.uv;
    for(let i=0;i<p.count;i++){
      const nx=Math.abs(n.getX(i)),ny=Math.abs(n.getY(i));
      // All albedo crops are 4:3. Preserve square tile joints and fabric weave in world space.
      uv.setXY(i,(nx>.75?p.getZ(i):p.getX(i))/metres,(ny>.75?p.getZ(i):p.getY(i))/(metres*.75));
    }
    return g;
  });
  function box(parent:THREE.Object3D,x:number,y:number,z:number,w:number,h:number,d:number,color:number,surface?:Surface,glow=0,rounded=false){
    const mesh=new THREE.Mesh(boxGeometry(w,h,d,rounded,surface?SURFACES[surface].metres:2.5),material(color,surface,glow));
    mesh.position.set(x,y+h/2,z);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;
  }
  function cylinder(parent:THREE.Object3D,x:number,y:number,z:number,r:number,h:number,color:number,top=r,surface?:Surface){
    const metres=surface?SURFACES[surface].metres:2.5;
    const mesh=new THREE.Mesh(geometry(`cyl:${r}:${top}:${h}:${metres}`,()=>{
      const g=new THREE.CylinderGeometry(top,r,h,12),uv=g.attributes.uv,n=g.attributes.normal,p=g.attributes.position;
      for(let i=0;i<uv.count;i++){
        if(Math.abs(n.getY(i))>.75)uv.setXY(i,p.getX(i)/metres,p.getZ(i)/(metres*.75));
        else uv.setXY(i,uv.getX(i)*2*Math.PI*Math.max(r,top)/metres,uv.getY(i)*h/(metres*.75));
      }
      return g;
    }),material(color,surface));
    mesh.position.set(x,y+h/2,z);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;
  }
  function ellipsoid(parent:THREE.Object3D,x:number,y:number,z:number,sx:number,sy:number,sz:number,color:number,surface?:Surface){
    const metres=surface?SURFACES[surface].metres:0;
    const mesh=new THREE.Mesh(geometry(metres?`ellipsoid:${sx}:${sy}:${sz}:${metres}`:'sphere',()=>{
      const g=new THREE.SphereGeometry(1,24,18);
      if(metres){
        const uv=g.attributes.uv,p=g.attributes.position;
        const circumference=2*Math.PI*Math.sqrt((sx*sx+sz*sz)/2);
        for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)*circumference/metres,p.getY(i)*sy/(metres*.75));
      }
      return g;
    }),material(color,surface));
    mesh.position.set(x,y,z);mesh.scale.set(sx,sy,sz);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;
  }
  function limb(parent:THREE.Object3D,x:number,y:number,z:number,radius:number,length:number,color:number,surface?:Surface){
    const joint=new THREE.Group();joint.position.set(x,y,z);parent.add(joint);
    const metres=surface?SURFACES[surface].metres:0;
    const shape=new THREE.Mesh(geometry(`capsule:${radius}:${length}:${metres}`,()=>{
      const g=new THREE.CapsuleGeometry(radius,Math.max(.01,length-radius*2),6,12);
      if(metres){const uv=g.attributes.uv,p=g.attributes.position;for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)*2*Math.PI*radius/metres,p.getY(i)/(metres*.75));}
      return g;
    }),material(color,surface));
    shape.position.y=-length/2;shape.castShadow=true;shape.receiveShadow=true;joint.add(shape);return joint;
  }
  const contactCanvas=document.createElement('canvas');contactCanvas.width=128;contactCanvas.height=128;
  const ctx=contactCanvas.getContext('2d')!;const gradient=ctx.createRadialGradient(64,64,5,64,64,63);
  gradient.addColorStop(0,'rgba(0,0,0,.75)');gradient.addColorStop(.35,'rgba(0,0,0,.48)');gradient.addColorStop(1,'rgba(0,0,0,0)');
  ctx.fillStyle=gradient;ctx.fillRect(0,0,128,128);const contactMap=new THREE.CanvasTexture(contactCanvas);textures.add(contactMap);
  const contactMaterial=new THREE.MeshBasicMaterial({map:contactMap,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1});
  const extras=new Set<THREE.Material>();
  function contact(parent:THREE.Object3D,x:number,z:number,w:number,d:number){const shadow=new THREE.Mesh(geometry('plane',()=>new THREE.PlaneGeometry(1,1)),contactMaterial);shadow.rotation.x=-Math.PI/2;shadow.position.set(x,.018,z);shadow.scale.set(w,d,1);shadow.userData.noPick=true;parent.add(shadow);return shadow;}
  const ringGeometry=geometry('ring',()=>new THREE.RingGeometry(.91,1,40));
  function ring(parent:THREE.Object3D,x:number,z:number,r:number,color:number,opacity=.6){
    const m=new THREE.MeshBasicMaterial({color,transparent:true,opacity,side:THREE.DoubleSide,depthWrite:false});extras.add(m);
    const mesh=new THREE.Mesh(ringGeometry,m);mesh.rotation.x=-Math.PI/2;mesh.position.set(x,.029,z);mesh.scale.setScalar(r);mesh.userData.baseRadius=r;mesh.userData.noPick=true;parent.add(mesh);return mesh;
  }
  function disposeLocal(root:THREE.Object3D){root.traverse(o=>{
    if(o instanceof THREE.Sprite){o.material.map?.dispose();o.material.dispose()}
    if(o instanceof THREE.Mesh){const ms=Array.isArray(o.material)?o.material:[o.material];for(const m of ms)if(extras.delete(m)){(m as THREE.MeshBasicMaterial).map?.dispose();m.dispose();}}
  });root.clear();}
  return {box,cylinder,ellipsoid,limb,contact,ring,material,geometry,maps,extras,disposeLocal,
    dispose(){disposed=true;geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());extras.forEach(m=>m.dispose());contactMaterial.dispose();},
  };
}
export type RenderKit = ReturnType<typeof createRenderKit>;
const CHAR_DOWN = new THREE.Vector3(0,-1,0);
const charClamp=(n:number)=>THREE.MathUtils.clamp(n,0,1);
const charSmooth=(n:number)=>{const t=charClamp(n);return t*t*(3-2*t)};
const charMix=(a:number,b:number,t:number)=>a+(b-a)*t;
const charDamp=(a:number,b:number,rate:number,dt:number)=>charMix(a,b,1-Math.exp(-rate*dt));
function charJoint(parent:THREE.Object3D,name:string,x=0,y=0,z=0){
  const g=new THREE.Group();g.name=name;g.position.set(x,y,z);parent.add(g);return g;
}
function charRod(kit:RenderKit,parent:THREE.Object3D,a:number[],b:number[],r:number,c:number,surface?:Surface){
  const start=new THREE.Vector3(...a as [number,number,number]);
  const end=new THREE.Vector3(...b as [number,number,number]);
  const direction=end.clone().sub(start),length=direction.length();
  const m=kit.cylinder(parent,0,-length/2,0,r,length,c,r,surface);
  m.position.copy(start.add(end).multiplyScalar(.5));
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),direction.normalize());return m;
}

// Elliptical contour rings give faces, waists and armor a designed silhouette.
// Geometry/UV variants use complete cache keys and remain owned by RenderKit.
function charProfile(kit:RenderKit,parent:THREE.Object3D,name:string,rows:number[][],color:number,surface?:Surface,segments=24){
  const metres=surface==='jacket'?.65:surface==='denim'?.5:surface==='canvas'?.6:1;
  const geo=kit.geometry(`actor:v2:profile:${segments}:${metres}:${JSON.stringify(rows)}`,()=>{
    const positions:number[]=[],uvs:number[]=[],indices:number[]=[];
    const radius=Math.max(...rows.map(r=>Math.max(r[1],r[2])));
    for(const [y,rx,rz,centerZ=0] of rows)for(let i=0;i<=segments;i++){
      const angle=i/segments*Math.PI*2;positions.push(Math.sin(angle)*rx,y,Math.cos(angle)*rz+centerZ);
      uvs.push(i/segments*2*Math.PI*radius/metres,y/(metres*.75));
    }
    for(let r=0;r<rows.length-1;r++)for(let i=0;i<segments;i++){
      const a=r*(segments+1)+i,b=a+1,c=a+segments+1,d=c+1;indices.push(a,b,c,b,d,c);
    }
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));g.setIndex(indices);g.computeVertexNormals();g.computeBoundingBox();return g;
  });
  const mesh=new THREE.Mesh(geo,kit.material(color,surface));mesh.name=name;mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;
}
function charStrap(kit:RenderKit,parent:THREE.Object3D,a:number[],b:number[],width:number,color=0x596148,surface:Surface='canvas'){
  const from=new THREE.Vector3(a[0],a[1],a[2]),to=new THREE.Vector3(b[0],b[1],b[2]),delta=to.clone().sub(from),length=delta.length();
  const mesh=kit.box(parent,0,-length/2,0,width,length,.016,color,surface);
  mesh.position.copy(from.add(to).multiplyScalar(.5));mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());return mesh;
}
function charBuckle(kit:RenderKit,parent:THREE.Object3D,x:number,y:number,z:number,w=.045,h=.057,color=0xa1a38b){
  const line=.009;
  kit.box(parent,x,y-h/2,z,w,line,.013,color,'brushedSteel');kit.box(parent,x,y+h/2-line,z,w,line,.013,color,'brushedSteel');
  kit.box(parent,x-w/2+line/2,y-h/2,z,line,h,.013,color,'brushedSteel');kit.box(parent,x+w/2-line/2,y-h/2,z,line,h,.013,color,'brushedSteel');
  kit.box(parent,x,y-h/2,z,line,h,.018,color,'brushedSteel');
}
// Batch only rigid siblings with the same pooled material. Joint boundaries and
// equipment visibility groups stay intact, so IK, hand tools and picking work.
function charBatchRigid(kit:RenderKit,root:THREE.Object3D){
  for(const child of [...root.children])if(!(child instanceof THREE.Mesh))charBatchRigid(kit,child);
  const buckets=new Map<THREE.Material,THREE.Mesh[]>();
  for(const child of root.children)if(child instanceof THREE.Mesh&&!child.userData.noPick&&!Array.isArray(child.material)){
    const bucket=buckets.get(child.material)||[];bucket.push(child);buckets.set(child.material,bucket);
  }
  for(const [material,parts] of buckets){
    if(parts.length<2)continue;
    for(const part of parts)part.updateMatrix();
    const key='actor:v2:rigid:'+parts.map(p=>`${p.geometry.uuid}:${p.matrix.elements.join(',')}`).join('|');
    const geometry=kit.geometry(key,()=>{
      const positions:number[]=[],normals:number[]=[],uvs:number[]=[],p=new THREE.Vector3(),n=new THREE.Vector3(),normalMatrix=new THREE.Matrix3();
      for(const part of parts){
        const g=part.geometry,pos=g.getAttribute('position'),normal=g.getAttribute('normal'),uv=g.getAttribute('uv'),index=g.getIndex();
        normalMatrix.getNormalMatrix(part.matrix);
        for(let i=0;i<(index?index.count:pos.count);i++){
          const j=index?index.getX(i):i;p.fromBufferAttribute(pos,j).applyMatrix4(part.matrix);positions.push(p.x,p.y,p.z);
          n.fromBufferAttribute(normal,j).applyMatrix3(normalMatrix).normalize();normals.push(n.x,n.y,n.z);uvs.push(uv?uv.getX(j):0,uv?uv.getY(j):0);
        }
      }
      const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(normals,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));g.computeBoundingBox();g.computeBoundingSphere();return g;
    });
    const mesh=new THREE.Mesh(geometry,material);mesh.name='rigid-detail';mesh.castShadow=parts.some(p=>p.castShadow);mesh.receiveShadow=parts.some(p=>p.receiveShadow);root.add(mesh);for(const part of parts)root.remove(part);
  }
}
function charMaraDetail(kit:RenderKit,d:any){
  const {box,ellipsoid,cylinder}=kit;
  const {head,chest,hips,arms,legs,wear,backpack}=d;
  const skin=0xcba489,hair=0x493327,stitch=0x939784,cloth=0x536e70,leather=0x3d473b;
  // One continuous sculpted surface instead of stacked nose, cheek and chin primitives.
  const faceGeometry=kit.geometry('Mara:continuous-face:v1',()=>{
    const geo=new THREE.SphereGeometry(1,64,48),p=geo.attributes.position;
    const bump=(x:number,y:number,cx:number,cy:number,sx:number,sy:number)=>Math.exp(-(((x-cx)/sx)**2+((y-cy)/sy)**2));
    for(let i=0;i<p.count;i++){
      const unitY=p.getY(i),front=Math.max(0,p.getZ(i)),y=.14+unitY*.205;
      let x=p.getX(i)*(.139*(unitY<-.25?1+(unitY+.25)*.27:1)),z=p.getZ(i)*.122-.005;
      if(front>0){z+=front*(.035*bump(x,y,0,.097,.025,.030)+.021*bump(x,y,0,.143,.018,.050)+.008*bump(x,y,0,.027,.043,.016)+.008*bump(x,y,0,-.014,.047,.035)-.012*bump(x,y,-.057,.151,.029,.018)-.012*bump(x,y,.057,.151,.029,.018));}
      p.setXYZ(i,x,y,z);
    }geo.computeVertexNormals();return geo;
  });
  const face=new THREE.Mesh(faceGeometry,kit.material(skin));face.castShadow=true;head.add(face);
  d.eyes=[];
  for(const side of [-1,1]){
    ellipsoid(head,side*.136,.115,-.008,.016,.037,.017,skin);
    const eye=charJoint(head,'Mara-eye',side*.055,.15,.111);d.eyes.push(eye);
    ellipsoid(eye,0,0,0,.024,.0075,.005,0xd1c5ac);
    ellipsoid(eye,0,0,.004,.007,.007,.002,0x587266);
    ellipsoid(eye,0,0,.006,.003,.0045,.001,0x26302d);
    ellipsoid(eye,-.002,.002,.007,.0014,.0014,.001,0xf4e5cf);
    charRod(kit,head,[side*.079,.171,.109],[side*.034,.175,.115],.0035,hair);
    charRod(kit,head,[side*.077,.158,.112],[side*.034,.159,.116],.002,0x796051);
  }
  charRod(kit,head,[-.025,.028,.108],[.025,.028,.108],.0025,0xa47768);
  charRod(kit,head,[-.086,.187,.102],[-.078,.174,.11],.002,0xd8ac92);
  // Pulled-back dark hair and a short practical braid; the helmet leaves it visible.
  charProfile(kit,head,'swept-hair',[[.198,.144,.132,-.02],[.269,.133,.125,-.023],[.322,.101,.089,-.025],[.35,.03,.031,-.034],[.352,0,0,-.034]],hair);
  for(const side of [-1,1]){
    const lock=ellipsoid(head,side*.123,.205,-.041,.029,.094,.115,hair);lock.rotation.z=-side*.12;
    for(let i=0;i<3;i++)charRod(kit,head,[side*(.037+i*.026),.322-i*.009,.053],[side*(.035+i*.027),.255,-.125],.004,0x645643);
  }
  // Curved locks follow the skull, with a loose strand beside the left cheek.
  const hairPaths=[[[.02,.343,.01],[.105,.308,.07],[.143,.24,.035],[.105,.20,-.135]], [[-.025,.34,.035],[-.11,.30,.083],[-.141,.228,.03],[-.10,.20,-.135]], [[-.12,.275,.061],[-.149,.23,.089],[-.137,.155,.102],[-.13,.09,.084]]];
  hairPaths.forEach((points,i)=>{const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p as [number,number,number])));const geo=kit.geometry('Mara:hair-lock:'+i,()=>new THREE.TubeGeometry(curve,18,i===2?.0035:.004,5,false));const m=new THREE.Mesh(geo,kit.material(i===2?hair:0x725039));m.castShadow=true;head.add(m)});
  const pony=charJoint(head,'braid',0,.206,-.163);d.ponytail=pony;
  ellipsoid(pony,0,-.029,-.025,.043,.073,.044,hair);
  for(let i=0;i<4;i++)ellipsoid(pony,Math.sin(i*2)*.012,-.09-i*.041,-.017,.028-i*.003,.032,.027-i*.003,i%2?hair:0x514333);
  cylinder(pony,0,-.069,-.018,.041,.025,0x626b4f,.039,'canvas');
  // A faded oxblood scarf is Mara's identifying accent at isometric distance.
  const scarf=charJoint(chest,'Mara-scarf');
  charProfile(kit,scarf,'Mara-scarf-wrap',[[.35,.117,.113,.018],[.39,.13,.117,.012],[.435,.101,.088,.006]],0x85483c,'canvas');
  for(let i=0;i<3;i++)charStrap(kit,scarf,[-.104,.36+i*.02,.086],[.10,.38+i*.014,.092],.013,i===1?0xad6c50:0x623c34,'canvas');
  const tail=charJoint(chest,'Mara-scarf-tail',.095,.382,.195);d.scarfTail=tail;
  charStrap(kit,tail,[0,0,0],[.065,-.10,.13],.085,0x85483c,'canvas');
  charStrap(kit,tail,[.065,-.10,.13],[.04,-.23,.15],.083,0x85483c,'canvas');
  for(let i=0;i<4;i++)charRod(kit,tail,[.013+i*.018,-.225,.15],[.013+i*.018,-.251-(i%2)*.014,.15],.004,0xa26c52,'canvas');
  charStrap(kit,tail,[.013,-.12,.144],[.013,-.217,.154],.009,0xc29268,'canvas');
  // Field watch, stitched repairs and an emergency locator clipped to the pack.
  box(arms[0].elbow,0,-.28,.073,.09,.038,.034,0x2e3937,'rubber',0,true);
  box(arms[0].elbow,0,-.274,.095,.05,.024,.01,0x9eb7a3,'glass');
  box(arms[0].elbow,.005,-.269,.103,.008,.013,.003,0xc7cdad);
  box(backpack,.277,.15,-.275,.083,.14,.068,0xb99858,'carPaint',0,true);
  box(backpack,.28,.19,-.314,.045,.045,.008,0x243934);
  box(backpack,.28,.22,-.32,.017,.012,.008,0xbadeaa);
  charRod(kit,backpack,[.278,.285,-.275],[.278,.365,-.276],.008,0x3e5144,'rubber');
  box(backpack,.018,.055,-.461,.165,.098,.011,0xb2a67e,'canvas');
  box(backpack,.018,.098,-.47,.109,.01,.006,0x615e48);
  for(let i=0;i<5;i++)box(backpack,-.042+i*.027,.065,-.47,.012,.009,.005,0x655b46);
  for(const leg of legs){for(let i=0;i<4;i++)charStrap(kit,leg.hip,[-.043+i*.025,-.30,.098],[-.031+i*.025,-.265,.10],.005,0xb7ac89,'canvas');}
  // Shirt seams and collar stay visible when armor replaces the jacket.
  for(const side of [-1,1]){
    charStrap(kit,chest,[side*.063,.383,.073],[side*.131,.285,.162],.047,0x455d50);
    charStrap(kit,chest,[side*.07,.356,.101],[side*.125,.277,.18],.012,0x859485);
    box(chest,side*.185,.036,.165,.1,.094,.025,cloth,'canvas',0,true);
    box(chest,side*.185,.112,.186,.103,.019,.009,stitch,'canvas');
  }
  box(chest,0,-.136,.157,.016,.38,.012,0x4a6253,'canvas');
  for(let i=0;i<4;i++)ellipsoid(chest,0,-.055+i*.065,.171,.009,.009,.005,0x8a9580);
  box(chest,-.198,.18,.175,.058,.065,.012,0x9d9c7c,'canvas');
  box(chest,-.198,.2,.187,.041,.009,.008,0x495d4a);
  // Belt loops, two rear pockets and cargo pockets articulate with the legs.
  for(const x of [-.179,-.079,.079,.179])box(hips,x,.85,.16,.022,.085,.026,0x596459,'denim');
  charBuckle(kit,hips,0,.893,.193,.066,.052);
  for(const x of [-.113,.113]){box(hips,x,.768,-.156,.14,.113,.024,0x455449,'denim',0,true);box(hips,x,.846,-.175,.142,.013,.009,stitch,'canvas');}
  for(const leg of legs){
    const side=leg.side;
    charStrap(kit,leg.hip,[side*.102,-.035,.012],[side*.096,-.326,.019],.012,0x768374);
    const pocket=charJoint(leg.hip,'cargo-pocket',side*.1,-.14,0);pocket.rotation.y=side*Math.PI/2;
    box(pocket,0,-.12,0,.137,.17,.055,0x4b5e50,'denim',0,true);box(pocket,0,.023,.017,.146,.03,.065,0x617060,'denim',0,true);
    ellipsoid(pocket,0,.03,.054,.008,.008,.005,0xa4a58a);
    box(leg.hip,0,-.396,.087,.145,.113,.036,0x586959,'canvas',0,true);
    box(leg.knee,0,-.073,.092,.123,.04,.024,0x657261,'canvas');
    charStrap(kit,leg.knee,[side*.078,-.045,.006],[side*.07,-.315,.014],.012,0x778272);
    box(leg.knee,0,-.326,.062,.164,.043,.138,0x566650,'denim');
    // Raised tongue, toe cap, welt, eyelets, crossed laces and rear pull tab.
    box(leg.foot,0,-.058,.192,.214,.072,.119,0x39463b,'rubber',0,true);
    box(leg.foot,0,-.081,.077,.234,.021,.365,0x727565,'rubber',0,true);
    box(leg.foot,0,-.025,.097,.119,.172,.04,0x53604c,'canvas',0,true);
    box(leg.foot,0,.092,-.111,.061,.096,.032,leather,'canvas');
    for(let j=0;j<4;j++){
      const y=.005+j*.031,z=.128-j*.012;
      for(const x of [-.06,.06])ellipsoid(leg.foot,x,y,z,.011,.011,.007,0x909581);
      charRod(kit,leg.foot,[-.051,y,z+.007],[.051,y+.023,z-.006],.007,0xaaa588,'canvas');
      charRod(kit,leg.foot,[.051,y,z+.007],[-.051,y+.023,z-.006],.007,0xaaa588,'canvas');
    }
    for(const x of [-.08,.08])for(const z of [-.046,.044,.134,.22])box(leg.foot,x,-.101,z,.052,.027,.047,0x25332e,'rubber');
  }
  for(const arm of arms){
    const side=arm===arms[0]?-1:1;
    charStrap(kit,arm.upper,[side*.083,-.041,.018],[side*.079,-.277,.017],.012,0x879380);
    box(arm.upper,0,-.272,0,.173,.037,.17,0x526a5a,'canvas',0,true);
    box(arm.hand,0,-.043,-.039,.106,.065,.026,leather,'rubber',0,true);
    box(arm.hand,0,.045,0,.133,.035,.133,0x66735a,'canvas',0,true);
    for(let i=0;i<4;i++){
      const finger=ellipsoid(arm.hand,-.042+i*.027,-.077,.033,.016,.032,.022,skin);finger.rotation.x=-.25;
      ellipsoid(arm.hand,-.042+i*.027,-.04,.065,.016,.018,.017,0x53634a);
    }
    const thumb=ellipsoid(arm.hand,-side*.069,-.003,.042,.026,.04,.026,leather);thumb.rotation.z=-side*.4;
    charBuckle(kit,arm.hand,0,.062,.074,.04,.026);
  }
  // Jacket: tailored seams, rolled collar, front panels, zip, patches and cuffs.
  const jacket=wear.jacket[0];
  for(const side of [-1,1]){
    charStrap(kit,jacket,[side*.066,.38,.106],[side*.16,.255,.208],.086,0xc18b58,'jacket');
    charStrap(kit,jacket,[side*.058,.378,.118],[side*.145,.26,.22],.012,0xe0b985,'canvas');
    charStrap(kit,jacket,[side*.248,.228,.08],[side*.217,-.113,.106],.011,0xd5ad77,'canvas');
    box(jacket,side*.151,.15,.212,.138,.017,.012,0xcfa36c,'jacket');
    ellipsoid(jacket,side*.15,.125,.227,.008,.008,.005,0xabaf95);
    charStrap(kit,jacket,[side*.204,-.064,.176],[side*.113,-.018,.207],.009,0xd4ae7b,'canvas');
  }
  for(let i=0;i<12;i++)box(jacket,0,-.09+i*.031,.214,.026,.009,.014,0xb1ad8d,'brushedSteel');
  box(jacket,.025,.247,.215,.018,.04,.019,0xc5b393,'brushedSteel');
  box(jacket,0,-.145,-.171,.272,.043,.018,0x916441,'jacket');
  for(let i=1;i<wear.jacket.length;i++){
    const sleeve=wear.jacket[i];
    if(i%2){box(sleeve,0,-.261,-.053,.153,.07,.077,0x896640,'jacket',0,true);charStrap(kit,sleeve,[.094,-.03,.01],[.091,-.28,.021],.011,0xd0a270,'canvas');}
    else {box(sleeve,0,-.279,.082,.137,.022,.014,0xc1a171,'canvas');charBuckle(kit,sleeve,0,-.287,.093,.045,.032);}
  }
  box(wear.jacket[1],-.09,-.14,.039,.017,.085,.078,0xa9ae87,'canvas');
  box(wear.jacket[1],-.102,-.12,.079,.009,.03,.025,0x6b7251);
  // Vest: contoured ceramic plate, MOLLE webbing, pouches and metal fasteners.
  const vest=wear.vest[0];
  for(const side of [-1,1]){
    charStrap(kit,vest,[side*.188,.321,-.02],[side*.188,.073,.294],.053,0x7d8968);
    charBuckle(kit,vest,side*.188,.182,.288,.054,.07);
    box(vest,side*.253,-.055,.073,.021,.112,.185,0x7d8968,'canvas');
  }
  for(let row=0;row<3;row++)for(let col=0;col<4;col++)box(vest,-.139+col*.092,.086+row*.057,.284,.075,.014,.024,0x899477,'canvas');
  for(const x of [-.18,0,.18]){box(vest,x,.056,.319,.131,.025,.075,0x74815f,'canvas');charBuckle(kit,vest,x,-.011,.315,.03,.044);}
  box(vest,-.057,.247,.286,.055,.038,.012,0xb6b396,'canvas');box(vest,-.057,.259,.298,.03,.009,.006,0x515f46);
  // Helmet reads as a separate hard shell with rim, panels, fasteners and webbing.
  const helmet=wear.helmet[0];
  charProfile(kit,helmet,'helmet-shell',[[.209,.209,.194,-.028],[.246,.211,.196,-.028],[.324,.176,.166,-.033],[.394,.098,.096,-.042],[.41,0,0,-.042]],0x5b7058,'carPaint');
  for(const side of [-1,1]){
    charStrap(kit,helmet,[side*.184,.21,.095],[side*.103,-.019,.107],.022,0x8b8c67);
    ellipsoid(helmet,side*.194,.251,.083,.011,.012,.008,0xbdbea0);
    box(helmet,side*.2,.264,-.019,.024,.028,.111,0x334b3e,'rubber');
    for(let i=0;i<3;i++)box(helmet,side*.209,.261,-.058+i*.033,.016,.031,.008,0x98a28b,'brushedSteel');
  }
  charStrap(kit,helmet,[-.103,-.019,.107],[.103,-.019,.107],.02,0x8b8c67);
  charBuckle(kit,helmet,.081,.016,.117,.032,.045);
  box(helmet,0,.241,.213,.079,.07,.025,0x334b3e,'rubber',0,true);
  box(helmet,0,.259,.228,.033,.031,.012,0x8e9c84,'brushedSteel');
  // Backpack has a bedroll, compression straps, real buckles and a side canteen.
  for(const side of [-1,1]){
    charStrap(kit,chest,[side*.17,.345,-.139],[side*.207,.249,.172],.047,0x798167);
    charStrap(kit,chest,[side*.207,.249,.172],[side*.174,-.12,.199],.047,0x798167);
    charBuckle(kit,chest,side*.182,.02,.214,.049,.067);
    charBuckle(kit,backpack,side*.175,.16,-.472,.048,.065);
    box(backpack,side*.185,-.042,-.469,.025,.073,.025,0x5e6a4c,'canvas');
  }
  charStrap(kit,chest,[-.182,.052,.22],[.182,.052,.22],.025,0x6c7659);
  charBuckle(kit,chest,.025,.052,.235,.051,.037);
  const roll=charJoint(backpack,'bedroll',0,.47,-.28);roll.rotation.z=Math.PI/2;
  cylinder(roll,0,-.265,0,.091,.53,0x8a8a68,.091,'canvas');
  for(const y of [-.179,.153])cylinder(roll,0,y,0,.098,.029,0x515e45,.098,'canvas');
  box(backpack,-.278,.185,-.257,.06,.031,.06,0x455c48,'rubber',0,true);
  box(backpack,.256,-.12,-.272,.078,.282,.113,0x718365,'canvas',0,true);
  charBuckle(kit,backpack,.253,.044,-.337,.036,.046);
  // Grip wrappings distinguish weapons at close range; no new image assets.
  for(let i=0;i<5;i++)cylinder(d.hands.crowbar,0,-.13+i*.034,0,.03,.012,0x788174,.03,'rubber');
  for(let i=0;i<5;i++)cylinder(d.hands.axe,0,-.16+i*.037,0,.034,.012,0xa49471,.034,'canvas');
  box(d.hands.axe,.174,-.543,.043,.098,.026,.01,0xd0d0b8,'brushedSteel');
  box(d.hands.bottle,0,-.052,.077,.065,.018,.004,0x626f51);
}

export function createCharacter(kit:RenderKit,zombie=false,variant=0){
  const source=kit;
  const recolor=<T extends THREE.Mesh>(mesh:T,color:number):T=>{mesh.material=source.material(color);return mesh};
  kit={...source,material:(color:number)=>source.material(color),
    box:(...a:Parameters<RenderKit['box']>)=>recolor(source.box(...a),a[7]),
    ellipsoid:(...a:Parameters<RenderKit['ellipsoid']>)=>recolor(source.ellipsoid(...a),a[7]),
    cylinder:(...a:Parameters<RenderKit['cylinder']>)=>recolor(source.cylinder(...a),a[6]),
    limb:(...a:Parameters<RenderKit['limb']>)=>{const g=source.limb(...a);g.traverse(o=>{if(o instanceof THREE.Mesh)recolor(o,a[6])});return g;}
  };
  const {box,ellipsoid,limb}=kit;
  const v=((variant%3)+3)%3,skin=zombie?0xa2ad8b:0xcba489;
  const shirt=zombie?[0x637263,0x877661,0x9b9b8d][v]:0x536e70;
  const group=new THREE.Group();group.name=zombie?'infected':'Mara';
  const body=charJoint(group,'body');
  const contact=kit.contact(group,0,0,1.4,1.12);
  const halo=kit.ring(group,0,0,zombie?.43:.53,zombie?0xb56d56:0xf4bd77,zombie?.3:.8);
  const hips=charJoint(body,'hips');
  if(zombie)box(hips,0,.75,0,.43,.18,.29,0x34423b,'denim',0,true);
  else charProfile(kit,hips,'cargo-waist',[[.741,.18,.129],[.784,.225,.153],[.858,.207,.146],[.922,.193,.133]],0x34423b,'denim');
  box(hips,0,.87,.005,.445,.045,.31,0x434c36,'canvas');
  box(hips,0,.87,.164,.08,.053,.027,0xa1a38b,'brushedSteel');
  const legs=[-1,1].map((side,i)=>{
    const hip=limb(hips,side*.145,.85,0,.105,.41,0x34443d,'denim');hip.name=i?'right-hip':'left-hip';
    const knee=limb(hip,0,-.41,0,.086,.42,zombie?0x455048:0x34443d,'denim');knee.name=i?'right-knee':'left-knee';
    ellipsoid(hip,0,-.40,.026,.095,.092,.1,0x495648,'denim');
    const foot=charJoint(knee,i?'right-ankle':'left-ankle',0,-.42,0);
    box(foot,0,-.095,.075,.225,.15,.365,0x4d584e,'rubber',0,true);
    box(foot,0,-.102,.075,.234,.037,.376,0x25332e,'rubber',0,true);
    box(foot,0,.015,-.016,.16,.12,.19,0x485548,'canvas',0,true);
    return {hip,knee,foot,side,plant:new THREE.Vector3(),planted:false,stance:false};
  });
  const chest=charJoint(body,'chest',0,1.01,0);
  if(zombie){ellipsoid(chest,0,.135,0,.274,.33,.178,shirt,'canvas');box(chest,0,-.15,0,.475,.25,.285,shirt,'canvas',0,true);}
  else charProfile(kit,chest,'layered-field-shirt',[[-.159,.194,.134],[-.07,.195,.14],[.095,.225,.166],[.227,.252,.171],[.313,.244,.145],[.365,.155,.108],[.39,.086,.078]],0x536e70,'canvas');
  const arms=[-1,1].map((side,i)=>{
    const upper=limb(chest,side*(zombie?.324:.305),.29,0,zombie?.086:.079,.35,shirt,'canvas');upper.name=i?'right-shoulder':'left-shoulder';
    const elbow=limb(upper,0,-.35,0,.07,.32,skin);elbow.name=i?'right-elbow':'left-elbow';
    ellipsoid(upper,0,-.345,0,.075,.077,.074,skin);
    const hand=charJoint(elbow,i?'right-hand':'left-hand',0,-.32,0);
    ellipsoid(hand,0,-.017,.014,.073,.09,.07,zombie?skin:0x394638);
    box(hand,0,-.07,.051,.11,.038,.041,zombie?skin:0x4a5640,undefined,0,true);
    return {upper,elbow,hand};
  });
  const head=charJoint(chest,'head',0,.49,0);
  kit.cylinder(head,0,-.09,0,.075,.14,skin);
  if(zombie){
  charProfile(kit,head,'infected-face-'+v,[[-.055,.046,.057,.025],[-.015,.085,.086,.015],[.045,.108,.108],[.115,.144,.118],[.2,.138,.12],[.28,.10,.09],[.32,0,0]],skin,undefined,32);
  ellipsoid(head,0,.11,.112,.021,.04,.025,skin);
  for(const side of [-1,1]){
    ellipsoid(head,side*.06,.157,.107,.035,.020,.010,0x525b49);
    ellipsoid(head,side*.058,.157,.116,.010,.007,.003,0xb8b59b);
    ellipsoid(head,side*.135,.115,-.01,.024,.042,.025,skin);
    charRod(kit,head,[side*.095,.095,.10],[side*.07,.065,.115],.005,0x778269);
  }
  box(head,0,.025,.106,.066,.022,.008,0x534c40);
  for(const x of [-.025,-.01,.01,.025])box(head,x,.04,.112,.01,.009,.006,0xb5b59d);
  ellipsoid(head,-.023,.259,-.032,.127,.088,.105,0x45483b);
  for(let i=0;i<5;i++)ellipsoid(head,-.095+i*.038,.23,-.055,.025,.075,.04,0x45483b);
  }
  if(zombie){
    box(chest,-.15,.02,.18,.095,.18,.013,0x644a37);head.rotation.z=.055*(v-1);
    for(const side of [-1,1])charStrap(kit,chest,[side*.08,.35,.07],[side*.16,.23,.17],.055,0x454e43);
    for(let i=0;i<5;i++)box(chest,-.18+i*.09,-.17,.143,.06,.055+(i%2)*.05,.022,shirt,undefined,0,true);
    for(const arm of arms){for(let i=0;i<4;i++)ellipsoid(arm.hand,-.044+i*.028,-.092,.06,.015,.052,.022,skin);box(arm.upper,0,-.29,.06,.15,.03,.034,0x465244);}
  }
  const wear={jacket:[] as THREE.Group[],vest:[] as THREE.Group[],helmet:[] as THREE.Group[]};
  const hands:Record<string,THREE.Group>={};
  let backpack:THREE.Group|undefined,bandage:THREE.Group|undefined;
  if(!zombie){
    const jacket=charJoint(chest,'equipment:body:jacket');wear.jacket.push(jacket);
    charProfile(kit,jacket,'field-jacket',[[-.159,.224,.164],[-.082,.223,.173],[.09,.246,.19],[.24,.273,.186],[.323,.261,.153],[.377,.126,.115]],0xaf784b,'jacket');
    box(jacket,0,-.10,.198,.021,.48,.014,0x494936);
    for(const x of [-.152,.152])box(jacket,x,.04,.192,.16,.128,.05,0x986d45,'jacket',0,true);
    for(const arm of arms){
      const upper=charJoint(arm.upper,'equipment:body:jacket-sleeve');wear.jacket.push(upper);
      ellipsoid(upper,0,-.17,0,.099,.199,.099,0xaf7645,'jacket');
      const fore=charJoint(arm.elbow,'equipment:body:jacket-cuff');wear.jacket.push(fore);
      ellipsoid(fore,0,-.145,0,.081,.167,.082,0xaf7645,'jacket');
      box(fore,0,-.31,0,.16,.055,.16,0x646246,'canvas',0,true);
    }
    const vest=charJoint(chest,'equipment:body:vest');wear.vest.push(vest);
    box(vest,0,-.125,.063,.535,.45,.348,0x4c6454,'canvas',0,true);
    box(vest,0,.05,.255,.39,.26,.045,0x384e42,undefined,0,true);
    for(const x of [-.18,0,.18])box(vest,x,-.09,.272,.143,.18,.076,0x5d7257,'canvas',0,true);
    for(const x of [-.198,.198])box(vest,x,.275,.035,.078,.07,.36,0x718164,'canvas',0,true);
    const helmet=charJoint(head,'equipment:head:helmet');wear.helmet.push(helmet);
    // Contoured hard shell is added with Mara's other gear details.
    box(helmet,0,.211,.02,.409,.04,.389,0x3d5345,'rubber',0,true);
    box(helmet,0,.226,.177,.378,.035,.092,0x596f56,'brushedSteel',0,true);
    for(const side of [-1,1])box(helmet,side*.183,.083,-.035,.043,.155,.248,0x4b6252,'carPaint',0,true);
    charRod(kit,helmet,[-.16,.08,.055],[-.11,-.027,.102],.013,0x807c56,'canvas');
    charRod(kit,helmet,[.16,.08,.055],[.11,-.027,.102],.013,0x807c56,'canvas');
    backpack=charJoint(chest,'backpack');
    box(backpack,0,-.105,-.275,.425,.48,.235,0x4e6554,'canvas',0,true);
    box(backpack,0,.334,-.278,.45,.085,.254,0x6a7d5c,'canvas',0,true);
    box(backpack,0,-.068,-.416,.313,.224,.075,0x405a46,'canvas',0,true);
    for(const x of [-.188,.188]){
      box(backpack,x,-.089,-.46,.036,.52,.02,0x949577,'canvas');
      // Broad, fitted shoulder straps are added by charMaraDetail.
    }
    kit.cylinder(backpack,-.278,-.095,-.257,.068,.29,0x7d9480,.068,'brushedSteel');
    const crowbar=charJoint(arms[1].hand,'equipment:hand:crowbar');hands.crowbar=crowbar;
    charRod(kit,crowbar,[0,.045,0],[0,-.59,0],.021,0x879b8b,'brushedSteel');
    charRod(kit,crowbar,[0,-.59,0],[.07,-.655,.015],.026,0xaab5a2,'brushedSteel');
    charRod(kit,crowbar,[.07,-.655,.015],[.15,-.642,.015],.023,0xaab5a2,'brushedSteel');
    box(crowbar,0,-.15,0,.054,.19,.054,0x39493b,'rubber',0,true);
    const axe=charJoint(arms[1].hand,'equipment:hand:axe');hands.axe=axe;
    charRod(kit,axe,[0,.055,0],[0,-.635,0],.026,0x947958,'wood');
    box(axe,0,-.18,0,.061,.2,.058,0x46533e,'rubber',0,true);
    const axeGeo=kit.geometry('actor:axe-blade:v1',()=>{
      const shape=new THREE.Shape();shape.moveTo(-.06,-.44);shape.lineTo(.14,-.435);shape.lineTo(.305,-.40);shape.lineTo(.335,-.62);shape.lineTo(.17,-.60);shape.lineTo(-.065,-.555);shape.closePath();
      const geo=new THREE.ExtrudeGeometry(shape,{depth:.065,bevelEnabled:true,bevelThickness:.008,bevelSize:.01,bevelSegments:1,steps:1});geo.translate(0,0,-.0325);return geo;
    });
    const blade=new THREE.Mesh(axeGeo,kit.material(0xa4b3a0,'brushedSteel'));blade.castShadow=true;blade.receiveShadow=true;axe.add(blade);
    const bottle=charJoint(arms[1].hand,'equipment:hand:bottle');hands.bottle=bottle;
    kit.cylinder(bottle,0,-.16,0,.066,.25,0x90b297,.066,'glass');
    kit.cylinder(bottle,0,.09,0,.033,.12,0xb0c7a8,.033,'glass');
    kit.cylinder(bottle,0,.205,0,.038,.028,0xc4b287,.038,'brushedSteel');
    box(bottle,0,-.095,.063,.094,.11,.012,0xc0bea0,'vinyl');
    bandage=charJoint(arms[0].hand,'action:bandage');
    box(bandage,0,-.01,.063,.16,.09,.1,0xd4d8bd,'vinyl',0,true);
    box(bandage,0,.081,.063,.034,.008,.076,0x9b5341);
  }
  for(const pieces of Object.values(wear))for(const piece of pieces)piece.visible=false;
  for(const hand of Object.values(hands))hand.visible=false;if(bandage)bandage.visible=false;
  const d={body,chest,head,hips,legs,arms,halo,contact,wear,hands,backpack,bandage,zombie,variant:v,
    leftLeg:legs[0].hip,rightLeg:legs[1].hip,leftArm:arms[0].upper,rightArm:arms[1].upper,
    started:false,lastX:0,lastY:0,phase:0,motion:0,speed:0,sneak:0,sprint:0,death:0,dead:false,wasMoving:false,
    workA:new THREE.Vector3(),workB:new THREE.Vector3(),workC:new THREE.Vector3(),workQ:new THREE.Quaternion()};
  group.userData=d;
  if(!zombie){charMaraDetail(kit,d);charBatchRigid(kit,group);}
  return group;
}

// A sagittal knee pole plus a full 3D target preserves planted feet during turns.
// The upper/lower lengths match createCharacter; no shared geometry is changed.
function charSolveLeg(d:any,leg:any,target:THREE.Vector3,toePitch:number){
  const upper=.41,lower=.42,hip=leg.hip.position;
  const direction=d.workA.copy(target).sub(hip),distance=THREE.MathUtils.clamp(direction.length(),.08,upper+lower-.003);
  direction.normalize();
  const pole=d.workB.set(0,0,1).addScaledVector(direction,-direction.z).normalize();
  const along=(upper*upper-lower*lower+distance*distance)/(2*distance);
  const bend=Math.sqrt(Math.max(0,upper*upper-along*along));
  const upperDirection=d.workC.copy(direction).multiplyScalar(along).addScaledVector(pole,bend).normalize();
  leg.hip.quaternion.setFromUnitVectors(CHAR_DOWN,upperDirection);
  const lowerDirection=d.workB.copy(direction).multiplyScalar(distance).addScaledVector(upperDirection,-upper);
  d.workQ.copy(leg.hip.quaternion).invert();lowerDirection.applyQuaternion(d.workQ).normalize();
  leg.knee.quaternion.setFromUnitVectors(CHAR_DOWN,lowerDirection);
  leg.foot.quaternion.copy(leg.hip.quaternion).multiply(leg.knee.quaternion).invert();
  leg.foot.rotation.x+=toePitch;
}

export function animateCharacter(group:THREE.Group,actor:any,dt:number,playing:boolean,time:number){
  const d=group.userData;
  const stepDt=playing?THREE.MathUtils.clamp(dt,0,.06):0;
  const initial=!d.started;
  const distance=initial?0:Math.hypot(actor.x-d.lastX,actor.y-d.lastY);
  const teleported=distance>.85;
  d.started=true;d.lastX=actor.x;d.lastY=actor.y;
  group.position.set(actor.x,0,actor.y);group.rotation.y=Number.isFinite(actor.facing)?actor.facing:0;
  const dead=typeof actor.hp==='number'&&actor.hp<=0;
  if(dead){
    if(initial)d.death=1;
    // Finish this cosmetic fall even if game-over has stopped actor simulation.
    else d.death=Math.min(1,d.death+THREE.MathUtils.clamp(dt,0,.06)/.85);
    const fall=charSmooth(d.death);
    d.body.rotation.set(.09*fall,0,(d.variant%2?-1:1)*Math.PI/2*fall);
    d.body.position.set(0,.48*fall,-.09*fall);
    d.chest.rotation.x=.2+.3*fall;
    d.arms[0].upper.rotation.x=charMix(-.8,.23,fall);d.arms[1].upper.rotation.x=charMix(-1.2,-.18,fall);
    d.arms[0].elbow.rotation.x=-.45;d.arms[1].elbow.rotation.x=-.8;
    d.head.rotation.z=.15*fall;d.halo.visible=false;d.dead=true;
    d.contact.scale.set(1.4+fall*.4,1.12+fall*.55,1);
    return;
  }
  if(d.dead){d.dead=false;d.death=0;d.halo.visible=true;d.contact.scale.set(1.4,1.12,1);for(const leg of d.legs)leg.planted=false;}
  const moving=playing&&!teleported&&distance>.0001;
  // Leave enough reach for the first planted foot when starting from rest.
  if(moving&&!d.wasMoving)d.phase=.30;
  if(playing)d.wasMoving=moving;
  const speed=moving&&dt>0?distance/dt:0;
  d.speed=charDamp(d.speed,speed,10,stepDt);
  d.motion=charDamp(d.motion,moving?1:0,moving?12:9,stepDt);
  d.sneak=charDamp(d.sneak,actor.sneak?1:0,9,stepDt);
  // The engine's normal 3.1 m/s movement reads as a run; slow/sneak stays low.
  d.sprint=charDamp(d.sprint,!d.zombie&&!actor.sneak&&moving&&(actor.sprint||d.speed>2.65)?1:0,7,stepDt);
  if(initial){d.sneak=actor.sneak?1:0;d.motion=0;}
  const cycle=d.zombie?.84:charMix(charMix(1.03,.76,d.sneak),1.25,d.sprint);
  if(moving)d.phase=(d.phase+distance/cycle)%1;
  const phase=d.phase*Math.PI*2,breath=Math.sin(time*(d.zombie?1.45:2.1)+d.variant*1.8);
  const hurt=charClamp(Number(actor.hurt)||0);
  const action=actor.action;
  const active=action&&action.remaining>0&&action.duration>0;
  const type=active?action.type:null;
  const p=active?charClamp(1-action.remaining/action.duration):0;
  const envelope=active?charSmooth(p/.10)*(1-charSmooth((p-.82)/.18)):0;
  const attack=type==='attack'?envelope:0;
  const throwWeight=type==='throw'?envelope:0;
  const heal=type==='heal'?envelope:0;
  const interact=type==='interact'?envelope:0;
  const sway=Math.sin(phase)*d.motion;
  d.body.position.set(0,-.10*d.sneak-.035*d.sprint+Math.abs(Math.sin(phase))*d.motion*.014,-hurt*.065);
  d.body.rotation.set(0,0,0);
  d.hips.rotation.set(0,0,0);
  d.chest.position.set(d.zombie?sway*.012:0,1.01+breath*.006,.012*d.sneak);
  d.chest.scale.set(1,1+breath*.008,1);
  d.chest.rotation.set(.13*d.sneak+.16*d.sprint+(d.zombie?.15+sway*.055:0)-hurt*.17,-sway*.055, d.zombie?Math.sin(phase*.5+d.variant)*.035:sway*.012);
  d.head.rotation.set(-.08*d.sneak-.07*d.sprint-hurt*.13,Math.sin(time*.56+d.variant)*.065*(1-d.motion),d.zombie?.055*(d.variant-1):0);
  if(d.backpack){d.backpack.rotation.x=-Math.abs(sway)*.025;d.backpack.rotation.z=-sway*.027;}
  if(d.ponytail){d.ponytail.rotation.x=.12+sway*.12+d.sprint*.08;d.ponytail.rotation.z=-sway*.12;}
  if(d.scarfTail){d.scarfTail.rotation.x=-.05+Math.sin(time*3.3)*.035+sway*.10;d.scarfTail.rotation.z=sway*.07;}
  if(d.eyes){const blinkPhase=(time+1.2)%4.9,blink=blinkPhase<.16?Math.sin(blinkPhase/.16*Math.PI):0;for(const eye of d.eyes)eye.scale.y=1-blink*.88;}
  const facing=group.rotation.y,sin=Math.sin(facing),cos=Math.cos(facing);
  for(let i=0;i<d.legs.length;i++){
    const leg=d.legs[i],phase01=(d.phase+i*.5)%1,stance=phase01<.62;
    const span=cycle*.62*(d.zombie&&i===1?.87:1);
    let z:number,lift=0,toe=0;
    if(stance)z=span*.5-span*phase01/.62;
    else {const swing=(phase01-.62)/.38;z=charMix(-span*.5,span*.5,charSmooth(swing));lift=Math.sin(swing*Math.PI)*(d.zombie&&i===1?.035:charMix(.12,.20,d.sprint))*(1-d.sneak*.35);toe=-Math.sin(swing*Math.PI)*.16;}
    const x=leg.side*(.145+d.sneak*.024),localZ=z*d.motion;
    const desired=d.workC.set(actor.x+cos*x+sin*localZ,.102+lift*d.motion,actor.y-sin*x+cos*localZ);
    if(initial||teleported||!leg.planted){leg.plant.copy(desired);leg.planted=true;}
    else if(moving){if(!stance||!leg.stance)leg.plant.copy(desired);}
    else if(stepDt>0){const neutral=d.workB.set(actor.x+cos*x,.102,actor.y-sin*x);leg.plant.lerp(neutral,1-Math.exp(-10*stepDt));}
    leg.stance=stance;
    // A teleport/very sharp reversal may exceed reach; reset only that foot.
    if(Math.hypot(leg.plant.x-actor.x,leg.plant.z-actor.y)>.66)leg.plant.copy(desired);
    const dx=leg.plant.x-actor.x,dz=leg.plant.z-actor.y;
    const footTarget=d.workC.set(cos*dx-sin*dz-d.body.position.x,leg.plant.y-d.body.position.y,sin*dx+cos*dz-d.body.position.z);
    // A sudden speed/posture change can exhaust the old plant's reach. Release
    // that plant along the ground instead of letting the IK raise the boot.
    const hx=footTarget.x-leg.hip.position.x,hz=footTarget.z-leg.hip.position.z;
    const vertical=footTarget.y-leg.hip.position.y;
    const reach=Math.sqrt(Math.max(.002,.825*.825-vertical*vertical)),horizontal=Math.hypot(hx,hz);
    if(horizontal>reach){
      footTarget.x=leg.hip.position.x+hx*reach/horizontal;
      footTarget.z=leg.hip.position.z+hz*reach/horizontal;
      const lx=footTarget.x+d.body.position.x,lz=footTarget.z+d.body.position.z;
      leg.plant.x=actor.x+cos*lx+sin*lz;leg.plant.z=actor.y-sin*lx+cos*lz;
    }
    charSolveLeg(d,leg,footTarget,toe*d.motion);
  }
  for(let i=0;i<2;i++){
    const arm=d.arms[i],side=i?1:-1;
    arm.upper.rotation.set(d.zombie?-1.02+side*sway*.16:-.14+side*sway*(.29+.25*d.sprint),0,side*(-.035-.12*d.sprint));
    arm.elbow.rotation.set(d.zombie?-.3-side*sway*.07:-.22-.5*d.sprint-.23*d.sneak,0,0);
    arm.hand.rotation.set(0,0,0);
    if(hurt){arm.upper.rotation.x-=hurt*.35;arm.elbow.rotation.x-=hurt*.4;}
  }
  // A carrying pose keeps long tools above the ground throughout the gait.
  if(!d.zombie&&actor.equipment?.hand){
    d.arms[1].upper.rotation.x-=.08;
    d.arms[1].elbow.rotation.x-=actor.equipment.hand==='bottle'?.35:.24+.12*d.sneak;
  }
  if(attack){
    const wind=charSmooth(p/.28),strike=charSmooth((p-.28)/.25),recover=charSmooth((p-.60)/.4);
    if(d.zombie){
      const lunge=Math.sin(charClamp((p-.2)/.65)*Math.PI)*attack;
      d.chest.rotation.x+=lunge*.26;d.chest.position.z+=lunge*.13;
      d.arms[0].upper.rotation.x=charMix(d.arms[0].upper.rotation.x,charMix(-1.25,-1.7,lunge),attack);
      d.arms[1].upper.rotation.x=charMix(d.arms[1].upper.rotation.x,charMix(-1.05,-1.55,lunge),attack);
      d.arms[0].elbow.rotation.x=charMix(d.arms[0].elbow.rotation.x,charMix(-.5,-.08,lunge),attack);
      d.arms[1].elbow.rotation.x=charMix(d.arms[1].elbow.rotation.x,charMix(-.65,-.12,lunge),attack);
    }else{
      const shoulder=charMix(charMix(-.15,-2.23,wind),-.1,strike);
      d.arms[1].upper.rotation.x=charMix(d.arms[1].upper.rotation.x,charMix(shoulder,-.14,recover),attack);
      d.arms[1].upper.rotation.z=charMix(d.arms[1].upper.rotation.z,charMix(.12,-.27,strike),attack);
      d.arms[1].elbow.rotation.x=charMix(d.arms[1].elbow.rotation.x,charMix(-1.04,-.27,strike),attack);
      d.chest.rotation.y+=charMix(-.34,.38,strike)*attack;
      d.chest.rotation.x+=(.04+.15*strike)*attack;
      d.arms[0].upper.rotation.x-=attack*.58;d.arms[0].elbow.rotation.x-=attack*.45;
    }
  }
  if(throwWeight){
    const toss=charSmooth((p-.3)/.25),recover=charSmooth((p-.65)/.35);
    d.arms[1].upper.rotation.x=charMix(d.arms[1].upper.rotation.x,charMix(charMix(-2.22,-1.2,toss),-.14,recover),throwWeight);
    d.arms[1].elbow.rotation.x=charMix(d.arms[1].elbow.rotation.x,charMix(charMix(-1.0,-.08,toss),-.22,recover),throwWeight);
    d.chest.rotation.y+=charMix(-.3,.22,toss)*throwWeight;
    d.arms[0].upper.rotation.x-=.5*throwWeight;
  }
  if(heal){
    for(const arm of d.arms){arm.upper.rotation.x=charMix(arm.upper.rotation.x,-1.05,heal);arm.elbow.rotation.x=charMix(arm.elbow.rotation.x,-1.7,heal);}
    d.arms[0].upper.rotation.z=heal*.32;d.arms[1].upper.rotation.z=-heal*.32;
    d.arms[0].hand.rotation.z=Math.sin(time*15)*.2*heal;d.head.rotation.x+=heal*.27;
  }
  if(interact){
    d.arms[1].upper.rotation.x=charMix(d.arms[1].upper.rotation.x,-1.10,interact);
    d.arms[1].elbow.rotation.x=charMix(d.arms[1].elbow.rotation.x,-.32,interact);
    d.arms[1].hand.rotation.z=Math.sin(time*11)*.17*interact;d.chest.rotation.x+=interact*.09;
  }
  if(!d.zombie){
    const equipment=actor.equipment||{hand:null,body:null,head:null};
    for(const [id,pieces] of Object.entries(d.wear) as [string,THREE.Group[]][]){
      const visible=id==='helmet'?equipment.head===id:equipment.body===id;
      for(const piece of pieces)piece.visible=visible;
    }
    for(const [id,object] of Object.entries(d.hands) as [string,THREE.Group][]){
      object.visible=type==='throw'?id==='bottle'&&p<.52:type==='heal'||type==='interact'?false:equipment.hand===id;
    }
    if(d.bandage)d.bandage.visible=type==='heal';
    d.halo.visible=true;d.halo.scale.setScalar(.53*(1+Math.sin(time*2)*.025));
  }
}
