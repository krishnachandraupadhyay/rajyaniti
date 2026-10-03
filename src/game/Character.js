import * as THREE from 'three';

export class Character {
  constructor(scene, audioSystem) {
    this.scene = scene;
    this.audio = audioSystem;

    // Movement & Physics properties
    this.position = new THREE.Vector3(0, 0, 20); // Starts outside their home
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.rotation = 0;
    this.targetRotation = 0;
    this.isGrounded = true;
    this.speed = 6.8;
    this.jumpForce = 8.5;
    this.gravity = 24.0;
    this.stepTimer = 0;

    // Customization Profile (Indian Citizen to Leader)
    this.profile = {
      name: "आर्यन शर्मा (Aaryan)",
      gender: "male", // male, female
      skinColor: "#e0ac69", // Warm Indian wheatish complexion
      hairColor: "#1a1a1a",
      hairStyle: "short",
      attireType: "kurta", // kurta, formal, casual, saree
      kurtaColor: "#ffffff", // Khadi pure white
      jacketColor: "#d97706", // Saffron / Khadi Ochre Nehru Jacket
      hasJacket: true,
      hasScarf: false, // Tiranga sash or party scarf
      age: 25,
      background: "activist"
    };

    // Animation & Gesture State
    this.animTime = 0;
    this.isMoving = false;
    this.isNamaste = false;
    this.namasteProgress = 0;

    // Build the 3D Rig
    this.group = new THREE.Group();
    this.buildIndianCharacterMesh();
    this.scene.add(this.group);

    // Apply initial profile
    this.applyProfile(this.profile);
  }

  buildIndianCharacterMesh() {
    // 1. Organic Human Materials
    this.matSkin = new THREE.MeshStandardMaterial({
      color: 0xe0ac69,
      roughness: 0.65,
      metalness: 0.05
    });

    this.matHair = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      roughness: 0.45,
      metalness: 0.1
    });

    this.matEyesWhite = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 });
    this.matEyeIris = new THREE.MeshStandardMaterial({ color: 0x3e2723, roughness: 0.2 }); // Deep Indian brown eyes
    this.matPupil = new THREE.MeshBasicMaterial({ color: 0x050810 });
    this.matLips = new THREE.MeshStandardMaterial({ color: 0xb5655a, roughness: 0.5 });

    // Clothing Materials
    this.matKurta = new THREE.MeshStandardMaterial({
      color: 0xffffff, // Khadi White
      roughness: 0.8
    });

    this.matJacket = new THREE.MeshStandardMaterial({
      color: 0xd97706, // Nehru Jacket
      roughness: 0.7
    });

    this.matPajama = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.85
    });

    this.matFootwear = new THREE.MeshStandardMaterial({
      color: 0x543d2b, // Leather Kolhapuri / Oxford Shoes
      roughness: 0.6
    });

    this.matGold = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.8, roughness: 0.25 });

    // Root offset container
    this.bodyRoot = new THREE.Group();
    this.bodyRoot.position.y = 0.95;
    this.group.add(this.bodyRoot);

    // ==========================================
    // 2. HUMAN TORSO (Chest, Nehru Jacket, Kurta)
    // ==========================================
    this.torsoGroup = new THREE.Group();
    this.bodyRoot.add(this.torsoGroup);

    // Kurta Chest
    const chestGeo = new THREE.CylinderGeometry(0.26, 0.24, 0.44, 16);
    this.chestMesh = new THREE.Mesh(chestGeo, this.matKurta);
    this.chestMesh.position.y = 0.18;
    this.chestMesh.scale.set(1.15, 1.0, 0.82);
    this.chestMesh.castShadow = true;
    this.torsoGroup.add(this.chestMesh);

    // Nehru Collar (Mandarin collar)
    const collarGeo = new THREE.CylinderGeometry(0.12, 0.125, 0.08, 14);
    this.collarMesh = new THREE.Mesh(collarGeo, this.matJacket);
    this.collarMesh.position.set(0, 0.42, 0.01);
    this.torsoGroup.add(this.collarMesh);

    // Nehru Jacket Overlay (Sadri)
    const jacketGeo = new THREE.CylinderGeometry(0.27, 0.25, 0.46, 16);
    this.jacketMesh = new THREE.Mesh(jacketGeo, this.matJacket);
    this.jacketMesh.position.y = 0.18;
    this.jacketMesh.scale.set(1.18, 1.0, 0.86);
    this.jacketMesh.castShadow = true;
    this.torsoGroup.add(this.jacketMesh);

    // Jacket Front Buttons
    for (let i = 0; i < 4; i++) {
      const btn = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.02, 8), this.matGold);
      btn.rotation.x = Math.PI / 2;
      btn.position.set(0, 0.32 - i * 0.09, 0.22);
      this.torsoGroup.add(btn);
    }

    // Lower Kurta Flaps (falling over trousers)
    const kurtaSkirtGeo = new THREE.CylinderGeometry(0.25, 0.29, 0.36, 16);
    this.kurtaSkirt = new THREE.Mesh(kurtaSkirtGeo, this.matKurta);
    this.kurtaSkirt.position.y = -0.22;
    this.kurtaSkirt.scale.set(1.12, 1.0, 0.82);
    this.kurtaSkirt.castShadow = true;
    this.torsoGroup.add(this.kurtaSkirt);

    // ==========================================
    // 3. HUMAN HEAD & DETAILED FACIAL ANATOMY
    // ==========================================
    this.headGroup = new THREE.Group();
    this.headGroup.position.set(0, 0.54, 0);
    this.torsoGroup.add(this.headGroup);

    // Neck
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, 0.15, 12), this.matSkin);
    neck.position.y = -0.06;
    this.headGroup.add(neck);

    // Head Cranium
    const headGeo = new THREE.SphereGeometry(0.21, 18, 16);
    headGeo.scale(0.92, 1.06, 0.95);
    this.headMesh = new THREE.Mesh(headGeo, this.matSkin);
    this.headMesh.position.y = 0.11;
    this.headMesh.castShadow = true;
    this.headGroup.add(this.headMesh);

    // Chin / Jaw
    const jaw = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.18, 10), this.matSkin);
    jaw.rotation.x = Math.PI;
    jaw.position.set(0, 0.01, 0.03);
    this.headGroup.add(jaw);

    // Nose
    const nose = new THREE.Mesh(new THREE.ConeGeometry(0.036, 0.08, 6), this.matSkin);
    nose.rotation.x = Math.PI / 2 + 0.2;
    nose.position.set(0, 0.1, 0.21);
    this.headGroup.add(nose);

    // Lips
    const lips = new THREE.Mesh(new THREE.BoxGeometry(0.085, 0.022, 0.02), this.matLips);
    lips.position.set(0, 0.02, 0.19);
    this.headGroup.add(lips);

    // Ears
    const earGeo = new THREE.SphereGeometry(0.04, 8, 8);
    earGeo.scale(0.4, 1.2, 0.7);
    const leftEar = new THREE.Mesh(earGeo, this.matSkin);
    leftEar.position.set(-0.2, 0.1, 0);
    const rightEar = new THREE.Mesh(earGeo, this.matSkin);
    rightEar.position.set(0.2, 0.1, 0);
    this.headGroup.add(leftEar, rightEar);

    // Eyes
    this.buildEyes();

    // Eyebrows
    const browGeo = new THREE.BoxGeometry(0.075, 0.022, 0.03);
    this.leftBrow = new THREE.Mesh(browGeo, this.matHair);
    this.leftBrow.position.set(-0.075, 0.175, 0.19);
    this.rightBrow = new THREE.Mesh(browGeo, this.matHair);
    this.rightBrow.position.set(0.075, 0.175, 0.19);
    this.headGroup.add(this.leftBrow, this.rightBrow);

    // Hair Container
    this.hairContainer = new THREE.Group();
    this.headGroup.add(this.hairContainer);

    // Mustache / Beard (Maturing with age)
    this.beardContainer = new THREE.Group();
    this.headGroup.add(this.beardContainer);
    this.buildFacialHair();

    // ==========================================
    // 4. ARMS & ACCESSORIES (Citizen File / Diary)
    // ==========================================
    this.buildArms();

    // ==========================================
    // 5. LEGS (Pajama / Trousers & Formal Shoes)
    // ==========================================
    this.buildLegs();

    // Shadow blob
    const shadowGeo = new THREE.CircleGeometry(0.46, 16);
    const shadowMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.35 });
    this.shadowBlob = new THREE.Mesh(shadowGeo, shadowMat);
    this.shadowBlob.rotation.x = -Math.PI / 2;
    this.shadowBlob.position.y = -0.93;
    this.bodyRoot.add(this.shadowBlob);
  }

  buildEyes() {
    const eyeScleraGeo = new THREE.SphereGeometry(0.036, 10, 8);
    eyeScleraGeo.scale(1.0, 0.75, 0.4);
    const eyeIrisGeo = new THREE.CircleGeometry(0.02, 10);
    const eyePupilGeo = new THREE.CircleGeometry(0.01, 10);

    [-0.075, 0.075].forEach((sideX) => {
      const eye = new THREE.Group();
      eye.position.set(sideX, 0.12, 0.185);
      const sclera = new THREE.Mesh(eyeScleraGeo, this.matEyesWhite);
      const iris = new THREE.Mesh(eyeIrisGeo, this.matEyeIris);
      iris.position.set(0, 0, 0.016);
      const pupil = new THREE.Mesh(eyePupilGeo, this.matPupil);
      pupil.position.set(0, 0, 0.017);
      eye.add(sclera, iris, pupil);
      this.headGroup.add(eye);
    });
  }

  buildFacialHair() {
    // Trimmed Indian mustache
    const stacheGeo = new THREE.TorusGeometry(0.055, 0.018, 6, 10, Math.PI);
    this.mustache = new THREE.Mesh(stacheGeo, this.matHair);
    this.mustache.position.set(0, 0.045, 0.19);
    this.mustache.rotation.x = Math.PI;
    this.beardContainer.add(this.mustache);

    // Stubble / Beard for older ages
    const beardGeo = new THREE.CylinderGeometry(0.16, 0.09, 0.22, 10);
    this.beardMesh = new THREE.Mesh(beardGeo, this.matHair);
    this.beardMesh.position.set(0, -0.05, 0.07);
    this.beardContainer.add(this.beardMesh);
  }

  buildArms() {
    const shoulderGeo = new THREE.SphereGeometry(0.095, 8, 8);
    const bicepGeo = new THREE.CylinderGeometry(0.07, 0.062, 0.28, 10);
    const forearmGeo = new THREE.CylinderGeometry(0.062, 0.052, 0.26, 10);
    const handGeo = new THREE.SphereGeometry(0.054, 8, 8);
    handGeo.scale(0.85, 1.2, 0.6);

    // Left Arm
    this.leftArm = new THREE.Group();
    this.leftArm.position.set(-0.3, 0.28, 0);
    this.torsoGroup.add(this.leftArm);

    const leftShoulder = new THREE.Mesh(shoulderGeo, this.matKurta);
    this.leftArm.add(leftShoulder);
    const leftBicep = new THREE.Mesh(bicepGeo, this.matKurta);
    leftBicep.position.y = -0.15;
    leftBicep.castShadow = true;
    this.leftArm.add(leftBicep);

    this.leftForearm = new THREE.Group();
    this.leftForearm.position.y = -0.28;
    this.leftArm.add(this.leftForearm);

    const leftForearmMesh = new THREE.Mesh(forearmGeo, this.matKurta);
    leftForearmMesh.position.y = -0.12;
    this.leftForearm.add(leftForearmMesh);

    this.leftHand = new THREE.Mesh(handGeo, this.matSkin);
    this.leftHand.position.set(0, -0.26, 0.02);
    this.leftForearm.add(this.leftHand);

    // Citizen Official Petition Dossier / File in left hand
    const fileGeo = new THREE.BoxGeometry(0.24, 0.32, 0.04);
    const fileMat = new THREE.MeshStandardMaterial({ color: 0x93c5fd, roughness: 0.6 }); // Official blue folder
    const dossier = new THREE.Mesh(fileGeo, fileMat);
    dossier.position.set(0.08, -0.26, 0.08);
    dossier.rotation.set(0.2, 0.1, 0.4);
    this.leftForearm.add(dossier);

    // Right Arm
    this.rightArm = new THREE.Group();
    this.rightArm.position.set(0.3, 0.28, 0);
    this.torsoGroup.add(this.rightArm);

    const rightShoulder = new THREE.Mesh(shoulderGeo, this.matKurta);
    this.rightArm.add(rightShoulder);
    const rightBicep = new THREE.Mesh(bicepGeo, this.matKurta);
    rightBicep.position.y = -0.15;
    rightBicep.castShadow = true;
    this.rightArm.add(rightBicep);

    this.rightForearm = new THREE.Group();
    this.rightForearm.position.y = -0.28;
    this.rightArm.add(this.rightForearm);

    const rightForearmMesh = new THREE.Mesh(forearmGeo, this.matKurta);
    rightForearmMesh.position.y = -0.12;
    this.rightForearm.add(rightForearmMesh);

    this.rightHand = new THREE.Mesh(handGeo, this.matSkin);
    this.rightHand.position.set(0, -0.26, 0.02);
    this.rightForearm.add(this.rightHand);
  }

  buildLegs() {
    const thighGeo = new THREE.CylinderGeometry(0.095, 0.078, 0.38, 10);
    const calfGeo = new THREE.CylinderGeometry(0.078, 0.068, 0.34, 10);

    // Left Leg
    this.leftLeg = new THREE.Group();
    this.leftLeg.position.set(-0.14, -0.38, 0);
    this.torsoGroup.add(this.leftLeg);

    const leftThigh = new THREE.Mesh(thighGeo, this.matPajama);
    leftThigh.position.y = -0.18;
    leftThigh.castShadow = true;
    this.leftLeg.add(leftThigh);

    this.leftCalfGroup = new THREE.Group();
    this.leftCalfGroup.position.y = -0.36;
    this.leftLeg.add(this.leftCalfGroup);

    const leftCalf = new THREE.Mesh(calfGeo, this.matPajama);
    leftCalf.position.y = -0.15;
    this.leftCalfGroup.add(leftCalf);

    this.buildShoe(this.leftCalfGroup);

    // Right Leg
    this.rightLeg = new THREE.Group();
    this.rightLeg.position.set(0.14, -0.38, 0);
    this.torsoGroup.add(this.rightLeg);

    const rightThigh = new THREE.Mesh(thighGeo, this.matPajama);
    rightThigh.position.y = -0.18;
    rightThigh.castShadow = true;
    this.rightLeg.add(rightThigh);

    this.rightCalfGroup = new THREE.Group();
    this.rightCalfGroup.position.y = -0.36;
    this.rightLeg.add(this.rightCalfGroup);

    const rightCalf = new THREE.Mesh(calfGeo, this.matPajama);
    rightCalf.position.y = -0.15;
    this.rightCalfGroup.add(rightCalf);

    this.buildShoe(this.rightCalfGroup);
  }

  buildShoe(parent) {
    const shoe = new THREE.Mesh(
      new THREE.BoxGeometry(0.13, 0.1, 0.24),
      this.matFootwear
    );
    shoe.position.set(0, -0.34, 0.04);
    shoe.castShadow = true;
    parent.add(shoe);
  }

  // Update Hairstyle
  updateHairGeometry(style) {
    while (this.hairContainer.children.length > 0) {
      this.hairContainer.remove(this.hairContainer.children[0]);
    }

    // Classic groomed side-part Indian hair
    const scalp = new THREE.Mesh(
      new THREE.SphereGeometry(0.23, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.55),
      this.matHair
    );
    scalp.position.y = 0.13;
    this.hairContainer.add(scalp);

    if (style === 'short') {
      const fringe = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.08, 0.05), this.matHair);
      fringe.position.set(0, 0.22, 0.18);
      fringe.rotation.x = 0.2;
      this.hairContainer.add(fringe);
    } else if (style === 'spiky') {
      for (let i = -2; i <= 2; i++) {
        const spike = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.16, 5), this.matHair);
        spike.position.set(i * 0.05, 0.32, 0.02);
        spike.rotation.z = -i * 0.2;
        this.hairContainer.add(spike);
      }
    } else if (style === 'long') {
      const backLock = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.04, 0.45, 8), this.matHair);
      backLock.position.set(0, 0.05, -0.2);
      backLock.rotation.x = -0.3;
      this.hairContainer.add(backLock);
    }
  }

  applyProfile(data) {
    if (!data) return;
    this.profile = { ...this.profile, ...data };

    if (this.profile.skinColor) this.matSkin.color.set(this.profile.skinColor);
    if (this.profile.hairColor) {
      this.matHair.color.set(this.profile.hairColor);
      this.leftBrow.material.color.set(this.profile.hairColor);
      this.rightBrow.material.color.set(this.profile.hairColor);
    }
    if (this.profile.kurtaColor) this.matKurta.color.set(this.profile.kurtaColor);
    if (this.profile.jacketColor) this.matJacket.color.set(this.profile.jacketColor);

    this.updateHairGeometry(this.profile.hairStyle || 'short');

    // Toggle Nehru Jacket
    this.jacketMesh.visible = this.profile.hasJacket !== false;
    this.collarMesh.visible = this.profile.hasJacket !== false;

    // Age Maturation
    const age = parseInt(this.profile.age) || 25;
    this.mustache.visible = age >= 22;
    this.beardMesh.visible = age >= 42;

    if (age >= 50) {
      const grey = new THREE.Color(0xd1d5db);
      this.matHair.color.lerp(grey, 0.6);
      this.leftBrow.material.color.lerp(grey, 0.6);
      this.rightBrow.material.color.lerp(grey, 0.6);
    }
  }

  // Namaste Gesture (हाथ जोड़कर जनसंबोधन)
  doNamaste() {
    if (this.isNamaste) return;
    this.isNamaste = true;
    this.namasteProgress = 0;
  }

  jump() {
    if (this.isGrounded) {
      this.velocity.y = this.jumpForce;
      this.isGrounded = false;
      this.audio.playJump();
    }
  }

  // Update physics and character animations with world collision
  update(delta, inputDir, cameraAngle, world = null) {
    const safeDelta = Math.min(delta, 0.1);
    this.animTime += safeDelta;

    if (this.isNamaste) {
      this.namasteProgress += safeDelta * 2.5;
      if (this.namasteProgress >= 1.0) {
        this.isNamaste = false;
        this.namasteProgress = 0;
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

      // Footstep sound
      if (this.isGrounded) {
        this.stepTimer += safeDelta;
        if (this.stepTimer > 0.35) {
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

    // Proposed new position
    const nextX = this.position.x + this.velocity.x * safeDelta;
    const nextZ = this.position.z + this.velocity.z * safeDelta;

    // Boundary check (-55 to 55)
    const clampedX = Math.max(-52, Math.min(52, nextX));
    const clampedZ = Math.max(-52, Math.min(52, nextZ));

    // Collision check with Town buildings
    if (!world || !world.checkCollision({ x: clampedX, z: clampedZ })) {
      this.position.x = clampedX;
      this.position.z = clampedZ;
    }

    // Gravity
    this.velocity.y -= this.gravity * safeDelta;
    this.position.y += this.velocity.y * safeDelta;

    if (this.position.y <= 0) {
      this.position.y = 0;
      this.velocity.y = 0;
      this.isGrounded = true;
    }

    this.group.position.copy(this.position);
    this.group.rotation.y = this.rotation;

    this.animateHumanBones(safeDelta);
  }

  animateHumanBones(delta) {
    if (!this.isGrounded) {
      // Jump
      this.leftArm.rotation.x = -0.9;
      this.rightArm.rotation.x = -0.9;
      this.leftLeg.rotation.x = 0.5;
      this.leftCalfGroup.rotation.x = -0.7;
      this.rightLeg.rotation.x = 0.3;
      this.rightCalfGroup.rotation.x = -0.4;
    } else if (this.isNamaste) {
      // Respectful Namaste pose (hands joined in front of chest)
      const p = Math.sin(this.namasteProgress * Math.PI);
      this.leftArm.rotation.set(-0.8 * p, 0.4 * p, 0.5 * p);
      this.leftForearm.rotation.set(-0.9 * p, 0, 0);
      this.rightArm.rotation.set(-0.8 * p, -0.4 * p, -0.5 * p);
      this.rightForearm.rotation.set(-0.9 * p, 0, 0);
      this.torsoGroup.rotation.x = 0.1 * p; // slight bow
    } else if (this.isMoving) {
      // Natural Run/Walk stride
      const runCycle = this.animTime * 12;
      const swing = Math.sin(runCycle);

      this.leftLeg.rotation.x = swing * 0.68;
      this.leftCalfGroup.rotation.x = Math.max(0, -swing) * 0.85;

      this.rightLeg.rotation.x = -swing * 0.68;
      this.rightCalfGroup.rotation.x = Math.max(0, swing) * 0.85;

      this.leftArm.rotation.x = -swing * 0.55;
      this.rightArm.rotation.x = swing * 0.55;

      this.bodyRoot.position.y = 0.95 + Math.abs(Math.sin(runCycle)) * 0.06;
      this.torsoGroup.rotation.x = 0.08;
    } else {
      // Idle Breathing
      const breath = Math.sin(this.animTime * 2.0);
      this.bodyRoot.position.y = 0.95 + breath * 0.012;
      this.torsoGroup.rotation.x = 0;
      this.leftLeg.rotation.x = 0;
      this.leftCalfGroup.rotation.x = 0;
      this.rightLeg.rotation.x = 0;
      this.rightCalfGroup.rotation.x = 0;
      this.leftArm.rotation.x = breath * 0.03;
      this.rightArm.rotation.x = -breath * 0.03;
    }
  }
}
