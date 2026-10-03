import * as THREE from 'three';

export class World {
  constructor(scene) {
    this.scene = scene;
    this.colliders = [];
    this.streetLights = [];
    this.interactiveSpots = {};

    this.createAtmosphere();
    this.createTownTerrainAndRoads();
    this.createBuildings();
    this.createStreetFurnitureAndVehicles();
    this.createTreesAndParks();
  }

  // Flat town terrain with slight road grading for mobile stability
  getTerrainHeight(x, z) {
    // Road & sidewalk zone is flat
    return 0;
  }

  // Check collision for character movement
  checkCollision(pos, radius = 0.45) {
    for (const box of this.colliders) {
      if (
        pos.x + radius > box.minX &&
        pos.x - radius < box.maxX &&
        pos.z + radius > box.minZ &&
        pos.z - radius < box.maxZ
      ) {
        return true;
      }
    }
    return false;
  }

  addCollider(x, z, width, depth) {
    this.colliders.push({
      minX: x - width / 2,
      maxX: x + width / 2,
      minZ: z - depth / 2,
      maxZ: z + depth / 2
    });
  }

  createAtmosphere() {
    // Atmospheric fantasy fog replaced with natural Indian town haze
    this.scene.fog = new THREE.FogExp2(0xd6e4f0, 0.012);

    // Hemispheric Ambient Light (Sky / Earth)
    this.hemiLight = new THREE.HemisphereLight(0xfff7ed, 0x94a3b8, 0.75);
    this.scene.add(this.hemiLight);

    // Directional Sunlight with Soft Shadows
    this.sunLight = new THREE.DirectionalLight(0xffedd5, 1.25);
    this.sunLight.position.set(35, 60, 25);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 1024;
    this.sunLight.shadow.mapSize.height = 1024;
    this.sunLight.shadow.camera.near = 5;
    this.sunLight.shadow.camera.far = 140;
    this.sunLight.shadow.camera.left = -45;
    this.sunLight.shadow.camera.right = 45;
    this.sunLight.shadow.camera.top = 45;
    this.sunLight.shadow.camera.bottom = -45;
    this.sunLight.shadow.bias = -0.0005;
    this.scene.add(this.sunLight);

    // Sky Dome
    const skyGeo = new THREE.SphereGeometry(160, 24, 16);
    this.skyMat = new THREE.MeshBasicMaterial({ color: 0x87ceeb, side: THREE.BackSide });
    this.skyDome = new THREE.Mesh(skyGeo, this.skyMat);
    this.scene.add(this.skyDome);
  }

  createTownTerrainAndRoads() {
    // 1. Ground Grounding Plinth (Earth/Grass)
    const groundGeo = new THREE.PlaneGeometry(160, 160);
    groundGeo.rotateX(-Math.PI / 2);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x5b7c53, // Natural dry-green lawn
      roughness: 0.9,
      metalness: 0.05
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.receiveShadow = true;
    this.scene.add(ground);

    // 2. Main Asphalt Road (North-South Avenue: Z from -50 to 50, X from -4 to 4)
    const roadMat = new THREE.MeshStandardMaterial({
      color: 0x27272a, // Dark asphalt
      roughness: 0.85
    });
    const roadGeo = new THREE.PlaneGeometry(9, 110);
    roadGeo.rotateX(-Math.PI / 2);
    const mainRoad = new THREE.Mesh(roadGeo, roadMat);
    mainRoad.position.set(0, 0.02, 0);
    mainRoad.receiveShadow = true;
    this.scene.add(mainRoad);

    // Cross Road (East-West: X from -50 to 50, Z from -4 to 4)
    const crossRoadGeo = new THREE.PlaneGeometry(110, 8);
    crossRoadGeo.rotateX(-Math.PI / 2);
    const crossRoad = new THREE.Mesh(crossRoadGeo, roadMat);
    crossRoad.position.set(0, 0.022, 0);
    crossRoad.receiveShadow = true;
    this.scene.add(crossRoad);

    // 3. Road Markings (White dashed line + Yellow divider)
    const markMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 }); // Indian Yellow
    for (let z = -48; z <= 48; z += 5) {
      const stripeGeo = new THREE.PlaneGeometry(0.24, 2.5);
      stripeGeo.rotateX(-Math.PI / 2);
      const stripe = new THREE.Mesh(stripeGeo, markMat);
      stripe.position.set(0, 0.026, z);
      this.scene.add(stripe);
    }

    // Zebra Crossings at Intersection
    const zebraMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    [-7, 7].forEach((zPos) => {
      for (let x = -3.6; x <= 3.6; x += 0.9) {
        const barGeo = new THREE.PlaneGeometry(0.5, 2.0);
        barGeo.rotateX(-Math.PI / 2);
        const bar = new THREE.Mesh(barGeo, zebraMat);
        bar.position.set(x, 0.028, zPos);
        this.scene.add(bar);
      }
    });

    // 4. Sidewalks / Footpaths with Curbstones
    const curbMat = new THREE.MeshStandardMaterial({ color: 0x9ca3af, roughness: 0.8 });
    const sidewalkMat = new THREE.MeshStandardMaterial({ color: 0xd1d5db, roughness: 0.9 });

    // Left Sidewalk
    const swLeft = new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.16, 110), sidewalkMat);
    swLeft.position.set(-6.25, 0.08, 0);
    swLeft.receiveShadow = true;
    this.scene.add(swLeft);

    // Right Sidewalk
    const swRight = new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.16, 110), sidewalkMat);
    swRight.position.set(6.25, 0.08, 0);
    swRight.receiveShadow = true;
    this.scene.add(swRight);

    // Potholed / Broken Road Section for Mission 1
    this.createPotholeSection(-1.8, 0.03, 3.5);
  }

  // Pothole Section with warning barrier
  createPotholeSection(x, y, z) {
    this.potholeGroup = new THREE.Group();
    this.potholeGroup.position.set(x, y, z);

    // Pothole depression decal
    const holeGeo = new THREE.CircleGeometry(1.2, 12);
    holeGeo.rotateX(-Math.PI / 2);
    const holeMat = new THREE.MeshStandardMaterial({
      color: 0x18181b,
      roughness: 0.95
    });
    this.potholeMesh = new THREE.Mesh(holeGeo, holeMat);
    this.potholeGroup.add(this.potholeMesh);

    // Water puddle inside pothole
    const puddleGeo = new THREE.CircleGeometry(0.85, 12);
    puddleGeo.rotateX(-Math.PI / 2);
    const puddleMat = new THREE.MeshStandardMaterial({
      color: 0x3b82f6,
      roughness: 0.1,
      metalness: 0.8,
      transparent: true,
      opacity: 0.65
    });
    this.puddleMesh = new THREE.Mesh(puddleGeo, puddleMat);
    this.puddleMesh.position.y = 0.005;
    this.potholeGroup.add(this.puddleMesh);

    // Makeshift red flag / warning stick
    const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.2, 6), new THREE.MeshStandardMaterial({ color: 0x78350f }));
    stick.position.set(0.6, 0.6, 0.6);
    this.potholeGroup.add(stick);

    const flag = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.2, 0.02), new THREE.MeshBasicMaterial({ color: 0xef4444 }));
    flag.position.set(0.75, 1.1, 0.6);
    this.potholeGroup.add(flag);

    this.scene.add(this.potholeGroup);
    this.interactiveSpots.pothole = new THREE.Vector3(x, y, z);
  }

  // Fix Pothole (Called after Nagar Nigam petition approval!)
  repairPotholes() {
    if (this.puddleMesh) this.puddleMesh.visible = false;
    if (this.potholeMesh) {
      this.potholeMesh.material.color.set(0x3f3f46); // Fresh blacktop patch
    }
  }

  // Main Indian Neighborhood Buildings
  createBuildings() {
    // 1. Player's Home (हमारा घर) - South Side (0, 0, 24)
    this.createPlayerHouse(0, 24);

    // 2. Ramesh Chai Tapri & Kirana (14, 0, 8)
    this.createChaiTapri(14, 8);

    // 3. Nagar Nigam Ward 7 Municipal Office (-18, 0, -10)
    this.createNagarNigamOffice(-18, -10);

    // 4. Primary Health Center / Clinic (18, 0, -16)
    this.createHealthCenter(18, -16);

    // 5. Govt Primary School (-18, 0, 18)
    this.createSchool(-18, 18);

    // 6. Gandhi Maidan Rally Ground & Public Stage (0, 0, -32)
    this.createGandhiMaidan(0, -32);

    // 7. Police Chowki (-14, 0, 4)
    this.createPoliceChowki(-14, 4);

    // 8. Bus Stop Shelter (8, 0, 2)
    this.createBusStop(8, 2);
  }

  // Player's Residence
  createPlayerHouse(x, z) {
    const house = new THREE.Group();
    house.position.set(x, 0, z);

    const wallMat = new THREE.MeshStandardMaterial({ color: 0xfef08a, roughness: 0.85 }); // Warm Indian cream-yellow
    const roofMat = new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.7 }); // Terracotta tile roof
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.8 });

    // Main House Block
    const base = new THREE.Mesh(new THREE.BoxGeometry(7, 3.6, 6), wallMat);
    base.position.y = 1.8;
    base.castShadow = true;
    base.receiveShadow = true;
    house.add(base);

    // Pitched Roof
    const roof = new THREE.Mesh(new THREE.ConeGeometry(5.4, 1.8, 4), roofMat);
    roof.position.y = 4.3;
    roof.rotation.y = Math.PI / 4;
    roof.castShadow = true;
    house.add(roof);

    // Front Veranda / Porch
    const porch = new THREE.Mesh(new THREE.BoxGeometry(5.5, 0.2, 2.4), new THREE.MeshStandardMaterial({ color: 0xd1d5db }));
    porch.position.set(0, 0.1, -3.8);
    house.add(porch);

    // Front Door & Nameplate
    const door = new THREE.Mesh(new THREE.BoxGeometry(1.0, 2.1, 0.08), woodMat);
    door.position.set(0, 1.05, -3.02);
    house.add(door);

    const nameplate = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.22, 0.05), new THREE.MeshStandardMaterial({ color: 0x1e3a8a }));
    nameplate.position.set(0, 2.3, -3.02);
    house.add(nameplate);

    // Tulsi Chaura (Indian sacred basil planter pot in courtyard)
    const tulsiPot = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.7, 0.5), new THREE.MeshStandardMaterial({ color: 0xd97706 }));
    tulsiPot.position.set(-1.8, 0.35, -3.8);
    house.add(tulsiPot);
    const plant = new THREE.Mesh(new THREE.DodecahedronGeometry(0.28, 0), new THREE.MeshStandardMaterial({ color: 0x15803d }));
    plant.position.set(-1.8, 0.85, -3.8);
    house.add(plant);

    // Traditional Charpai (Wooden cot)
    const cot = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.4, 0.9), new THREE.MeshStandardMaterial({ color: 0xa16207 }));
    cot.position.set(1.6, 0.25, -3.8);
    house.add(cot);

    this.scene.add(house);
    this.addCollider(x, z, 7.5, 6.5);
    this.interactiveSpots.home = new THREE.Vector3(x, 0, z - 3.2);
  }

  // Ramesh Chai Tapri & Kirana Store
  createChaiTapri(x, z) {
    const tapri = new THREE.Group();
    tapri.position.set(x, 0, z);

    const woodMat = new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.8 });
    const blueTinMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.5, metalness: 0.2 });

    // Shop Counter Platform
    const counter = new THREE.Mesh(new THREE.BoxGeometry(4.2, 1.1, 2.2), woodMat);
    counter.position.y = 0.55;
    counter.castShadow = true;
    tapri.add(counter);

    // Tin Roof Canopy (Slanted blue tin roof typical of roadside shops)
    const tinRoof = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.1, 3.4), blueTinMat);
    tinRoof.position.set(0, 2.7, 0.2);
    tinRoof.rotation.x = 0.12;
    tinRoof.castShadow = true;
    tapri.add(tinRoof);

    // Support pillars
    [-2.1, 2.1].forEach((px) => {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.7, 8), new THREE.MeshStandardMaterial({ color: 0x4b5563 }));
      pole.position.set(px, 1.35, -1.2);
      tapri.add(pole);
    });

    // Brass Tea Kettle (चाय की केतली)
    const kettle = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.15, 0.35, 10), new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.8, roughness: 0.2 }));
    kettle.position.set(-0.8, 1.25, 0);
    tapri.add(kettle);

    // Stove Gas Cylinder (LPG Red cylinder)
    const cylinder = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.65, 10), new THREE.MeshStandardMaterial({ color: 0xdc2626 }));
    cylinder.position.set(-1.4, 0.32, -0.6);
    tapri.add(cylinder);

    // Cutting Chai glasses in rack
    const rack = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.15, 0.4), new THREE.MeshStandardMaterial({ color: 0x9ca3af }));
    rack.position.set(-0.1, 1.18, 0);
    tapri.add(rack);

    // Shop Signboard ("रमेश टी स्टॉल व किराना")
    const sign = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.6, 0.08), new THREE.MeshStandardMaterial({ color: 0x1e3a8a }));
    sign.position.set(0, 3.1, -1.3);
    tapri.add(sign);

    // Customer benches
    const bench1 = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.45, 0.4), woodMat);
    bench1.position.set(0, 0.22, -2.4);
    tapri.add(bench1);

    // Warm Lantern Light
    const lantern = new THREE.PointLight(0xf59e0b, 1.2, 8);
    lantern.position.set(0, 2.4, 0);
    tapri.add(lantern);

    this.scene.add(tapri);
    this.addCollider(x, z, 4.8, 2.8);
    this.interactiveSpots.chai = new THREE.Vector3(x, 0, z - 1.8);
  }

  // Nagar Nigam / Municipal Ward 7 Office
  createNagarNigamOffice(x, z) {
    const office = new THREE.Group();
    office.position.set(x, 0, z);

    const govtWallMat = new THREE.MeshStandardMaterial({ color: 0xf3f4f6, roughness: 0.7 }); // Govt off-white / light grey
    const trimMat = new THREE.MeshStandardMaterial({ color: 0x1e3a8a, roughness: 0.6 }); // Deep Blue trim

    // 2-Story Main Building
    const building = new THREE.Mesh(new THREE.BoxGeometry(10, 5.8, 7.5), govtWallMat);
    building.position.y = 2.9;
    building.castShadow = true;
    building.receiveShadow = true;
    office.add(building);

    // Blue Header Parapet
    const parapet = new THREE.Mesh(new THREE.BoxGeometry(10.2, 0.6, 7.7), trimMat);
    parapet.position.y = 5.9;
    office.add(parapet);

    // Front Entrance Portico & Pillars
    const portico = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.3, 2.8), trimMat);
    portico.position.set(0, 3.4, -4.5);
    office.add(portico);

    [-1.8, 1.8].forEach((px) => {
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 3.4, 10), govtWallMat);
      col.position.set(px, 1.7, -4.5);
      col.castShadow = true;
      office.add(col);
    });

    // Main Entrance Doors
    const glassDoor = new THREE.Mesh(new THREE.BoxGeometry(2.4, 2.4, 0.1), new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.2 }));
    glassDoor.position.set(0, 1.2, -3.76);
    office.add(glassDoor);

    // Signboard: "नगर निगम कार्यालय - वार्ड 7 आनंदनगर"
    const signBoard = new THREE.Mesh(new THREE.BoxGeometry(5.0, 0.8, 0.1), new THREE.MeshStandardMaterial({ color: 0x065f46 })); // Govt Green
    signBoard.position.set(0, 4.2, -3.8);
    office.add(signBoard);

    // Public Grievance Drop Box (शिकायत पेटी - Red Indian Post/Grievance Box)
    const dropBox = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.65, 0.3), new THREE.MeshStandardMaterial({ color: 0xdc2626 }));
    dropBox.position.set(-2.6, 1.4, -4.0);
    office.add(dropBox);

    // Notice Board (सूचना पट्ट)
    const noticeBoard = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.2, 0.08), new THREE.MeshStandardMaterial({ color: 0x92400e }));
    noticeBoard.position.set(2.6, 1.8, -3.8);
    office.add(noticeBoard);

    // Indian National Tricolor Flagpole (तिरंगा ध्वज)
    const flagPole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 7.5, 8), new THREE.MeshStandardMaterial({ color: 0xd1d5db, metalness: 0.8 }));
    flagPole.position.set(4.2, 3.75, -5.2);
    office.add(flagPole);

    // Tricolor Flag Mesh (Saffron, White, Green)
    const flagGeo = new THREE.PlaneGeometry(1.2, 0.75, 4, 2);
    const flagCanvas = document.createElement('canvas');
    flagCanvas.width = 128;
    flagCanvas.height = 80;
    const fctx = flagCanvas.getContext('2d');
    fctx.fillStyle = '#ff9933'; fctx.fillRect(0, 0, 128, 26);
    fctx.fillStyle = '#ffffff'; fctx.fillRect(0, 26, 128, 28);
    fctx.fillStyle = '#138808'; fctx.fillRect(0, 54, 128, 26);
    // Ashoka Chakra
    fctx.strokeStyle = '#000080'; fctx.lineWidth = 2;
    fctx.beginPath(); fctx.arc(64, 40, 10, 0, Math.PI * 2); fctx.stroke();

    const flagTexture = new THREE.CanvasTexture(flagCanvas);
    const flagMat = new THREE.MeshStandardMaterial({ map: flagTexture, side: THREE.DoubleSide, roughness: 0.5 });
    const flagMesh = new THREE.Mesh(flagGeo, flagMat);
    flagMesh.position.set(4.8, 6.8, -5.2);
    office.add(flagMesh);

    this.scene.add(office);
    this.addCollider(x, z, 10.5, 8.0);
    this.interactiveSpots.nagarnigam = new THREE.Vector3(x, 0, z - 4.5);
  }

  // Primary Health Center (प्राथमिक स्वास्थ्य केंद्र)
  createHealthCenter(x, z) {
    const phc = new THREE.Group();
    phc.position.set(x, 0, z);

    const clinicWallMat = new THREE.MeshStandardMaterial({ color: 0xf0fdf4, roughness: 0.7 }); // Mint white
    const greenTrimMat = new THREE.MeshStandardMaterial({ color: 0x166534, roughness: 0.6 });

    // Clinic Main Block
    const block = new THREE.Mesh(new THREE.BoxGeometry(8, 4.2, 6.5), clinicWallMat);
    block.position.y = 2.1;
    block.castShadow = true;
    phc.add(block);

    // Green Roof Border
    const trim = new THREE.Mesh(new THREE.BoxGeometry(8.2, 0.4, 6.7), greenTrimMat);
    trim.position.y = 4.3;
    phc.add(trim);

    // Red Cross Medical Sign (लाल क्रॉस)
    const crossH = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.35, 0.08), new THREE.MeshBasicMaterial({ color: 0xdc2626 }));
    crossH.position.set(0, 3.2, -3.3);
    phc.add(crossH);

    const crossV = new THREE.Mesh(new THREE.BoxGeometry(0.35, 1.2, 0.08), new THREE.MeshBasicMaterial({ color: 0xdc2626 }));
    crossV.position.set(0, 3.2, -3.3);
    phc.add(crossV);

    // Clinic Entrance
    const door = new THREE.Mesh(new THREE.BoxGeometry(1.8, 2.2, 0.1), new THREE.MeshStandardMaterial({ color: 0x1f2937 }));
    door.position.set(0, 1.1, -3.26);
    phc.add(door);

    // Ambulance Van (Parked in front)
    this.createAmbulance(phc, -3.2, -4.5);

    this.scene.add(phc);
    this.addCollider(x, z, 8.5, 7.0);
    this.interactiveSpots.clinic = new THREE.Vector3(x, 0, z - 3.8);
  }

  createAmbulance(parent, lx, lz) {
    const amb = new THREE.Group();
    amb.position.set(lx, 0, lz);

    // Body
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 });
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.5, 3.6), bodyMat);
    body.position.y = 1.0;
    body.castShadow = true;
    amb.add(body);

    // Red emergency cross on side
    const cross = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.6, 0.6), new THREE.MeshBasicMaterial({ color: 0xdc2626 }));
    cross.position.set(0.91, 1.1, 0);
    amb.add(cross);

    // Siren beacon on roof
    const siren = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.2, 8), new THREE.MeshBasicMaterial({ color: 0xef4444 }));
    siren.position.set(0, 1.85, 0.5);
    amb.add(siren);

    // Wheels
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.9 });
    [[-0.95, 0.35, -1.1], [0.95, 0.35, -1.1], [-0.95, 0.35, 1.1], [0.95, 0.35, 1.1]].forEach(([wx, wy, wz]) => {
      const w = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.2, 10), wheelMat);
      w.rotation.z = Math.PI / 2;
      w.position.set(wx, wy, wz);
      amb.add(w);
    });

    parent.add(amb);
  }

  // Government Primary School (राजकीय प्राथमिक विद्यालय)
  createSchool(x, z) {
    const school = new THREE.Group();
    school.position.set(x, 0, z);

    const schoolMat = new THREE.MeshStandardMaterial({ color: 0xfde047, roughness: 0.8 }); // Cheerful Indian primary school yellow
    const blueTrim = new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.6 });

    // Main Classroom Block
    const block = new THREE.Mesh(new THREE.BoxGeometry(9.0, 3.8, 6.0), schoolMat);
    block.position.y = 1.9;
    block.castShadow = true;
    school.add(block);

    // Roof Overhang
    const roof = new THREE.Mesh(new THREE.BoxGeometry(9.4, 0.35, 6.4), blueTrim);
    roof.position.y = 3.9;
    school.add(roof);

    // School Name Banner
    const banner = new THREE.Mesh(new THREE.BoxGeometry(5.5, 0.7, 0.1), new THREE.MeshStandardMaterial({ color: 0x1e3a8a }));
    banner.position.set(0, 3.2, -3.05);
    school.add(banner);

    // Children's Playground Swing Set
    const swingFrame = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.5, 8), new THREE.MeshStandardMaterial({ color: 0xd97706 }));
    swingFrame.position.set(3.2, 1.25, -4.2);
    school.add(swingFrame);

    this.scene.add(school);
    this.addCollider(x, z, 9.5, 6.5);
    this.interactiveSpots.school = new THREE.Vector3(x, 0, z - 3.5);
  }

  // Gandhi Maidan & Public Election Rally Ground
  createGandhiMaidan(x, z) {
    const maidan = new THREE.Group();
    maidan.position.set(x, 0, z);

    // Lush green park lawn
    const parkGeo = new THREE.PlaneGeometry(36, 24);
    parkGeo.rotateX(-Math.PI / 2);
    const park = new THREE.Mesh(parkGeo, new THREE.MeshStandardMaterial({ color: 0x3f6212, roughness: 0.9 }));
    park.position.y = 0.03;
    maidan.add(park);

    // Public Rally Raised Stage / Podium (जनसभा मंच)
    const stageMat = new THREE.MeshStandardMaterial({ color: 0x7c2d12, roughness: 0.7 });
    const stage = new THREE.Mesh(new THREE.BoxGeometry(7.0, 1.0, 4.5), stageMat);
    stage.position.set(0, 0.5, -4.0);
    stage.castShadow = true;
    maidan.add(stage);

    // Stage Backdrop Banner ("सत्यमेव जयते • जन जागृति मंच")
    const backdrop = new THREE.Mesh(new THREE.BoxGeometry(6.6, 2.6, 0.1), new THREE.MeshStandardMaterial({ color: 0xffedd5 }));
    backdrop.position.set(0, 2.2, -6.1);
    maidan.add(backdrop);

    // Speech Dais / Podium with Microphones (भाषण मंच)
    const podium = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.1, 0.6), new THREE.MeshStandardMaterial({ color: 0x1e293b }));
    podium.position.set(0, 1.45, -2.8);
    maidan.add(podium);

    // Microphone
    const mic = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.4, 8), new THREE.MeshStandardMaterial({ color: 0x94a3b8 }));
    mic.position.set(0, 2.1, -2.7);
    maidan.add(mic);

    // Loudspeaker horns on poles (भोपू / लाउडस्पीकर)
    [-3.2, 3.2].forEach((px) => {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 4.2, 8), new THREE.MeshStandardMaterial({ color: 0x475569 }));
      pole.position.set(px, 2.1, -2.0);
      maidan.add(pole);

      const horn = new THREE.Mesh(new THREE.ConeGeometry(0.25, 0.5, 8), new THREE.MeshStandardMaterial({ color: 0xd97706 }));
      horn.rotation.x = Math.PI / 2;
      horn.position.set(px, 3.9, -1.8);
      maidan.add(horn);
    });

    this.scene.add(maidan);
    this.addCollider(x, z - 4.0, 7.5, 4.8);
    this.interactiveSpots.rally = new THREE.Vector3(x, 0, z - 1.8);
  }

  // Police Outpost / Chowki
  createPoliceChowki(x, z) {
    const chowki = new THREE.Group();
    chowki.position.set(x, 0, z);

    const wallMat = new THREE.MeshStandardMaterial({ color: 0x3b82f6, roughness: 0.6 }); // Police Blue

    const base = new THREE.Mesh(new THREE.BoxGeometry(4.5, 3.2, 4.0), wallMat);
    base.position.y = 1.6;
    base.castShadow = true;
    chowki.add(base);

    // Yellow and black police road barricade
    const bar = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.9, 0.2), new THREE.MeshStandardMaterial({ color: 0xfacc15 }));
    bar.position.set(0, 0.45, -2.8);
    chowki.add(bar);

    this.scene.add(chowki);
    this.addCollider(x, z, 4.8, 4.2);
    this.interactiveSpots.police = new THREE.Vector3(x, 0, z - 2.5);
  }

  // Bus Stop Shelter
  createBusStop(x, z) {
    const stop = new THREE.Group();
    stop.position.set(x, 0, z);

    const metalMat = new THREE.MeshStandardMaterial({ color: 0x0284c7 });
    const roof = new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.1, 2.2), metalMat);
    roof.position.set(0, 2.5, 0);
    stop.add(roof);

    // Support legs
    [-1.6, 1.6].forEach((px) => {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.5, 8), metalMat);
      leg.position.set(px, 1.25, 0.8);
      stop.add(leg);
    });

    // Seating bench
    const bench = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.45, 0.4), new THREE.MeshStandardMaterial({ color: 0x78716c }));
    bench.position.set(0, 0.22, 0.4);
    stop.add(bench);

    this.scene.add(stop);
    this.interactiveSpots.busstop = new THREE.Vector3(x, 0, z);
  }

  // Street Furniture, Streetlights & Auto-Rickshaws
  createStreetFurnitureAndVehicles() {
    // 1. Streetlight Poles (Light up at night)
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x4b5563, metalness: 0.6 });
    const lightPositions = [
      new THREE.Vector3(-4.8, 0, -20),
      new THREE.Vector3(4.8, 0, -10),
      new THREE.Vector3(-4.8, 0, 10),
      new THREE.Vector3(4.8, 0, 25)
    ];

    lightPositions.forEach((pos) => {
      const poleGroup = new THREE.Group();
      poleGroup.position.copy(pos);

      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 5.2, 8), poleMat);
      pole.position.y = 2.6;
      pole.castShadow = true;
      poleGroup.add(pole);

      const lampArm = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.2, 8), poleMat);
      lampArm.rotation.z = Math.PI / 3;
      lampArm.position.set(0.45, 5.1, 0);
      poleGroup.add(lampArm);

      const lampHead = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 8), new THREE.MeshBasicMaterial({ color: 0xfef08a }));
      lampHead.position.set(0.9, 5.2, 0);
      poleGroup.add(lampHead);

      const pLight = new THREE.PointLight(0xfef08a, 0.0, 16); // Off during day
      pLight.position.set(0.9, 5.0, 0);
      poleGroup.add(pLight);

      this.scene.add(poleGroup);
      this.streetLights.push(pLight);
    });

    // 2. Swachh Bharat Dustbins (Green & Blue)
    this.createDustbin(5.2, 6, 0x15803d); // Green (Wet)
    this.createDustbin(5.8, 6, 0x1d4ed8); // Blue (Dry)

    // 3. Iconic Yellow-Green Auto-Rickshaws
    this.createAutoRickshaw(4.2, 14, 0);
    this.createAutoRickshaw(-4.2, -18, Math.PI);
  }

  createDustbin(x, z, color) {
    const bin = new THREE.Mesh(
      new THREE.CylinderGeometry(0.22, 0.18, 0.65, 10),
      new THREE.MeshStandardMaterial({ color, roughness: 0.6 })
    );
    bin.position.set(x, 0.32, z);
    bin.castShadow = true;
    this.scene.add(bin);
  }

  // Low-poly Indian Auto-Rickshaw
  createAutoRickshaw(x, z, rotY) {
    const rickshaw = new THREE.Group();
    rickshaw.position.set(x, 0, z);
    rickshaw.rotation.y = rotY;

    const yellowMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.4 }); // Yellow top
    const greenMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.5 }); // Green lower body
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.9 });

    // Lower green chassis
    const chassis = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.7, 2.4), greenMat);
    chassis.position.y = 0.55;
    chassis.castShadow = true;
    rickshaw.add(chassis);

    // Yellow curved canvas roof
    const roof = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.7, 2.0), yellowMat);
    roof.position.set(0, 1.2, -0.15);
    roof.castShadow = true;
    rickshaw.add(roof);

    // Windshield
    const windshield = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.6, 0.05), new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.1 }));
    windshield.position.set(0, 1.15, 0.9);
    rickshaw.add(windshield);

    // 3 Wheels (1 front, 2 rear)
    const frontWheel = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.14, 10), wheelMat);
    frontWheel.rotation.z = Math.PI / 2;
    frontWheel.position.set(0, 0.25, 1.0);
    rickshaw.add(frontWheel);

    [-0.65, 0.65].forEach((wx) => {
      const rearWheel = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.14, 10), wheelMat);
      rearWheel.rotation.z = Math.PI / 2;
      rearWheel.position.set(wx, 0.25, -0.7);
      rickshaw.add(rearWheel);
    });

    this.scene.add(rickshaw);
    this.addCollider(x, z, 1.8, 2.8);
  }

  // Indian Neem / Banyan Trees with seating chabutra
  createTreesAndParks() {
    const treePositions = [
      new THREE.Vector3(-10, 0, 12),
      new THREE.Vector3(12, 0, -6),
      new THREE.Vector3(-12, 0, -22),
      new THREE.Vector3(10, 0, 22),
      new THREE.Vector3(-8, 0, -38),
      new THREE.Vector3(8, 0, -38)
    ];

    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x543d2b, roughness: 0.9 });
    const leafMat = new THREE.MeshStandardMaterial({ color: 0x166534, roughness: 0.8, flatShading: true });
    const stoneChabutraMat = new THREE.MeshStandardMaterial({ color: 0xe5e7eb, roughness: 0.8 });

    treePositions.forEach((pos, idx) => {
      const tree = new THREE.Group();
      tree.position.copy(pos);

      // Sitting stone platform (चबूतरा) around trunk
      const chabutra = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.8, 0.45, 12), stoneChabutraMat);
      chabutra.position.y = 0.22;
      chabutra.receiveShadow = true;
      tree.add(chabutra);

      // Main trunk
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.5, 3.8, 8), trunkMat);
      trunk.position.y = 1.9;
      trunk.castShadow = true;
      tree.add(trunk);

      // Dense Indian foliage canopy
      const foliage1 = new THREE.Mesh(new THREE.DodecahedronGeometry(2.4, 1), leafMat);
      foliage1.position.y = 4.2;
      foliage1.castShadow = true;
      tree.add(foliage1);

      const foliage2 = new THREE.Mesh(new THREE.DodecahedronGeometry(1.8, 1), leafMat);
      foliage2.position.set(0.6, 5.2, 0.4);
      foliage2.castShadow = true;
      tree.add(foliage2);

      this.scene.add(tree);
      this.addCollider(pos.x, pos.z, 2.8, 2.8);
    });
  }

  // Update dynamic elements (Day / Night lighting cycle based on GameState clock)
  update(delta, totalTime, gameState = null) {
    if (!gameState) return;

    const hour = gameState.time.hour + gameState.time.minute / 60;

    // Day/Night Sun elevation and lighting
    // Sun rises ~6am, peaks at 12pm, sets ~7pm
    let sunFactor = 0;
    if (hour >= 6 && hour <= 18) {
      sunFactor = Math.sin(((hour - 6) / 12) * Math.PI);
    }

    if (sunFactor > 0.1) {
      // Daytime
      this.sunLight.intensity = 0.5 + sunFactor * 0.9;
      this.hemiLight.intensity = 0.4 + sunFactor * 0.45;
      this.skyMat.color.setHex(0x87ceeb);
      this.scene.fog.color.setHex(0xd6e4f0);

      // Turn streetlights off
      this.streetLights.forEach((light) => {
        light.intensity = 0;
      });
    } else {
      // Nighttime
      this.sunLight.intensity = 0.1;
      this.hemiLight.intensity = 0.25;
      this.skyMat.color.setHex(0x0a1128); // Midnight blue
      this.scene.fog.color.setHex(0x0f172a);

      // Turn streetlights on!
      this.streetLights.forEach((light) => {
        light.intensity = 2.4;
      });
    }
  }
}
