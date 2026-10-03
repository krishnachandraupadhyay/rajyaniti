import * as THREE from 'three';

export class Character {
  constructor(scene, audioSystem) {
    this.scene = scene;
    this.audio = audioSystem;

    // Movement & Physics properties
    this.position = new THREE.Vector3(0, 0.5, 8);
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.rotation = 0;
    this.targetRotation = 0;
    this.isGrounded = true;
    this.speed = 7.5;
    this.jumpForce = 9.0;
    this.gravity = 24.0;
    this.stepTimer = 0;

    // Customization Profile (Human Warrior)
    this.profile = {
      name: "आर्यन (Aaryan)",
      gender: "male", // male, female
      skinColor: "#ffdfba",
      hairColor: "#1a1a1a",
      hairStyle: "short",
      eyeColor: "#1e3a8a",
      outfitColor: "#1e3a8a",
      hasCape: true,
      capeColor: "#b91c1c",
      age: 24,
      archetype: "nomad", // nomad, scholar, knight, hermit
      crystals: 0
    };

    // Animation state
    this.animTime = 0;
    this.isMoving = false;

    // Build the Human 3D Rig
    this.group = new THREE.Group();
    this.buildHumanCharacterMesh();
    this.scene.add(this.group);

    // Apply initial profile
    this.applyProfile(this.profile);
  }

  buildHumanCharacterMesh() {
    // 1. Organic Human Materials
    this.matSkin = new THREE.MeshStandardMaterial({
      color: 0xffdfba,
      roughness: 0.65,
      metalness: 0.05
    });

    this.matHair = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      roughness: 0.45,
      metalness: 0.1
    });

    this.matEyesWhite = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.2
    });

    this.matEyeIris = new THREE.MeshStandardMaterial({
      color: 0x2563eb,
      roughness: 0.2
    });

    this.matPupil = new THREE.MeshBasicMaterial({
      color: 0x050810
    });

    this.matLips = new THREE.MeshStandardMaterial({
      color: 0xcc7a6f,
      roughness: 0.5
    });

    this.matOutfit = new THREE.MeshStandardMaterial({
      color: 0x1e3a8a,
      roughness: 0.7,
      metalness: 0.15
    });

    this.matLeather = new THREE.MeshStandardMaterial({
      color: 0x451a03,
      roughness: 0.6,
      metalness: 0.1
    });

    this.matPants = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.85
    });

    this.matBoots = new THREE.MeshStandardMaterial({
      color: 0x1f2937,
      roughness: 0.5
    });

    this.matCape = new THREE.MeshStandardMaterial({
      color: 0xb91c1c,
      roughness: 0.6,
      side: THREE.DoubleSide
    });

    this.matGold = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      metalness: 0.85,
      roughness: 0.25
    });

    this.matAura = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.22,
      wireframe: true
    });

    // Root offset container
    this.bodyRoot = new THREE.Group();
    this.bodyRoot.position.y = 0.95;
    this.group.add(this.bodyRoot);

    // ==========================================
    // 2. HUMAN TORSO (Chest, Waist, Hips)
    // ==========================================
    this.torsoGroup = new THREE.Group();
    this.bodyRoot.add(this.torsoGroup);

    // Chest (rounded human ribcage / tunic)
    const chestGeo = new THREE.CylinderGeometry(0.28, 0.23, 0.42, 16);
    this.chestMesh = new THREE.Mesh(chestGeo, this.matOutfit);
    this.chestMesh.position.y = 0.18;
    this.chestMesh.scale.set(1.15, 1.0, 0.82); // Natural human torso width vs depth
    this.chestMesh.castShadow = true;
    this.torsoGroup.add(this.chestMesh);

    // Human Neckline / Shirt collar
    const collarGeo = new THREE.TorusGeometry(0.13, 0.035, 8, 16);
    const collarMesh = new THREE.Mesh(collarGeo, this.matLeather);
    collarMesh.rotation.x = Math.PI / 2;
    collarMesh.position.set(0, 0.38, 0.02);
    this.torsoGroup.add(collarMesh);

    // Waist / Midsection
    const waistGeo = new THREE.CylinderGeometry(0.23, 0.24, 0.26, 16);
    this.waistMesh = new THREE.Mesh(waistGeo, this.matOutfit);
    this.waistMesh.position.y = -0.12;
    this.waistMesh.scale.set(1.05, 1.0, 0.78);
    this.waistMesh.castShadow = true;
    this.torsoGroup.add(this.waistMesh);

    // Leather Belt & Gold Buckle
    const beltGeo = new THREE.CylinderGeometry(0.255, 0.255, 0.09, 16);
    const beltMesh = new THREE.Mesh(beltGeo, this.matLeather);
    beltMesh.position.y = -0.22;
    beltMesh.scale.set(1.08, 1.0, 0.82);
    this.torsoGroup.add(beltMesh);

    const buckleGeo = new THREE.BoxGeometry(0.12, 0.1, 0.05);
    const buckleMesh = new THREE.Mesh(buckleGeo, this.matGold);
    buckleMesh.position.set(0, -0.22, 0.22);
    this.torsoGroup.add(buckleMesh);

    // Pouch on hip
    const pouchGeo = new THREE.BoxGeometry(0.1, 0.12, 0.08);
    const pouchMesh = new THREE.Mesh(pouchGeo, this.matLeather);
    pouchMesh.position.set(0.26, -0.22, 0.06);
    pouchMesh.rotation.z = -0.15;
    this.torsoGroup.add(pouchMesh);

    // Pelvis / Hips
    const pelvisGeo = new THREE.CylinderGeometry(0.24, 0.22, 0.18, 16);
    this.pelvisMesh = new THREE.Mesh(pelvisGeo, this.matPants);
    this.pelvisMesh.position.y = -0.32;
    this.pelvisMesh.scale.set(1.06, 1.0, 0.8);
    this.torsoGroup.add(this.pelvisMesh);

    // ==========================================
    // 3. HUMAN HEAD & DETAILED FACIAL ANATOMY
    // ==========================================
    this.headGroup = new THREE.Group();
    this.headGroup.position.set(0, 0.52, 0);
    this.torsoGroup.add(this.headGroup);

    // Neck (cylinder)
    const neckGeo = new THREE.CylinderGeometry(0.1, 0.12, 0.16, 12);
    const neckMesh = new THREE.Mesh(neckGeo, this.matSkin);
    neckMesh.position.y = -0.06;
    this.headGroup.add(neckMesh);

    // Cranium / Head (Smooth rounded capsule shape)
    const craniumGeo = new THREE.SphereGeometry(0.22, 20, 16);
    craniumGeo.scale(0.92, 1.08, 0.96);
    this.craniumMesh = new THREE.Mesh(craniumGeo, this.matSkin);
    this.craniumMesh.position.y = 0.12;
    this.craniumMesh.castShadow = true;
    this.headGroup.add(this.craniumMesh);

    // Tapered Human Jaw & Chin
    const jawGeo = new THREE.ConeGeometry(0.16, 0.2, 12);
    const jawMesh = new THREE.Mesh(jawGeo, this.matSkin);
    jawMesh.rotation.x = Math.PI;
    jawMesh.position.set(0, 0.01, 0.04);
    jawMesh.scale.set(0.9, 0.8, 0.9);
    this.headGroup.add(jawMesh);

    // Human Nose (Bridge and tip)
    const noseGeo = new THREE.ConeGeometry(0.038, 0.09, 6);
    const noseMesh = new THREE.Mesh(noseGeo, this.matSkin);
    noseMesh.rotation.x = Math.PI / 2 + 0.2;
    noseMesh.position.set(0, 0.1, 0.22);
    this.headGroup.add(noseMesh);

    // Human Lips / Mouth
    const lipsGeo = new THREE.BoxGeometry(0.09, 0.024, 0.02);
    const lipsMesh = new THREE.Mesh(lipsGeo, this.matLips);
    lipsMesh.position.set(0, 0.02, 0.2);
    this.headGroup.add(lipsMesh);

    // Human Ears (Left & Right curved lobes)
    const earGeo = new THREE.SphereGeometry(0.045, 8, 8);
    earGeo.scale(0.4, 1.2, 0.7);

    const leftEar = new THREE.Mesh(earGeo, this.matSkin);
    leftEar.position.set(-0.21, 0.11, -0.01);
    leftEar.rotation.y = -0.2;
    this.headGroup.add(leftEar);

    const rightEar = new THREE.Mesh(earGeo, this.matSkin);
    rightEar.position.set(0.21, 0.11, -0.01);
    rightEar.rotation.y = 0.2;
    this.headGroup.add(rightEar);

    // Detailed Human Eyes (Sclera + Iris + Pupil + Catchlight)
    this.buildHumanEyes();

    // Human Eyebrows
    const browGeo = new THREE.BoxGeometry(0.075, 0.022, 0.03);
    this.leftBrow = new THREE.Mesh(browGeo, this.matHair);
    this.leftBrow.position.set(-0.075, 0.18, 0.195);
    this.leftBrow.rotation.z = -0.08;
    this.headGroup.add(this.leftBrow);

    this.rightBrow = new THREE.Mesh(browGeo, this.matHair);
    this.rightBrow.position.set(0.075, 0.18, 0.195);
    this.rightBrow.rotation.z = 0.08;
    this.headGroup.add(this.rightBrow);

    // Hair Container
    this.hairContainer = new THREE.Group();
    this.headGroup.add(this.hairContainer);

    // Beard Container (for older age / adult male)
    this.beardContainer = new THREE.Group();
    this.headGroup.add(this.beardContainer);
    this.buildBeardMesh();

    // ==========================================
    // 4. HUMAN ARMS (Shoulder, Bicep, Forearm, Hand)
    // ==========================================
    this.buildHumanArms();

    // ==========================================
    // 5. HUMAN LEGS (Thighs, Knees, Calves, Boots)
    // ==========================================
    this.buildHumanLegs();

    // ==========================================
    // 6. CLOAK / CAPE (Human Adventurer Cape)
    // ==========================================
    this.capeGroup = new THREE.Group();
    this.capeGroup.position.set(0, 0.36, -0.15);
    this.torsoGroup.add(this.capeGroup);

    // Adventurer shoulder clasps
    const claspL = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.04, 8), this.matGold);
    claspL.position.set(-0.16, 0.02, 0.08);
    this.capeGroup.add(claspL);

    const claspR = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.04, 8), this.matGold);
    claspR.position.set(0.16, 0.02, 0.08);
    this.capeGroup.add(claspR);

    // Flowing Cape Fabric
    const capeGeo = new THREE.PlaneGeometry(0.54, 0.95, 4, 6);
    this.capeMesh = new THREE.Mesh(capeGeo, this.matCape);
    this.capeMesh.position.set(0, -0.48, -0.02);
    this.capeMesh.rotation.y = Math.PI;
    this.capeMesh.castShadow = true;
    this.capeGroup.add(this.capeMesh);

    // ==========================================
    // 7. AURA & SHADOW
    // ==========================================
    const auraGeo = new THREE.SphereGeometry(1.25, 16, 12);
    this.auraMesh = new THREE.Mesh(auraGeo, this.matAura);
    this.auraMesh.position.y = 0.2;
    this.auraMesh.visible = false;
    this.bodyRoot.add(this.auraMesh);

    const shadowGeo = new THREE.CircleGeometry(0.48, 16);
    const shadowMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.35 });
    this.shadowBlob = new THREE.Mesh(shadowGeo, shadowMat);
    this.shadowBlob.rotation.x = -Math.PI / 2;
    this.shadowBlob.position.y = -0.92;
    this.bodyRoot.add(this.shadowBlob);
  }

  buildHumanEyes() {
    const eyeScleraGeo = new THREE.SphereGeometry(0.038, 12, 10);
    eyeScleraGeo.scale(1.0, 0.75, 0.4);

    const irisGeo = new THREE.CircleGeometry(0.022, 12);
    const pupilGeo = new THREE.CircleGeometry(0.012, 12);

    // Left Eye Group
    const leftEye = new THREE.Group();
    leftEye.position.set(-0.075, 0.12, 0.19);
    const leftSclera = new THREE.Mesh(eyeScleraGeo, this.matEyesWhite);
    const leftIris = new THREE.Mesh(irisGeo, this.matEyeIris);
    leftIris.position.set(0, 0, 0.016);
    const leftPupil = new THREE.Mesh(pupilGeo, this.matPupil);
    leftPupil.position.set(0, 0, 0.017);
    leftEye.add(leftSclera, leftIris, leftPupil);
    this.headGroup.add(leftEye);

    // Right Eye Group
    const rightEye = new THREE.Group();
    rightEye.position.set(0.075, 0.12, 0.19);
    const rightSclera = new THREE.Mesh(eyeScleraGeo, this.matEyesWhite);
    const rightIris = new THREE.Mesh(irisGeo, this.matEyeIris);
    rightIris.position.set(0, 0, 0.016);
    const rightPupil = new THREE.Mesh(pupilGeo, this.matPupil);
    rightPupil.position.set(0, 0, 0.017);
    rightEye.add(rightSclera, rightIris, rightPupil);
    this.headGroup.add(rightEye);
  }

  buildBeardMesh() {
    // Sculpted human beard around chin and jaw
    const beardGeo = new THREE.CylinderGeometry(0.18, 0.12, 0.22, 12);
    this.beardMesh = new THREE.Mesh(beardGeo, this.matHair);
    this.beardMesh.position.set(0, -0.06, 0.06);
    this.beardMesh.scale.set(0.9, 0.9, 1.1);

    // Mustache
    const mustacheGeo = new THREE.TorusGeometry(0.06, 0.02, 6, 12, Math.PI);
    const mustache = new THREE.Mesh(mustacheGeo, this.matHair);
    mustache.position.set(0, 0.04, 0.19);
    mustache.rotation.x = Math.PI;

    this.beardContainer.add(this.beardMesh, mustache);
  }

  buildHumanArms() {
    // Shoulder width and natural human arm taper
    const shoulderGeo = new THREE.SphereGeometry(0.1, 10, 10);
    const bicepGeo = new THREE.CylinderGeometry(0.075, 0.065, 0.28, 12);
    const forearmGeo = new THREE.CylinderGeometry(0.065, 0.055, 0.26, 12);
    const handGeo = new THREE.SphereGeometry(0.058, 10, 8);
    handGeo.scale(0.85, 1.2, 0.6); // Human palm shape

    // Left Arm Hierarchy
    this.leftArm = new THREE.Group();
    this.leftArm.position.set(-0.31, 0.28, 0);
    this.torsoGroup.add(this.leftArm);

    // Shoulder pauldron
    const leftShoulder = new THREE.Mesh(shoulderGeo, this.matOutfit);
    this.leftArm.add(leftShoulder);

    // Upper Arm
    const leftBicep = new THREE.Mesh(bicepGeo, this.matOutfit);
    leftBicep.position.y = -0.15;
    leftBicep.castShadow = true;
    this.leftArm.add(leftBicep);

    // Left Forearm joint
    this.leftForearm = new THREE.Group();
    this.leftForearm.position.y = -0.28;
    this.leftArm.add(this.leftForearm);

    const leftForearmMesh = new THREE.Mesh(forearmGeo, this.matLeather); // Bracer
    leftForearmMesh.position.y = -0.12;
    leftForearmMesh.castShadow = true;
    this.leftForearm.add(leftForearmMesh);

    // Left Human Hand & Thumb
    this.leftHand = new THREE.Mesh(handGeo, this.matSkin);
    this.leftHand.position.set(0, -0.28, 0.02);
    this.leftForearm.add(this.leftHand);

    const thumbGeo = new THREE.CylinderGeometry(0.016, 0.014, 0.05, 6);
    const leftThumb = new THREE.Mesh(thumbGeo, this.matSkin);
    leftThumb.position.set(0.04, -0.26, 0.04);
    leftThumb.rotation.z = -0.5;
    this.leftForearm.add(leftThumb);

    // Right Arm Hierarchy
    this.rightArm = new THREE.Group();
    this.rightArm.position.set(0.31, 0.28, 0);
    this.torsoGroup.add(this.rightArm);

    const rightShoulder = new THREE.Mesh(shoulderGeo, this.matOutfit);
    this.rightArm.add(rightShoulder);

    const rightBicep = new THREE.Mesh(bicepGeo, this.matOutfit);
    rightBicep.position.y = -0.15;
    rightBicep.castShadow = true;
    this.rightArm.add(rightBicep);

    // Right Forearm joint
    this.rightForearm = new THREE.Group();
    this.rightForearm.position.y = -0.28;
    this.rightArm.add(this.rightForearm);

    const rightForearmMesh = new THREE.Mesh(forearmGeo, this.matLeather);
    rightForearmMesh.position.y = -0.12;
    rightForearmMesh.castShadow = true;
    this.rightForearm.add(rightForearmMesh);

    // Right Hand & Thumb
    this.rightHand = new THREE.Mesh(handGeo, this.matSkin);
    this.rightHand.position.set(0, -0.28, 0.02);
    this.rightForearm.add(this.rightHand);

    const rightThumb = new THREE.Mesh(thumbGeo, this.matSkin);
    rightThumb.position.set(-0.04, -0.26, 0.04);
    rightThumb.rotation.z = 0.5;
    this.rightForearm.add(rightThumb);

    // ==========================================
    // 3D ADVENTURER STEEL SWORD
    // ==========================================
    this.swordGroup = new THREE.Group();
    this.swordGroup.position.set(0, -0.28, 0.08);
    this.swordGroup.rotation.x = Math.PI / 2;

    // Sword Handle
    const handleGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.18, 8);
    const handle = new THREE.Mesh(handleGeo, this.matLeather);
    this.swordGroup.add(handle);

    // Pommel (Gold sphere)
    const pommelGeo = new THREE.SphereGeometry(0.035, 8, 8);
    const pommel = new THREE.Mesh(pommelGeo, this.matGold);
    pommel.position.y = -0.1;
    this.swordGroup.add(pommel);

    // Crossguard
    const guardGeo = new THREE.BoxGeometry(0.22, 0.03, 0.05);
    const guard = new THREE.Mesh(guardGeo, this.matGold);
    guard.position.y = 0.09;
    this.swordGroup.add(guard);

    // Steel Blade
    const bladeGeo = new THREE.BoxGeometry(0.065, 0.72, 0.015);
    const matBlade = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      metalness: 0.95,
      roughness: 0.15
    });
    const blade = new THREE.Mesh(bladeGeo, matBlade);
    blade.position.y = 0.45;
    blade.castShadow = true;
    this.swordGroup.add(blade);

    // Glowing Rune Core line on blade
    const runeGeo = new THREE.BoxGeometry(0.015, 0.6, 0.018);
    const matRune = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const runeLine = new THREE.Mesh(runeGeo, matRune);
    runeLine.position.y = 0.42;
    this.swordGroup.add(runeLine);

    this.rightForearm.add(this.swordGroup);
  }

  buildHumanLegs() {
    // Anatomical thigh with taper, knee joint, calf, and adventurer boot
    const thighGeo = new THREE.CylinderGeometry(0.1, 0.08, 0.36, 12);
    const calfGeo = new THREE.CylinderGeometry(0.08, 0.07, 0.32, 12);

    // Left Leg
    this.leftLeg = new THREE.Group();
    this.leftLeg.position.set(-0.14, -0.38, 0);
    this.torsoGroup.add(this.leftLeg);

    const leftThigh = new THREE.Mesh(thighGeo, this.matPants);
    leftThigh.position.y = -0.16;
    leftThigh.castShadow = true;
    this.leftLeg.add(leftThigh);

    this.leftCalfGroup = new THREE.Group();
    this.leftCalfGroup.position.y = -0.34;
    this.leftLeg.add(this.leftCalfGroup);

    const leftCalf = new THREE.Mesh(calfGeo, this.matPants);
    leftCalf.position.y = -0.14;
    leftCalf.castShadow = true;
    this.leftCalfGroup.add(leftCalf);

    // Left Adventurer Boot (Sole + Upper + Ankle Cuff)
    this.buildBoot(this.leftCalfGroup);

    // Right Leg
    this.rightLeg = new THREE.Group();
    this.rightLeg.position.set(0.14, -0.38, 0);
    this.torsoGroup.add(this.rightLeg);

    const rightThigh = new THREE.Mesh(thighGeo, this.matPants);
    rightThigh.position.y = -0.16;
    rightThigh.castShadow = true;
    this.rightLeg.add(rightThigh);

    this.rightCalfGroup = new THREE.Group();
    this.rightCalfGroup.position.y = -0.34;
    this.rightLeg.add(this.rightCalfGroup);

    const rightCalf = new THREE.Mesh(calfGeo, this.matPants);
    rightCalf.position.y = -0.14;
    rightCalf.castShadow = true;
    this.rightCalfGroup.add(rightCalf);

    // Right Adventurer Boot
    this.buildBoot(this.rightCalfGroup);
  }

  buildBoot(parent) {
    const bootGroup = new THREE.Group();
    bootGroup.position.y = -0.28;

    // Boot shaft
    const shaftGeo = new THREE.CylinderGeometry(0.085, 0.078, 0.22, 12);
    const shaft = new THREE.Mesh(shaftGeo, this.matBoots);
    shaft.position.y = 0.06;
    bootGroup.add(shaft);

    // Boot Foot / Toe box
    const footGeo = new THREE.BoxGeometry(0.13, 0.1, 0.22);
    const foot = new THREE.Mesh(footGeo, this.matBoots);
    foot.position.set(0, -0.05, 0.05);
    foot.castShadow = true;
    bootGroup.add(foot);

    // Leather Cuff Fold
    const cuffGeo = new THREE.TorusGeometry(0.085, 0.02, 6, 12);
    const cuff = new THREE.Mesh(cuffGeo, this.matLeather);
    cuff.rotation.x = Math.PI / 2;
    cuff.position.y = 0.16;
    bootGroup.add(cuff);

    parent.add(bootGroup);
  }

  // Update Hairstyle meshes (Human flowing hair)
  updateHairGeometry(style) {
    while (this.hairContainer.children.length > 0) {
      this.hairContainer.remove(this.hairContainer.children[0]);
    }

    if (style === 'short') {
      // Classic human layered crop
      const scalpGeo = new THREE.SphereGeometry(0.24, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.55);
      scalpGeo.scale(0.96, 1.05, 0.98);
      const scalp = new THREE.Mesh(scalpGeo, this.matHair);
      scalp.position.y = 0.13;
      this.hairContainer.add(scalp);

      // Front bangs fringe
      const fringeGeo = new THREE.BoxGeometry(0.22, 0.08, 0.05);
      const fringe = new THREE.Mesh(fringeGeo, this.matHair);
      fringe.position.set(0, 0.22, 0.19);
      fringe.rotation.x = 0.25;
      this.hairContainer.add(fringe);

      // Sideburns
      const sideburnGeo = new THREE.BoxGeometry(0.035, 0.12, 0.04);
      const leftBurn = new THREE.Mesh(sideburnGeo, this.matHair);
      leftBurn.position.set(-0.21, 0.13, 0.06);
      const rightBurn = new THREE.Mesh(sideburnGeo, this.matHair);
      rightBurn.position.set(0.21, 0.13, 0.06);
      this.hairContainer.add(leftBurn, rightBurn);
    } else if (style === 'spiky') {
      // Adventurer textured spiky hair
      const scalpGeo = new THREE.SphereGeometry(0.23, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.55);
      const scalp = new THREE.Mesh(scalpGeo, this.matHair);
      scalp.position.y = 0.13;
      this.hairContainer.add(scalp);

      for (let i = -2; i <= 2; i++) {
        const spike = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.18, 5), this.matHair);
        spike.position.set(i * 0.05, 0.32, 0.02 - Math.abs(i) * 0.02);
        spike.rotation.z = -i * 0.22;
        spike.rotation.x = -0.15;
        this.hairContainer.add(spike);
      }
    } else if (style === 'long') {
      // Flowing human locks / ponytail
      const scalpGeo = new THREE.SphereGeometry(0.24, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.55);
      const scalp = new THREE.Mesh(scalpGeo, this.matHair);
      scalp.position.y = 0.13;
      this.hairContainer.add(scalp);

      // Flowing side tresses
      const strandGeo = new THREE.CylinderGeometry(0.04, 0.02, 0.38, 8);
      const leftStrand = new THREE.Mesh(strandGeo, this.matHair);
      leftStrand.position.set(-0.21, 0.02, 0.04);
      leftStrand.rotation.z = -0.1;
      const rightStrand = new THREE.Mesh(strandGeo, this.matHair);
      rightStrand.position.set(0.21, 0.02, 0.04);
      rightStrand.rotation.z = 0.1;

      // Back mane / ponytail
      const maneGeo = new THREE.ConeGeometry(0.14, 0.45, 8);
      const mane = new THREE.Mesh(maneGeo, this.matHair);
      mane.position.set(0, 0.02, -0.22);
      mane.rotation.x = -0.4;

      this.hairContainer.add(leftStrand, rightStrand, mane);
    } else if (style === 'hood') {
      // Human Adventurer Fabric Cowl / Hood
      const hoodGeo = new THREE.SphereGeometry(0.28, 16, 12);
      const hood = new THREE.Mesh(hoodGeo, this.matOutfit);
      hood.position.set(0, 0.14, -0.04);
      hood.scale.set(0.95, 1.05, 1.08);
      this.hairContainer.add(hood);
    }
  }

  // Apply customization profile
  applyProfile(data) {
    if (!data) return;
    this.profile = { ...this.profile, ...data };

    // 1. Organic Skin Tones
    if (this.profile.skinColor) this.matSkin.color.set(this.profile.skinColor);
    if (this.profile.hairColor) {
      this.matHair.color.set(this.profile.hairColor);
      this.leftBrow.material.color.set(this.profile.hairColor);
      this.rightBrow.material.color.set(this.profile.hairColor);
    }
    if (this.profile.eyeColor) this.matEyeIris.color.set(this.profile.eyeColor);
    if (this.profile.outfitColor) this.matOutfit.color.set(this.profile.outfitColor);
    if (this.profile.capeColor) this.matCape.color.set(this.profile.capeColor);

    // 2. Hairstyle
    this.updateHairGeometry(this.profile.hairStyle || 'short');

    // 3. Cape Toggle
    this.capeGroup.visible = !!this.profile.hasCape;

    // 4. Age adjustments (Human Ageing effects)
    const age = parseInt(this.profile.age) || 24;
    // Beard appears for age >= 38
    this.beardContainer.visible = age >= 38;
    if (age >= 52) {
      // Greying natural human hair
      const silver = new THREE.Color(0xd1d5db);
      this.matHair.color.lerp(silver, 0.6);
      this.leftBrow.material.color.lerp(silver, 0.6);
      this.rightBrow.material.color.lerp(silver, 0.6);
    }

    // 5. Archetype Buffs
    this.speed = 7.5;
    this.jumpForce = 9.0;
    this.auraMesh.visible = false;

    if (this.profile.archetype === 'nomad') {
      this.speed = 9.2; // +22% speed
    } else if (this.profile.archetype === 'knight') {
      this.jumpForce = 11.2; // +25% jump
    } else if (this.profile.archetype === 'scholar') {
      this.auraMesh.visible = true;
    } else if (this.profile.archetype === 'hermit') {
      this.speed = 8.0;
      this.jumpForce = 9.8;
    }
  }

  jump() {
    if (this.isGrounded) {
      this.velocity.y = this.jumpForce;
      this.isGrounded = false;
      this.audio.playJump();
    }
  }

  attack() {
    if (this.isAttacking) return;
    this.isAttacking = true;
    this.attackProgress = 0;
    this.audio.playSwordSlash();
  }

  // Update physics and organic human procedural animations
  update(delta, inputDir, cameraAngle, terrainHeightFunc) {
    const safeDelta = Math.min(delta, 0.1);
    this.animTime += safeDelta;

    if (this.isAttacking) {
      this.attackProgress += safeDelta * 3.8;
      if (this.attackProgress >= 1.0) {
        this.isAttacking = false;
        this.attackProgress = 0;
      }
    }

    const moveX = inputDir.x;
    const moveZ = inputDir.y;
    const isInputActive = Math.abs(moveX) > 0.05 || Math.abs(moveZ) > 0.05;

    if (isInputActive) {
      this.isMoving = true;
      const inputAngle = Math.atan2(moveX, moveZ);
      this.targetRotation = cameraAngle + inputAngle;

      let diff = this.targetRotation - this.rotation;
      while (diff < -Math.PI) diff += Math.PI * 2;
      while (diff > Math.PI) diff -= Math.PI * 2;
      this.rotation += diff * Math.min(safeDelta * 12, 1.0);

      const worldDirX = Math.sin(this.targetRotation);
      const worldDirZ = Math.cos(this.targetRotation);

      const currentSpeed = this.speed * Math.min(1.0, Math.hypot(moveX, moveZ));
      this.velocity.x = worldDirX * currentSpeed;
      this.velocity.z = worldDirZ * currentSpeed;

      // Footstep sound timing
      if (this.isGrounded) {
        this.stepTimer += safeDelta;
        if (this.stepTimer > 0.33) {
          this.stepTimer = 0;
          this.audio.playStep();
        }
      }
    } else {
      this.isMoving = false;
      this.velocity.x *= 0.6;
      this.velocity.z *= 0.6;
      this.stepTimer = 0;
    }

    // Horizontal velocity
    this.position.x += this.velocity.x * safeDelta;
    this.position.z += this.velocity.z * safeDelta;

    // Gravity & Ground collision
    this.velocity.y -= this.gravity * safeDelta;
    this.position.y += this.velocity.y * safeDelta;

    this.position.x = Math.max(-90, Math.min(90, this.position.x));
    this.position.z = Math.max(-90, Math.min(90, this.position.z));

    const groundY = terrainHeightFunc(this.position.x, this.position.z) + 0.95;
    if (this.position.y <= groundY) {
      this.position.y = groundY;
      this.velocity.y = 0;
      this.isGrounded = true;
    }

    this.group.position.copy(this.position);
    this.group.rotation.y = this.rotation;

    // Human Procedural Animations (Idle breathing, natural human stride, jump)
    this.animateHumanBones(safeDelta);
  }

  animateHumanBones(delta) {
    if (!this.isGrounded) {
      // Natural Human Jump Pose
      this.leftArm.rotation.x = -1.1;
      this.leftForearm.rotation.x = -0.5;
      this.rightArm.rotation.x = -1.1;
      this.rightForearm.rotation.x = -0.5;

      this.leftLeg.rotation.x = 0.55;
      this.leftCalfGroup.rotation.x = -0.8; // Knee bent
      this.rightLeg.rotation.x = 0.35;
      this.rightCalfGroup.rotation.x = -0.5;

      this.torsoGroup.rotation.x = 0.12;
      this.capeGroup.rotation.x = 0.75;
    } else if (this.isMoving) {
      // Natural Human Run / Walk Cycle
      const runCycle = this.animTime * 13;
      const swing = Math.sin(runCycle);
      const cosSwing = Math.cos(runCycle);

      // Legs with natural knee articulation
      this.leftLeg.rotation.x = swing * 0.72;
      this.leftCalfGroup.rotation.x = Math.max(0, -swing) * 0.9; // Knee bends when leg swings back

      this.rightLeg.rotation.x = -swing * 0.72;
      this.rightCalfGroup.rotation.x = Math.max(0, swing) * 0.9;

      // Arms swinging opposite to legs with natural elbow bend
      this.leftArm.rotation.x = -swing * 0.65;
      this.leftForearm.rotation.x = -0.35 - Math.abs(swing) * 0.3;

      this.rightArm.rotation.x = swing * 0.65;
      this.rightForearm.rotation.x = -0.35 - Math.abs(swing) * 0.3;

      // Spine / Torso natural sway & bounce
      this.bodyRoot.position.y = 0.95 + Math.abs(Math.sin(runCycle)) * 0.08;
      this.torsoGroup.rotation.x = 0.1;
      this.torsoGroup.rotation.y = cosSwing * 0.08; // Torso rotation
      this.headGroup.rotation.y = -cosSwing * 0.06; // Head stabilization

      // Cape billowing in wind
      this.capeGroup.rotation.x = 0.42 + Math.abs(swing) * 0.22;
    } else {
      // Natural Human Idle Breathing & Stance
      const breath = Math.sin(this.animTime * 2.2);
      this.bodyRoot.position.y = 0.95 + breath * 0.015;

      this.torsoGroup.rotation.x = 0;
      this.torsoGroup.rotation.y = 0;
      this.headGroup.rotation.y = Math.sin(this.animTime * 0.8) * 0.05; // Gentle gaze look around

      this.leftLeg.rotation.x = 0;
      this.leftCalfGroup.rotation.x = 0;
      this.rightLeg.rotation.x = 0;
      this.rightCalfGroup.rotation.x = 0;

      this.leftArm.rotation.x = breath * 0.04;
      this.leftForearm.rotation.x = -0.15;
      this.rightArm.rotation.x = -breath * 0.04;
      this.rightForearm.rotation.x = -0.15;

      this.capeGroup.rotation.x = 0.08 + breath * 0.03;
    }

    // Dynamic Sword Slash Override
    if (this.isAttacking) {
      const p = this.attackProgress;
      const slashAngle = Math.sin(p * Math.PI);
      this.rightArm.rotation.x = -1.2 + slashAngle * 1.8;
      this.rightArm.rotation.y = -slashAngle * 1.4;
      this.rightArm.rotation.z = -slashAngle * 0.6;
      this.rightForearm.rotation.x = -0.6;
      this.swordGroup.rotation.z = slashAngle * 1.5;
    } else {
      this.swordGroup.rotation.z = 0;
    }

    if (this.auraMesh.visible) {
      this.auraMesh.rotation.y += delta * 1.5;
      this.auraMesh.rotation.x += delta * 0.8;
      this.auraMesh.scale.setScalar(1.0 + Math.sin(this.animTime * 3) * 0.06);
    }
  }
}
