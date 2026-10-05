"use client";

/**
 * Confection 3D — vêtement paramétrique rendu avec react-three-fiber.
 *
 * Chaque catégorie est construite à partir des paramètres de forme du
 * modèle (longueur, évasement, manches, col, coupe) : le vêtement est
 * présenté sur un mannequin de couturier, avec les accessoires retenus
 * (boutons, fermeture éclair, rivets, ceinture, poches, nœud) posés à
 * leurs places réelles. Rotation/zoom à la main, ombre de contact,
 * tissu avec effet sheen pour un rendu réaliste.
 */

import * as React from "react";
import * as THREE from "three";
import { Canvas } from "@react-three/fiber";
import { ContactShadows, OrbitControls } from "@react-three/drei";

import type {
  AccessoryKey,
  CategoryKey,
  ChosenAccessory,
  ShapeParams,
} from "@/lib/atelier/garments";

/* ------------------------------------------------------------------ */
/* Constantes du corps (mètres)                                        */
/* ------------------------------------------------------------------ */

const NECK_R = 0.062;
const SHOULDER_R = 0.175;
const CHEST_R = 0.168;
const WAIST_R = 0.132;
const HIP_R = 0.168;
const WAIST_Y = -0.28;
const HIP_Y = -0.38;

type P2 = [number, number]; // [rayon, y]

/* ------------------------------------------------------------------ */
/* Profils du vêtement par catégorie                                   */
/* ------------------------------------------------------------------ */

function garmentProfile(cat: CategoryKey, s: ShapeParams): P2[] {
  const len = Math.min(1.4, Math.max(0.35, s.length / 100));
  const fl = Math.min(1, Math.max(0, s.flare));
  const ease = s.fit === "loose" ? 1.12 : s.fit === "fitted" ? 0.94 : 1;

  switch (cat) {
    case "robe": {
      const hem = WAIST_R * (1 + fl * 1.5);
      return [
        [NECK_R + 0.01, 0],
        [SHOULDER_R * ease, -0.045],
        [CHEST_R * ease, -0.16],
        [WAIST_R * ease, WAIST_Y],
        [hem * (0.55 + fl * 0.45), -(len * 0.55)],
        [hem + fl * 0.12, -len],
      ];
    }
    case "jupe": {
      const hem = HIP_R * (1 + fl * 1.4);
      return [
        [WAIST_R + 0.012, 0],
        [HIP_R + 0.008, -0.14],
        [HIP_R * (1 + fl * 0.7), -(len * 0.55)],
        [hem, -len],
      ];
    }
    case "pantalon": {
      const hem = 0.085 + fl * 0.05;
      const prof: P2[] = [
        [WAIST_R + 0.012, 0],
        [HIP_R + 0.01, -0.15],
        [0.16, -0.3],
        [hem, -len],
      ];
      return prof;
    }
    case "tshirt": {
      const hem = CHEST_R * ease * (1 + fl * 0.35);
      return [
        [NECK_R + 0.015, 0],
        [SHOULDER_R * ease * 1.04, -0.045],
        [CHEST_R * ease * 1.1, -0.2],
        [hem * 0.99, WAIST_Y],
        [hem, -len],
      ];
    }
    case "chemise": {
      const hem = CHEST_R * (1 + fl * 0.3);
      return [
        [NECK_R + 0.012, 0],
        [SHOULDER_R, -0.045],
        [CHEST_R * 1.06, -0.2],
        [hem * 0.97, WAIST_Y],
        [hem, -len],
      ];
    }
    case "veste": {
      const hem = WAIST_R * (1 + fl * 0.8) + 0.02;
      return [
        [NECK_R + 0.014, 0],
        [SHOULDER_R * 1.03, -0.045],
        [CHEST_R * 1.09, -0.18],
        [hem, -len],
      ];
    }
  }
}

/** Rayon du vêtement à la hauteur y (interpolation du profil). */
function radiusAt(profile: P2[], y: number): number {
  const pts = profile;
  if (y >= pts[0][1]) return pts[0][0];
  for (let i = 1; i < pts.length; i++) {
    if (y >= pts[i][1]) {
      const [r1, y1] = pts[i - 1];
      const [r2, y2] = pts[i];
      const t = (y1 - y) / Math.max(1e-4, y1 - y2);
      return r1 + (r2 - r1) * t;
    }
  }
  return pts[pts.length - 1][0];
}

const latheGeom = (profile: P2[], seg = 56) =>
  new THREE.LatheGeometry(
    profile.map(([r, y]) => new THREE.Vector2(Math.max(0.012, r), y)),
    seg
  );

/* ------------------------------------------------------------------ */
/* Matériaux                                                           */
/* ------------------------------------------------------------------ */

function useFabricMat(color: string, dark = false) {
  return React.useMemo(() => {
    const base = new THREE.Color(color);
    if (dark) base.multiplyScalar(0.82);
    return new THREE.MeshPhysicalMaterial({
      color: base,
      roughness: 0.82,
      metalness: 0,
      sheen: 1,
      sheenRoughness: 0.5,
      sheenColor: base.clone().lerp(new THREE.Color("#ffffff"), 0.4),
      envMapIntensity: 0.35,
      side: THREE.DoubleSide,
    });
  }, [color, dark]);
}

function useMetalMat(color: string) {
  return React.useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color,
        metalness: 0.85,
        roughness: 0.32,
      }),
    [color]
  );
}

/* ------------------------------------------------------------------ */
/* Accessoires                                                         */
/* ------------------------------------------------------------------ */

function Buttons({
  profile,
  color,
  yTop,
  yBot,
  doubleBreasted,
}: {
  profile: P2[];
  color: string;
  yTop: number;
  yBot: number;
  doubleBreasted?: boolean;
}) {
  const mat = useMetalMat(color);
  const n = 5;
  const ys = Array.from({ length: n }, (_, i) => yTop + ((yBot - yTop) * i) / (n - 1));
  return (
    <group>
      {ys.map((y, i) => {
        const z = radiusAt(profile, y) + 0.004;
        return (
          <group key={i}>
            <mesh position={[0, y, z]} rotation={[Math.PI / 2, 0, 0]} material={mat}>
              <cylinderGeometry args={[0.013, 0.013, 0.005, 24]} />
            </mesh>
            {doubleBreasted && (
              <mesh
                position={[0.052, y, z * 0.985]}
                rotation={[Math.PI / 2, 0, 0.12]}
                material={mat}
              >
                <cylinderGeometry args={[0.011, 0.011, 0.005, 24]} />
              </mesh>
            )}
          </group>
        );
      })}
    </group>
  );
}

function Zipper({
  profile,
  color,
  yTop,
  yBot,
}: {
  profile: P2[];
  color: string;
  yTop: number;
  yBot: number;
}) {
  const mat = useMetalMat(color);
  const len = Math.abs(yTop - yBot);
  const yMid = (yTop + yBot) / 2;
  const segs = Array.from({ length: 9 }, (_, i) => yTop + ((yBot - yTop) * i) / 8);
  return (
    <group>
      {segs.map((y, i) => (
        <mesh
          key={i}
          position={[0, y, radiusAt(profile, y) + 0.003]}
          rotation={[Math.PI / 2, 0, 0]}
          material={mat}
        >
          <boxGeometry args={[0.011, 0.014, 0.004]} />
        </mesh>
      ))}
      {/* curseur */}
      <mesh position={[0, yMid, radiusAt(profile, yMid) + 0.008]} material={mat}>
        <boxGeometry args={[0.02, 0.035, 0.008]} />
      </mesh>
      <mesh position={[0, yMid - 0.03, radiusAt(profile, yMid) + 0.008]} material={mat}>
        <boxGeometry args={[0.008, 0.03, 0.004]} />
      </mesh>
    </group>
  );
}

function Rivets({
  profile,
  color,
  y,
}: {
  profile: P2[];
  color: string;
  y: number;
}) {
  const mat = useMetalMat(color);
  const z = radiusAt(profile, y) * 0.9;
  return (
    <group>
      {[-1, 1].map((sx) => (
        <group key={sx}>
          <mesh position={[sx * 0.07, y + 0.04, z]} material={mat}>
            <sphereGeometry args={[0.0065, 16, 16]} />
          </mesh>
          <mesh position={[sx * 0.095, y - 0.035, z]} material={mat}>
            <sphereGeometry args={[0.0065, 16, 16]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function Belt({
  color,
  y,
  r,
}: {
  color: string;
  y: number;
  r: number;
}) {
  const mat = useFabricMat(color);
  const metal = useMetalMat("#d4af37");
  return (
    <group position={[0, y, 0]}>
      <mesh rotation={[Math.PI / 2, 0, 0]} material={mat}>
        <torusGeometry args={[r + 0.006, 0.014, 14, 64]} />
      </mesh>
      <mesh position={[0, 0, r + 0.018]} material={metal}>
        <boxGeometry args={[0.045, 0.03, 0.008]} />
      </mesh>
    </group>
  );
}

function Pockets({
  profile,
  color,
  y,
  r,
}: {
  profile: P2[];
  color: string;
  y: number;
  r: number;
}) {
  const mat = useFabricMat(color, true);
  return (
    <group>
      {[-1, 1].map((sx) => (
        <mesh
          key={sx}
          position={[sx * 0.085, y, radiusAt(profile, y) * 0.88]}
          rotation={[0, sx * 0.12, 0]}
          material={mat}
          castShadow
        >
          <boxGeometry args={[0.075, 0.095, 0.014]} />
        </mesh>
      ))}
    </group>
  );
}

function Noeud({ color, y, r }: { color: string; y: number; r: number }) {
  const mat = useFabricMat(color, true);
  return (
    <group position={[0, y, r + 0.012]}>
      {[-1, 1].map((sx) => (
        <mesh key={sx} position={[sx * 0.032, 0.006, 0]} rotation={[0, 0, sx * 0.5]} material={mat}>
          <boxGeometry args={[0.06, 0.022, 0.012]} />
        </mesh>
      ))}
      <mesh material={mat} scale={[1, 0.7, 0.7]}>
        <sphereGeometry args={[0.016, 20, 20]} />
      </mesh>
      {[-1, 1].map((sx) => (
        <mesh key={`tail${sx}`} position={[sx * 0.028, -0.03, -0.002]} rotation={[0, 0, sx * 0.85]} material={mat}>
          <boxGeometry args={[0.055, 0.02, 0.01]} />
        </mesh>
      ))}
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Col & manches                                                       */
/* ------------------------------------------------------------------ */

function Collar({
  kind,
  profile,
  mat,
}: {
  kind: ShapeParams["collar"];
  profile: P2[];
  mat: THREE.Material;
}) {
  const neckR = profile[0][0];
  if (kind === "round") {
    return (
      <mesh position={[0, -0.004, 0]} rotation={[Math.PI / 2, 0, 0]} material={mat}>
        <torusGeometry args={[neckR + 0.008, 0.007, 12, 48]} />
      </mesh>
    );
  }
  if (kind === "v") {
    return (
      <group>
        {[-1, 1].map((sx) => (
          <mesh
            key={sx}
            position={[sx * 0.028, -0.045, radiusAt(profile, -0.05) * 0.9]}
            rotation={[0.35, 0, sx * 0.55]}
            material={mat}
          >
            <boxGeometry args={[0.075, 0.014, 0.008]} />
          </mesh>
        ))}
      </group>
    );
  }
  if (kind === "shirt") {
    return (
      <group>
        {/* pied de col */}
        <mesh position={[0, -0.01, 0]} rotation={[Math.PI / 2, 0, 0]} material={mat}>
          <cylinderGeometry args={[neckR + 0.012, neckR + 0.014, 0.024, 40, 1, true]} />
        </mesh>
        {/* pointes */}
        {[-1, 1].map((sx) => (
          <mesh
            key={sx}
            position={[sx * 0.03, -0.035, radiusAt(profile, -0.03) * 0.95]}
            rotation={[0.5, 0, sx * 0.28]}
            material={mat}
          >
            <boxGeometry args={[0.055, 0.04, 0.006]} />
          </mesh>
        ))}
      </group>
    );
  }
  /* lapel : revers de veste */
  return (
    <group>
      <mesh position={[0, -0.012, 0]} rotation={[Math.PI / 2, 0, 0]} material={mat}>
        <cylinderGeometry args={[neckR + 0.014, neckR + 0.016, 0.026, 40, 1, true]} />
      </mesh>
      {[-1, 1].map((sx) => (
        <mesh
          key={sx}
          position={[sx * 0.052, -0.09, radiusAt(profile, -0.1) * 0.92]}
          rotation={[0.28, sx * 0.3, sx * 0.42]}
          material={mat}
          castShadow
        >
          <boxGeometry args={[0.075, 0.11, 0.008]} />
        </mesh>
      ))}
    </group>
  );
}

function Sleeve({
  kind,
  x,
  mat,
}: {
  kind: ShapeParams["sleeves"];
  x: number;
  mat: THREE.Material;
}) {
  if (kind === "none") return null;
  const len = kind === "short" ? 0.15 : kind === "three_quarter" ? 0.42 : 0.56;
  const rTop = kind === "short" ? 0.062 : 0.058;
  const rBot = kind === "short" ? 0.056 : 0.047;
  return (
    <group>
      {[-1, 1].map((sx) => (
        <mesh
          key={sx}
          position={[sx * (x + 0.012), -0.045 - len / 2 + 0.02, 0]}
          rotation={[0, 0, sx * -0.22]}
          material={mat}
          castShadow
        >
          <cylinderGeometry args={[rTop, rBot, len, 26]} />
        </mesh>
      ))}
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Mannequin de couturier                                              */
/* ------------------------------------------------------------------ */

function DressForm({
  hemY,
  poleColor = "#8a6a4b",
}: {
  hemY: number;
  poleColor?: string;
}) {
  const linen = React.useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#e7dcc7",
        roughness: 0.9,
        metalness: 0,
      }),
    []
  );
  const wood = React.useMemo(
    () =>
      new THREE.MeshStandardMaterial({ color: poleColor, roughness: 0.6, metalness: 0.05 }),
    [poleColor]
  );
  /* buste du mannequin, légèrement plus étroit que le vêtement */
  const bust = React.useMemo(() => {
    const pts: P2[] = [
      [0.03, 0.12],
      [0.046, 0.07],
      [0.055, 0.04],
      [0.082, 0],
      [0.15, -0.05],
      [0.152, -0.17],
      [0.118, -0.28],
      [0.155, -0.4],
    ];
    const hem = Math.min(hemY + 0.02, -0.42);
    pts.push([0.15, hem]);
    return latheGeom(pts);
  }, [hemY]);
  /* pilier sous le vêtement + embase */
  const poleH = 0.24;
  const poleTop = hemY + 0.05;
  const baseY = poleTop - poleH;
  return (
    <group>
      <mesh geometry={bust} material={linen} />
      <mesh position={[0, poleTop - poleH / 2, 0]} material={wood}>
        <cylinderGeometry args={[0.014, 0.018, poleH, 16]} />
      </mesh>
      <mesh position={[0, baseY, 0]} material={wood}>
        <cylinderGeometry args={[0.016, 0.02, 0.05, 16]} />
      </mesh>
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Vêtement complet                                                    */
/* ------------------------------------------------------------------ */

export interface Garment3DProps {
  category: CategoryKey;
  shape: ShapeParams;
  fabricColor: string;
  accessories: ChosenAccessory[];
}

function GarmentMeshes({ category, shape, fabricColor, accessories }: Garment3DProps) {
  const profile = React.useMemo(() => garmentProfile(category, shape), [category, shape]);
  const len = profile[profile.length - 1][1];
  const fabric = useFabricMat(fabricColor);
  const fabricDark = useFabricMat(fabricColor, true);

  const acc = (k: AccessoryKey) => accessories.find((a) => a.type === k);
  const has = (k: AccessoryKey) => Boolean(acc(k));

  const isLower = category === "jupe" || category === "pantalon";
  const topY = 0;
  const chestY = isLower ? -0.02 : -0.12;
  const waistY = isLower ? 0 : WAIST_Y;
  const hipY = isLower ? -0.14 : HIP_Y;

  const pantLegs = React.useMemo(() => {
    if (category !== "pantalon") return null;
    const topY2 = -0.26;
    const legLen = Math.abs(len - topY2) + 0.02;
    const rTop = 0.098;
    const rBot = Math.max(0.05, profile[profile.length - 1][0] * 0.72);
    return { topY2, legLen, rTop, rBot };
  }, [category, len, profile]);

  /* corps du vêtement : yoke du pantalon ou vêtement entier */
  const bodyGeom = React.useMemo(
    () => latheGeom(category === "pantalon" ? profile.slice(0, 3) : profile),
    [category, profile]
  );

  return (
    <group>
      {/* corps du vêtement */}
      {category === "pantalon" ? (
        <>
          <mesh geometry={bodyGeom} material={fabric} castShadow />
          {pantLegs &&
            [-1, 1].map((sx) => (
              <mesh
                key={sx}
                position={[sx * 0.088, pantLegs.topY2 - pantLegs.legLen / 2 + 0.02, 0]}
                material={fabric}
                castShadow
              >
                <cylinderGeometry args={[pantLegs.rTop, pantLegs.rBot, pantLegs.legLen, 28]} />
              </mesh>
            ))}
        </>
      ) : (
        <mesh geometry={bodyGeom} material={fabric} castShadow />
      )}

      {/* bande de taille */}
      {(shape.waistband || category === "jupe" || category === "pantalon") && (
        <mesh
          position={[0, isLower ? 0.006 : WAIST_Y, 0]}
          rotation={[Math.PI / 2, 0, 0]}
          material={fabricDark}
        >
          <cylinderGeometry args={[radiusAt(profile, isLower ? 0 : WAIST_Y) + 0.004, radiusAt(profile, isLower ? 0 : WAIST_Y) + 0.006, 0.028, 48, 1, true]} />
        </mesh>
      )}

      {/* manches + col */}
      <Sleeve kind={shape.sleeves} x={SHOULDER_R - 0.035} mat={fabric} />
      <Collar kind={shape.collar} profile={profile} mat={fabricDark} />

      {/* patte de boutonnage visible pour chemise/veste */}
      {(category === "chemise" || category === "veste") && (
        <mesh position={[0, len / 2, radiusAt(profile, len / 2) * 0.995 + 0.002]} material={fabricDark}>
          <boxGeometry args={[0.018, Math.abs(len) - 0.08, 0.006]} />
        </mesh>
      )}

      {/* accessoires retenus */}
      {has("bouton") && (
        <Buttons
          profile={profile}
          color={acc("bouton")!.color}
          yTop={isLower ? hipY * 0.7 : chestY}
          yBot={isLower ? len * 0.8 : Math.max(len * 0.55, waistY)}
          doubleBreasted={category === "veste"}
        />
      )}
      {has("fermeture") && (
        <Zipper
          profile={profile}
          color={acc("fermeture")!.color}
          yTop={isLower ? -0.02 : -0.05}
          yBot={isLower ? len * 0.7 : len * 0.8}
        />
      )}
      {has("rivet") && <Rivets profile={profile} color={acc("rivet")!.color} y={hipY * 0.92} />}
      {has("ceinture") && (
        <Belt color={acc("ceinture")!.color} y={isLower ? 0.012 : WAIST_Y} r={radiusAt(profile, isLower ? 0 : WAIST_Y)} />
      )}
      {has("poche") && (
        <Pockets profile={profile} color={fabricColor} y={isLower ? -0.2 : hipY * 0.85} r={radiusAt(profile, hipY)} />
      )}
      {has("noeud") && (
        <Noeud color={acc("noeud")!.color} y={isLower ? 0.01 : WAIST_Y} r={radiusAt(profile, isLower ? 0 : WAIST_Y) + 0.012} />
      )}
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Scène complète                                                      */
/* ------------------------------------------------------------------ */

export function Garment3D(props: Garment3DProps) {
  const { category, shape } = props;
  const len = Math.min(1.4, Math.max(0.35, shape.length / 100));
  const isLower = category === "jupe" || category === "pantalon";
  /* hauteur totale affichée : cou du mannequin + vêtement + pilier + embase */
  const topY = isLower ? 0.5 : 0.12;
  const botY = -len - 0.3;
  const totalH = topY - botY;
  const centerY = (topY + botY) / 2;
  const dist = Math.min(3.6, Math.max(0.95, totalH * 1.7));

  return (
    <Canvas
      dpr={[1, 2]}
      camera={{ position: [0.34 * dist, 0.1 * dist, 0.92 * dist], fov: 38 }}
      gl={{ alpha: true, antialias: true }}
      style={{ touchAction: "none" }}
    >
      <ambientLight intensity={0.55} />
      <directionalLight position={[2.2, 2.8, 2.4]} intensity={1.35} />
      <directionalLight position={[-2.4, 1.2, 1.2]} intensity={0.45} />
      <directionalLight position={[0, 2.2, -3]} intensity={0.7} color="#dfe8ff" />

      <group position={[0, -centerY, 0]}>
        <DressForm hemY={-len} />
        <GarmentMeshes {...props} />
      </group>

      <ContactShadows
        position={[0, botY - centerY + 0.012, 0]}
        opacity={0.38}
        scale={1.6}
        blur={2.6}
        far={1.2}
        resolution={512}
        color="#2b2118"
      />
      <mesh position={[0, botY - centerY, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.19, 48]} />
        <meshStandardMaterial color="#c9a06d" roughness={0.55} metalness={0.05} />
      </mesh>

      <OrbitControls
        target={[0, 0, 0]}
        enablePan={false}
        minDistance={0.55}
        maxDistance={4.2}
        minPolarAngle={0.55}
        maxPolarAngle={1.75}
        autoRotate
        autoRotateSpeed={0.9}
      />
    </Canvas>
  );
}

export default Garment3D;
