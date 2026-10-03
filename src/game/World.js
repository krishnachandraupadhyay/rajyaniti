import * as THREE from 'three';

export class World {
  constructor(scene) {
    this.scene = scene;
    this.crystals = [];
    this.torches = [];
    this.beaconIgnited = false;
    this.shrineUnlocked = false;

    this.createAtmosphere();
    this.createTerrain();
    this.createVillage();
    this.createAncientRuins();
    this.createWatchtowerBeacon();
    this.createCentralShrine();
    this.createFloraAndRocks();
    this.createCrystals();
  }

  // Terrain height mathematical model for smooth hills, paths, and peaks
  getTerrainHeight(x, z) {
    // Village center (x ~ 0, z ~ 10) is flat
    const distToVillage = Math.hypot(x, z - 10);
    const distToShrine = Math.hypot(x, z + 15);
    const distToBeacon = Math.hypot(x - 35, z + 35);

    // Watchtower hill
    if (distToBeacon < 22) {
      const t = Math.max(0, 1 - distToBeacon / 22);
      return t * t * 14.0;
    }

    // Shrine plateau
    if (distToShrine < 14) {
      return 1.2;
    }

    // Flat village plaza
    if (distToVillage < 18) {
      return 0.15;
    }

    // Rolling organic hills
    const hill1 = Math.sin(x * 0.05) * Math.cos(z * 0.05) * 2.2;
    const hill2 = Math.sin(x * 0.12 + 1.2) * Math.sin(z * 0.12) * 1.1;
    const ridge = Math.cos(x * 0.03 + z * 0.03) * 1.8;

    return Math.max(0, hill1 + hill2 + ridge);
  }

  createAtmosphere() {
    // Fog for depth and dreamlike fantasy atmosphere
    this.scene.fog = new THREE.FogExp2(0x18243b, 0.016);

    // Ambient Hemisphere Light (Sky vs Ground)
    const hemiLight = new THREE.HemisphereLight(0x93c5fd, 0x1e293b, 0.7);
    this.scene.add(hemiLight);

    // Directional Sunlight with Shadows
    this.sunLight = new THREE.DirectionalLight(0xfff7ed, 1.3);
    this.sunLight.position.set(40, 60, 30);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 1024;
    this.sunLight.shadow.mapSize.height = 1024;
    this.sunLight.shadow.camera.near = 10;
    this.sunLight.shadow.camera.far = 160;
    this.sunLight.shadow.camera.left = -50;
    this.sunLight.shadow.camera.right = 50;
    this.sunLight.shadow.camera.top = 50;
    this.sunLight.shadow.camera.bottom = -50;
    this.sunLight.shadow.bias = -0.0005;
    this.scene.add(this.sunLight);

    // Celestial Sky Dome
    const skyGeo = new THREE.SphereGeometry(180, 32, 16);
    const skyMat = new THREE.MeshBasicMaterial({
      color: 0x18243b,
      side: THREE.BackSide
    });
    const skyDome = new THREE.Mesh(skyGeo, skyMat);
    this.scene.add(skyDome);
  }

  createTerrain() {
    const size = 180;
    const segments = 100;
    const geo = new THREE.PlaneGeometry(size, size, segments, segments);
    geo.rotateX(-Math.PI / 2);

    const pos = geo.attributes.position;
    const colors = [];
    const colorLow = new THREE.Color(0x2d5a27); // Deep grass
    const colorMid = new THREE.Color(0x4ade80); // Bright emerald grass
    const colorHigh = new THREE.Color(0x94a3b8); // Stone rock
    const colorPeak = new THREE.Color(0xe2e8f0); // Mountain peak

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const y = this.getTerrainHeight(x, z);
      pos.setY(i, y);

      // Procedural vertex coloring based on height and position
      const tempColor = new THREE.Color();
      if (y > 9) {
        tempColor.lerpColors(colorHigh, colorPeak, (y - 9) / 5);
      } else if (y > 3) {
        tempColor.lerpColors(colorMid, colorHigh, (y - 3) / 6);
      } else {
        tempColor.lerpColors(colorLow, colorMid, y / 3);
      }
      colors.push(tempColor.r, tempColor.g, tempColor.b);
    }

    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geo.computeVertexNormals();

    const mat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.85,
      metalness: 0.1,
      flatShading: true
    });

    this.terrainMesh = new THREE.Mesh(geo, mat);
    this.terrainMesh.receiveShadow = true;
    this.scene.add(this.terrainMesh);

    // Cobblestone path ribbons
    this.createPathRibbon([
      new THREE.Vector3(0, 0, 8),
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, -15),
      new THREE.Vector3(15, 0, -25),
      new THREE.Vector3(35, 0, -35)
    ]);
  }

  createPathRibbon(points) {
    const pathMat = new THREE.MeshStandardMaterial({
      color: 0x78716c,
      roughness: 0.9,
      flatShading: true
    });

    for (let i = 0; i < points.length - 1; i++) {
      const p1 = points[i];
      const p2 = points[i + 1];
      const dist = p1.distanceTo(p2);
      const steps = Math.ceil(dist / 1.8);

      for (let s = 0; s <= steps; s++) {
        const t = s / steps;
        const curX = p1.x + (p2.x - p1.x) * t + (Math.random() - 0.5) * 0.4;
        const curZ = p1.z + (p2.z - p1.z) * t + (Math.random() - 0.5) * 0.4;
        const curY = this.getTerrainHeight(curX, curZ) + 0.04;

        const stoneGeo = new THREE.BoxGeometry(1.2 + Math.random() * 0.4, 0.08, 1.2 + Math.random() * 0.4);
        const stone = new THREE.Mesh(stoneGeo, pathMat);
        stone.position.set(curX, curY, curZ);
        stone.rotation.y = Math.random() * Math.PI;
        stone.receiveShadow = true;
        this.scene.add(stone);
      }
    }
  }

  // Village area with Elder's Sanctuary
  createVillage() {
    const villageGroup = new THREE.Group();
    villageGroup.position.set(0, 0, 10);

    // Elder Sanctuary Gazebo
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x5c4033, roughness: 0.7 });
    const roofMat = new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.6 });
    const stoneMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.8 });

    // Platform
    const platGeo = new THREE.CylinderGeometry(5.5, 6, 0.5, 8);
    const platform = new THREE.Mesh(platGeo, stoneMat);
    platform.position.y = 0.25;
    platform.receiveShadow = true;
    villageGroup.add(platform);

    // Columns
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const colX = Math.cos(angle) * 4.2;
      const colZ = Math.sin(angle) * 4.2;
      const colGeo = new THREE.CylinderGeometry(0.22, 0.26, 4.2, 8);
      const col = new THREE.Mesh(colGeo, woodMat);
      col.position.set(colX, 2.3, colZ);
      col.castShadow = true;
      villageGroup.add(col);
    }

    // Pagoda Roof
    const roofGeo = new THREE.ConeGeometry(6.2, 2.4, 8);
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.y = 5.2;
    roof.castShadow = true;
    villageGroup.add(roof);

    // Central Altar Stone
    const altarGeo = new THREE.BoxGeometry(1.4, 1.0, 1.4);
    const altar = new THREE.Mesh(altarGeo, stoneMat);
    altar.position.set(0, 0.75, 0);
    altar.castShadow = true;
    villageGroup.add(altar);

    // Village Huts nearby
    this.createHut(-12, 16, -0.4);
    this.createHut(14, 14, 0.6);

    this.scene.add(villageGroup);
  }

  createHut(x, z, rot) {
    const y = this.getTerrainHeight(x, z);
    const hut = new THREE.Group();
    hut.position.set(x, y, z);
    hut.rotation.y = rot;

    const wallMat = new THREE.MeshStandardMaterial({ color: 0x785e4f, roughness: 0.8 });
    const thatchMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.9 });

    // Base
    const baseGeo = new THREE.BoxGeometry(3.6, 2.4, 3.6);
    const base = new THREE.Mesh(baseGeo, wallMat);
    base.position.y = 1.2;
    base.castShadow = true;
    hut.add(base);

    // Roof
    const roofGeo = new THREE.ConeGeometry(3.2, 1.8, 4);
    const roof = new THREE.Mesh(roofGeo, thatchMat);
    roof.position.y = 3.1;
    roof.rotation.y = Math.PI / 4;
    roof.castShadow = true;
    hut.add(roof);

    this.scene.add(hut);
  }

  createAncientRuins() {
    const ruinsGroup = new THREE.Group();
    ruinsGroup.position.set(-30, 0, -25);
    const ruinsY = this.getTerrainHeight(-30, -25);
    ruinsGroup.position.y = ruinsY;

    const stoneMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.9 });

    // Ancient Arch
    const p1 = new THREE.Mesh(new THREE.BoxGeometry(1.2, 5.0, 1.2), stoneMat);
    p1.position.set(-3, 2.5, 0);
    p1.castShadow = true;
    ruinsGroup.add(p1);

    const p2 = new THREE.Mesh(new THREE.BoxGeometry(1.2, 5.0, 1.2), stoneMat);
    p2.position.set(3, 2.5, 0);
    p2.castShadow = true;
    ruinsGroup.add(p2);

    const lintel = new THREE.Mesh(new THREE.BoxGeometry(7.6, 1.0, 1.6), stoneMat);
    lintel.position.set(0, 5.4, 0);
    lintel.castShadow = true;
    ruinsGroup.add(lintel);

    // Broken pillars
    for (let i = 0; i < 4; i++) {
      const h = 1.5 + Math.random() * 2.5;
      const pil = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.7, h, 8), stoneMat);
      pil.position.set(-6 + i * 4, h / 2, 4 + (i % 2) * 3);
      pil.castShadow = true;
      ruinsGroup.add(pil);
    }

    this.scene.add(ruinsGroup);
  }

  // Mountain Watchtower & Beacon
  createWatchtowerBeacon() {
    this.beaconGroup = new THREE.Group();
    this.beaconPos = new THREE.Vector3(35, 0, 35);
    const y = this.getTerrainHeight(this.beaconPos.x, this.beaconPos.z);
    this.beaconGroup.position.set(this.beaconPos.x, y, this.beaconPos.z);

    const stoneMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.8 });
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.7 });

    // Tower Base
    const towerGeo = new THREE.CylinderGeometry(2.4, 3.2, 7.0, 8);
    const tower = new THREE.Mesh(towerGeo, stoneMat);
    tower.position.y = 3.5;
    tower.castShadow = true;
    this.beaconGroup.add(tower);

    // Observation platform
    const platGeo = new THREE.CylinderGeometry(3.6, 3.6, 0.6, 8);
    const plat = new THREE.Mesh(platGeo, woodMat);
    plat.position.y = 7.3;
    plat.castShadow = true;
    this.beaconGroup.add(plat);

    // Sacred Brazier Bowl
    const bowlGeo = new THREE.CylinderGeometry(1.2, 0.6, 1.0, 8);
    const bowlMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8, roughness: 0.3 });
    const bowl = new THREE.Mesh(bowlGeo, bowlMat);
    bowl.position.y = 8.1;
    this.beaconGroup.add(bowl);

    // Beacon Flame (Initially hidden/small ember, ignites brightly in Quest 3)
    const flameGeo = new THREE.SphereGeometry(1.1, 16, 16);
    this.beaconFlameMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b, transparent: true, opacity: 0.3 });
    this.beaconFlame = new THREE.Mesh(flameGeo, this.beaconFlameMat);
    this.beaconFlame.position.y = 9.2;
    this.beaconGroup.add(this.beaconFlame);

    // Beacon Light source
    this.beaconLight = new THREE.PointLight(0xf59e0b, 0.4, 25);
    this.beaconLight.position.y = 9.2;
    this.beaconGroup.add(this.beaconLight);

    this.scene.add(this.beaconGroup);
  }

  // Ignite Beacon (Called when player reaches beacon in Quest 3)
  igniteBeacon() {
    this.beaconIgnited = true;
    this.beaconFlameMat.color.set(0xff7700);
    this.beaconFlameMat.opacity = 0.95;
    this.beaconLight.intensity = 5.0;
    this.beaconLight.color.set(0xffaa22);
    this.beaconFlame.scale.set(1.6, 2.2, 1.6);
  }

  // Central Astral Shrine
  createCentralShrine() {
    this.shrineGroup = new THREE.Group();
    this.shrinePos = new THREE.Vector3(0, 0, -15);
    const y = this.getTerrainHeight(this.shrinePos.x, this.shrinePos.z);
    this.shrineGroup.position.set(this.shrinePos.x, y, this.shrinePos.z);

    const stoneMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.6, metalness: 0.3 });
    const runeMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, wireframe: true });

    // Multi-tier base
    const base1 = new THREE.Mesh(new THREE.CylinderGeometry(6.5, 7.0, 0.8, 8), stoneMat);
    base1.position.y = 0.4;
    this.shrineGroup.add(base1);

    const base2 = new THREE.Mesh(new THREE.CylinderGeometry(4.5, 5.0, 0.8, 8), stoneMat);
    base2.position.y = 1.2;
    this.shrineGroup.add(base2);

    // 4 Shrine Rune Pillars
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2;
      const px = Math.cos(angle) * 3.6;
      const pz = Math.sin(angle) * 3.6;
      const pil = new THREE.Mesh(new THREE.BoxGeometry(0.8, 3.8, 0.8), stoneMat);
      pil.position.set(px, 3.1, pz);
      pil.castShadow = true;
      this.shrineGroup.add(pil);

      const runeOrb = new THREE.Mesh(new THREE.OctahedronGeometry(0.35), runeMat);
      runeOrb.position.set(px, 5.2, pz);
      this.shrineGroup.add(runeOrb);
    }

    // Shrine Seal Barrier Sphere (Dissolves when Quest 4 completes)
    const sealGeo = new THREE.SphereGeometry(2.4, 24, 24);
    this.sealMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.45,
      roughness: 0.1,
      metalness: 0.8
    });
    this.shrineSeal = new THREE.Mesh(sealGeo, this.sealMat);
    this.shrineSeal.position.y = 2.6;
    this.shrineGroup.add(this.shrineSeal);

    // Ancient Relic (Golden Floating Artifact inside the seal)
    const relicGeo = new THREE.DodecahedronGeometry(0.7, 0);
    this.relicMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      metalness: 0.9,
      roughness: 0.2,
      emissive: 0xd97706,
      emissiveIntensity: 0.4
    });
    this.relicMesh = new THREE.Mesh(relicGeo, this.relicMat);
    this.relicMesh.position.y = 2.6;
    this.shrineGroup.add(this.relicMesh);

    this.shrineLight = new THREE.PointLight(0x38bdf8, 2.0, 16);
    this.shrineLight.position.y = 2.6;
    this.shrineGroup.add(this.shrineLight);

    this.scene.add(this.shrineGroup);
  }

  // Unseal shrine (Quest 4 completion)
  unlockShrine() {
    this.shrineUnlocked = true;
    this.sealMat.opacity = 0.05;
    this.relicMat.emissiveIntensity = 1.0;
    this.shrineLight.color.set(0xf59e0b);
    this.shrineLight.intensity = 4.5;
  }

  // 4 Elemental Crystals scattered around the realm
  createCrystals() {
    const crystalDefs = [
      {
        id: 'crystal_water',
        name: 'नीलम जल क्रिस्टल (Water Sapphire)',
        color: 0x0284c7,
        x: -22,
        z: 8
      },
      {
        id: 'crystal_fire',
        name: 'माणिक अग्नि क्रिस्टल (Fire Ruby)',
        color: 0xef4444,
        x: 24,
        z: -14
      },
      {
        id: 'crystal_earth',
        name: 'पन्ना पृथ्वी क्रिस्टल (Earth Emerald)',
        color: 0x10b981,
        x: -18,
        z: 32
      },
      {
        id: 'crystal_air',
        name: 'जादुई वायु क्रिस्टल (Air Amethyst)',
        color: 0xa855f7,
        x: 18,
        z: 30
      }
    ];

    crystalDefs.forEach((def) => {
      const y = this.getTerrainHeight(def.x, def.z) + 1.2;
      const crystalGroup = new THREE.Group();
      crystalGroup.position.set(def.x, y, def.z);

      // Crystal Geometry
      const geo = new THREE.OctahedronGeometry(0.65, 0);
      geo.scale(0.8, 1.8, 0.8);
      const mat = new THREE.MeshStandardMaterial({
        color: def.color,
        emissive: def.color,
        emissiveIntensity: 0.6,
        roughness: 0.2,
        metalness: 0.8,
        transparent: true,
        opacity: 0.92
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.castShadow = true;
      crystalGroup.add(mesh);

      // Orbital glow ring
      const ringGeo = new THREE.TorusGeometry(1.0, 0.04, 8, 24);
      const ringMat = new THREE.MeshBasicMaterial({ color: def.color, transparent: true, opacity: 0.6 });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = Math.PI / 2;
      crystalGroup.add(ring);

      // Point Light
      const light = new THREE.PointLight(def.color, 1.5, 10);
      crystalGroup.add(light);

      this.scene.add(crystalGroup);

      this.crystals.push({
        id: def.id,
        name: def.name,
        color: def.color,
        group: crystalGroup,
        mesh,
        ring,
        collected: false,
        pos: new THREE.Vector3(def.x, y, def.z)
      });
    });
  }

  // Flora (Trees, Shrubs) & Rocks
  createFloraAndRocks() {
    const treeMatTrunk = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.9 });
    const treeMatFoliage1 = new THREE.MeshStandardMaterial({ color: 0x166534, roughness: 0.8, flatShading: true });
    const treeMatFoliage2 = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.8, flatShading: true });
    const rockMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.9, flatShading: true });

    // Seeded pseudo-random forest clusters
    for (let i = 0; i < 65; i++) {
      const angle = (i / 65) * Math.PI * 2 + (i % 5);
      const radius = 18 + ((i * 13) % 65);
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;

      // Avoid blocking village center or shrine
      if (Math.hypot(x, z - 10) < 10 || Math.hypot(x, z + 15) < 9) continue;

      const y = this.getTerrainHeight(x, z);

      if (i % 3 === 0) {
        // Pine Tree
        const tree = new THREE.Group();
        tree.position.set(x, y, z);
        const scale = 0.8 + ((i % 5) * 0.15);
        tree.scale.set(scale, scale, scale);

        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.4, 2.0, 6), treeMatTrunk);
        trunk.position.y = 1.0;
        trunk.castShadow = true;
        tree.add(trunk);

        const c1 = new THREE.Mesh(new THREE.ConeGeometry(2.0, 2.5, 6), treeMatFoliage1);
        c1.position.y = 2.8;
        c1.castShadow = true;
        tree.add(c1);

        const c2 = new THREE.Mesh(new THREE.ConeGeometry(1.5, 2.2, 6), treeMatFoliage2);
        c2.position.y = 4.2;
        c2.castShadow = true;
        tree.add(c2);

        this.scene.add(tree);
      } else if (i % 3 === 1) {
        // Rounded Oak Tree
        const tree = new THREE.Group();
        tree.position.set(x, y, z);
        const scale = 0.7 + ((i % 4) * 0.18);
        tree.scale.set(scale, scale, scale);

        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.5, 2.2, 6), treeMatTrunk);
        trunk.position.y = 1.1;
        trunk.castShadow = true;
        tree.add(trunk);

        const foliage = new THREE.Mesh(new THREE.DodecahedronGeometry(2.0, 1), treeMatFoliage2);
        foliage.position.y = 3.2;
        foliage.castShadow = true;
        tree.add(foliage);

        this.scene.add(tree);
      } else {
        // Natural Rock Boulder
        const rockGeo = new THREE.DodecahedronGeometry(0.8 + (i % 3) * 0.4, 0);
        const rock = new THREE.Mesh(rockGeo, rockMat);
        rock.position.set(x, y + 0.4, z);
        rock.rotation.set(i * 0.4, i * 0.8, i * 0.2);
        rock.scale.set(1.2, 0.8, 1.0);
        rock.castShadow = true;
        rock.receiveShadow = true;
        this.scene.add(rock);
      }
    }
  }

  // Update dynamic elements (Crystal spins, Beacon flicker, Shrine glow)
  update(delta, totalTime) {
    // 1. Crystal animations
    this.crystals.forEach((c) => {
      if (!c.collected) {
        c.mesh.rotation.y += delta * 1.8;
        c.mesh.rotation.x = Math.sin(totalTime * 2) * 0.15;
        c.group.position.y = c.pos.y + Math.sin(totalTime * 2.5 + c.pos.x) * 0.25;
        c.ring.rotation.z += delta * 2.2;
      }
    });

    // 2. Beacon flicker
    if (this.beaconIgnited) {
      const flicker = 1.0 + Math.sin(totalTime * 15) * 0.15 + Math.cos(totalTime * 23) * 0.1;
      this.beaconFlame.scale.set(1.5 * flicker, 2.2 * flicker, 1.5 * flicker);
    }

    // 3. Shrine animations
    if (this.relicMesh) {
      this.relicMesh.rotation.y += delta * 1.2;
      this.relicMesh.rotation.x += delta * 0.6;
      this.relicMesh.position.y = 2.6 + Math.sin(totalTime * 2.0) * 0.18;
    }
    if (this.shrineSeal && !this.shrineUnlocked) {
      this.shrineSeal.rotation.y -= delta * 0.4;
    }
  }
}
