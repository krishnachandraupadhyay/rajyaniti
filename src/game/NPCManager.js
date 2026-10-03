import * as THREE from 'three';

export class NPCManager {
  constructor(scene, audioSystem) {
    this.scene = scene;
    this.audio = audioSystem;
    this.npcs = [];
    this.activeDialogueNpc = null;
    this.typewriterTimer = null;

    this.createNPCs();
    this.setupDialogueUI();
  }

  createNPCs() {
    // NPC 1: Elder Eldrin (Inside Village Sanctuary)
    this.addNPC({
      id: 'elder',
      name: 'एल्डर एल्ड्रिन (Elder Eldrin)',
      role: 'संरक्षक एवं प्राचीन गुरु (Venerable Guardian)',
      avatar: '🧙‍♂️',
      position: new THREE.Vector3(0, 0.4, 10),
      robeColor: 0x4f46e5, // Royal Indigo
      hairColor: 0xffffff, // White wisdom
      hasBeard: true,
      hasStaff: true,
      dialogues: {
        intro: {
          text: 'प्रणाम, वीर यात्री! हमारे इस प्राचीन पावन क्षेत्र में तुम्हारी प्रतीक्षा हो रही थी। मुझे महसूस हो रहा है कि तुम्हारे अंदर एक विशेष ऊर्जा छिपी है।',
          options: [
            { label: '✨ मुझे क्या करना होगा, गुरुजी? (My Mission)', next: 'quest_explain' },
            { label: '🏛️ इस जगह का इतिहास क्या है? (Realm Lore)', next: 'lore' }
          ]
        },
        quest_explain: {
          text: 'सामने देखो—हमारे राज्य का प्राचीन मंदिर सील हो चुका है। इसे खोलने के लिए तुम्हें चारों दिशाओं से 4 दिव्य क्रिस्टल एकत्र करने होंगे और मीनार का पावन दीया जलाना होगा!',
          options: [
            { label: '🔥 मैं तैयार हूँ! (I am ready!)', action: 'trigger_quest_1', next: 'ready' }
          ]
        },
        lore: {
          text: 'सदियों पहले, दिव्य देवताओं ने इस द्वीप को आशीर्वाद दिया था। जब तक मीनार की ज्योति जलती है और मंदिर का अवशेष सुरक्षित है, यह राज्य सुरक्षित रहेगा।',
          options: [
            { label: '⚔️ मैं इसे सुरक्षित रखूंगा! (I will protect it)', next: 'quest_explain' }
          ]
        },
        ready: {
          text: 'शाबाश! मेरा आशीर्वाद तुम्हारे साथ है। पहले चारों तत्वीय क्रिस्टल ढूंढो: जल, अग्नि, पृथ्वी और वायु। जाओ और अपना पराक्रम दिखाओ!',
          options: [
            { label: 'धन्यवाद गुरुजी! (अलविदा)', close: true }
          ]
        }
      }
    });

    // NPC 2: Kaelen the Blacksmith (Near village entrance)
    this.addNPC({
      id: 'blacksmith',
      name: 'कैलेन लोहार (Kaelen Forge)',
      role: 'शस्त्र निर्माता (Master Smith)',
      avatar: '🔨',
      position: new THREE.Vector3(8, 0.3, 5),
      robeColor: 0xb45309, // Leather Amber
      hairColor: 0x451a03,
      hasBeard: true,
      hasHammer: true,
      dialogues: {
        intro: {
          text: 'अरे दोस्त! तुम्हारी पोशाक और चाल बता रही है कि तुम किसी बड़े अभियान पर हो। रास्ते में पहाड़ों पर चढ़ने के लिए मजबूत छलांग और संतुलन की जरूरत पड़ेगी!',
          options: [
            { label: '🏔️ मीनार पर कैसे जाऊं? (Tower path)', next: 'tower_hint' },
            { label: '🔨 आप क्या बनाते हैं? (What do you forge?)', next: 'craft_hint' }
          ]
        },
        tower_hint: {
          text: 'पूर्वी पहाड़ी की तरफ एक प्राचीन सीढ़ी जाती है। वहां संभलकर चलना—ऊपर हवाएं तेज हैं। पर चोटी पर प्राचीन मीनार का भव्य नजारा देखने लायक है!',
          options: [
            { label: 'धन्यवाद कैलेन! (Got it)', close: true }
          ]
        },
        craft_hint: {
          text: 'मैं प्राचीन धातुओं से सुरक्षा कवच बनाता हूँ। अपनी यात्रा में चारों क्रिस्टल संभाल कर रखना, वे बहुत शक्तिशाली हैं!',
          options: [
            { label: 'ठीक है दोस्त! (अलविदा)', close: true }
          ]
        }
      }
    });

    // NPC 3: Aria the Scout (Near Ancient Ruins)
    this.addNPC({
      id: 'scout',
      name: 'आर्या आत्मिक शिकारी (Aria Scout)',
      role: 'खंडहरों की खोजकर्ता (Ruins Ranger)',
      avatar: '🏹',
      position: new THREE.Vector3(-24, 0.4, -20),
      robeColor: 0x047857, // Emerald Ranger
      hairColor: 0x1f2937,
      hasBeard: false,
      hasBow: true,
      dialogues: {
        intro: {
          text: 'सावधान! तुम प्राचीन खंडहरों के करीब आ पहुंचे हो। हवा में रहस्यमयी तरंगे तैर रही हैं। क्या तुम भी क्रिस्टल की तलाश में हो?',
          options: [
            { label: '💎 क्रिस्टल कहाँ मिलेंगे? (Crystal locations)', next: 'crystal_hint' },
            { label: '🏛️ ये खंडहर किसके हैं? (Ruins origins)', next: 'ruins_hint' }
          ]
        },
        crystal_hint: {
          text: 'चारों क्रिस्टल अलग-अलग दिशाओं में चमक रहे हैं: एक नीलम झील के पास, एक लाल अग्नि ज्वाला चट्टान पर, एक हरे उपवन में और एक यहीं खंडहरों के पास!',
          options: [
            { label: 'मैं अभी ढूंढता हूँ! (I will find them)', close: true }
          ]
        },
        ruins_hint: {
          text: 'यह सदियों पुरानी वेधशाला है। पूर्वजों ने यहाँ सितारों की गति का अध्ययन किया था। सतर्क रहकर आगे बढ़ो!',
          options: [
            { label: 'अलविदा आर्या! (Close)', close: true }
          ]
        }
      }
    });
  }

  addNPC(config) {
    const group = new THREE.Group();
    group.position.copy(config.position);

    // Shared Organic Human Materials
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xffdfba, roughness: 0.65 });
    const robeMat = new THREE.MeshStandardMaterial({ color: config.robeColor, roughness: 0.7 });
    const hairMat = new THREE.MeshStandardMaterial({ color: config.hairColor, roughness: 0.5 });
    const goldMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.85, roughness: 0.25 });
    const eyeWhiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 });
    const eyeIrisMat = new THREE.MeshStandardMaterial({ color: 0x1e3a8a, roughness: 0.2 });
    const pupilMat = new THREE.MeshBasicMaterial({ color: 0x0a0a0a });
    const lipsMat = new THREE.MeshStandardMaterial({ color: 0xc47368, roughness: 0.5 });
    const leatherMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.6 });

    // 1. Human Body / Robe
    const torsoGeo = new THREE.CylinderGeometry(0.26, 0.38, 1.15, 16);
    const torso = new THREE.Mesh(torsoGeo, robeMat);
    torso.position.y = 0.6;
    torso.scale.set(1.1, 1.0, 0.85);
    torso.castShadow = true;
    group.add(torso);

    // Belt sash
    const sashGeo = new THREE.CylinderGeometry(0.3, 0.32, 0.1, 16);
    const sash = new THREE.Mesh(sashGeo, leatherMat);
    sash.position.y = 0.62;
    group.add(sash);

    // 2. Human Head & Facial Anatomy
    const headGroup = new THREE.Group();
    headGroup.position.y = 1.34;
    group.add(headGroup);

    // Neck
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, 0.14, 12), skinMat);
    neck.position.y = -0.06;
    headGroup.add(neck);

    // Rounded Human Cranium
    const headGeo = new THREE.SphereGeometry(0.21, 18, 16);
    headGeo.scale(0.92, 1.06, 0.95);
    const head = new THREE.Mesh(headGeo, skinMat);
    head.position.y = 0.11;
    head.castShadow = true;
    headGroup.add(head);

    // Human Chin / Jaw
    const jaw = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.18, 10), skinMat);
    jaw.rotation.x = Math.PI;
    jaw.position.set(0, 0.01, 0.03);
    headGroup.add(jaw);

    // Human Nose
    const nose = new THREE.Mesh(new THREE.ConeGeometry(0.036, 0.08, 6), skinMat);
    nose.rotation.x = Math.PI / 2 + 0.2;
    nose.position.set(0, 0.1, 0.21);
    headGroup.add(nose);

    // Human Lips
    const lips = new THREE.Mesh(new THREE.BoxGeometry(0.085, 0.022, 0.02), lipsMat);
    lips.position.set(0, 0.02, 0.19);
    headGroup.add(lips);

    // Human Ears
    const earGeo = new THREE.SphereGeometry(0.04, 8, 8);
    earGeo.scale(0.4, 1.2, 0.7);
    const earL = new THREE.Mesh(earGeo, skinMat);
    earL.position.set(-0.2, 0.1, 0);
    const earR = new THREE.Mesh(earGeo, skinMat);
    earR.position.set(0.2, 0.1, 0);
    headGroup.add(earL, earR);

    // Detailed Human Eyes
    const eyeScleraGeo = new THREE.SphereGeometry(0.035, 10, 8);
    eyeScleraGeo.scale(1.0, 0.75, 0.4);
    const eyeIrisGeo = new THREE.CircleGeometry(0.02, 10);
    const eyePupilGeo = new THREE.CircleGeometry(0.01, 10);

    [-0.07, 0.07].forEach((sideX) => {
      const eye = new THREE.Group();
      eye.position.set(sideX, 0.12, 0.18);
      const sclera = new THREE.Mesh(eyeScleraGeo, eyeWhiteMat);
      const iris = new THREE.Mesh(eyeIrisGeo, eyeIrisMat);
      iris.position.set(0, 0, 0.016);
      const pupil = new THREE.Mesh(eyePupilGeo, pupilMat);
      pupil.position.set(0, 0, 0.017);
      eye.add(sclera, iris, pupil);
      headGroup.add(eye);
    });

    // Human Eyebrows
    const browGeo = new THREE.BoxGeometry(0.07, 0.02, 0.03);
    const leftBrow = new THREE.Mesh(browGeo, hairMat);
    leftBrow.position.set(-0.07, 0.17, 0.185);
    const rightBrow = new THREE.Mesh(browGeo, hairMat);
    rightBrow.position.set(0.07, 0.17, 0.185);
    headGroup.add(leftBrow, rightBrow);

    // Hair / Beard
    if (config.hasBeard) {
      const beardGeo = new THREE.CylinderGeometry(0.17, 0.08, 0.28, 12);
      const beard = new THREE.Mesh(beardGeo, hairMat);
      beard.position.set(0, -0.06, 0.08);
      headGroup.add(beard);
    }

    const hairScalp = new THREE.Mesh(new THREE.SphereGeometry(0.23, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.6), hairMat);
    hairScalp.position.y = 0.12;
    headGroup.add(hairScalp);

    // 3. Human Arms & Hands
    const armGeo = new THREE.CylinderGeometry(0.07, 0.06, 0.45, 10);
    const handGeo = new THREE.SphereGeometry(0.05, 8, 8);
    handGeo.scale(0.8, 1.2, 0.6);

    // Left Arm
    const leftArm = new THREE.Mesh(armGeo, robeMat);
    leftArm.position.set(-0.34, 0.72, 0);
    leftArm.rotation.z = 0.15;
    group.add(leftArm);

    const leftHand = new THREE.Mesh(handGeo, skinMat);
    leftHand.position.set(-0.38, 0.44, 0.05);
    group.add(leftHand);

    // Right Arm
    const rightArm = new THREE.Mesh(armGeo, robeMat);
    rightArm.position.set(0.34, 0.72, 0);
    rightArm.rotation.z = -0.15;
    group.add(rightArm);

    const rightHand = new THREE.Mesh(handGeo, skinMat);
    rightHand.position.set(0.38, 0.44, 0.05);
    group.add(rightHand);

    // Accessory Props
    if (config.hasStaff) {
      // Magic Staff for Elder
      const staffGeo = new THREE.CylinderGeometry(0.04, 0.04, 2.2, 8);
      const staff = new THREE.Mesh(staffGeo, goldMat);
      staff.position.set(0.45, 0.9, 0.2);
      staff.castShadow = true;
      group.add(staff);

      const orbGeo = new THREE.SphereGeometry(0.15, 12, 12);
      const orbMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
      const orb = new THREE.Mesh(orbGeo, orbMat);
      orb.position.set(0.45, 2.0, 0.2);
      group.add(orb);
    } else if (config.hasHammer) {
      // Blacksmith Hammer
      const hammerHandle = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.8, 8), hairMat);
      hammerHandle.position.set(0.42, 0.5, 0.2);
      group.add(hammerHandle);

      const hammerHead = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.14, 0.28), goldMat);
      hammerHead.position.set(0.42, 0.85, 0.2);
      group.add(hammerHead);
    }

    // Floating Interaction Name/Bubble Indicator in 3D
    const iconGeo = new THREE.PlaneGeometry(0.6, 0.6);
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#38bdf8';
    ctx.font = '40px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('💬', 32, 32);

    const texture = new THREE.CanvasTexture(canvas);
    const iconMat = new THREE.MeshBasicMaterial({ map: texture, transparent: true, side: THREE.DoubleSide });
    const iconMesh = new THREE.Mesh(iconGeo, iconMat);
    iconMesh.position.y = 2.0;
    group.add(iconMesh);

    this.scene.add(group);

    this.npcs.push({
      id: config.id,
      name: config.name,
      role: config.role,
      avatar: config.avatar,
      dialogues: config.dialogues,
      group,
      iconMesh,
      pos: config.position
    });
  }

  // Check which NPC or object is closest to player
  checkInteractionTarget(playerPos) {
    const interactRadius = 3.6;
    for (const npc of this.npcs) {
      const dist = playerPos.distanceTo(npc.pos);
      if (dist <= interactRadius) {
        return {
          type: 'npc',
          target: npc,
          actionText: 'बात करें (Talk)',
          name: npc.name
        };
      }
    }
    return null;
  }

  setupDialogueUI() {
    this.modal = document.getElementById('dialogue-modal');
    this.closeBtn = document.getElementById('dialogue-close-btn');
    this.speakerNameEl = document.getElementById('dialogue-speaker-name');
    this.speakerRoleEl = document.getElementById('dialogue-speaker-role');
    this.avatarEl = document.getElementById('dialogue-npc-avatar');
    this.contentEl = document.getElementById('dialogue-text-content');
    this.optionsContainer = document.getElementById('dialogue-options-container');

    if (this.closeBtn) {
      this.closeBtn.addEventListener('click', () => this.closeDialogue());
    }
  }

  startDialogue(npc, questManager, startKey = 'intro') {
    this.activeDialogueNpc = npc;
    this.currentQuestManager = questManager;

    this.speakerNameEl.textContent = npc.name;
    this.speakerRoleEl.textContent = npc.role;
    this.avatarEl.textContent = npc.avatar;

    this.modal.classList.remove('hidden');
    this.showNode(npc.dialogues[startKey]);
  }

  showNode(node) {
    if (!node) return;

    // Clear previous text animation
    if (this.typewriterTimer) clearInterval(this.typewriterTimer);

    // Typewriter effect with procedural sound blips
    const text = node.text;
    this.contentEl.textContent = '';
    let charIndex = 0;

    this.typewriterTimer = setInterval(() => {
      if (charIndex < text.length) {
        this.contentEl.textContent += text[charIndex];
        if (charIndex % 3 === 0) {
          this.audio.playBlip();
        }
        charIndex++;
      } else {
        clearInterval(this.typewriterTimer);
        this.typewriterTimer = null;
      }
    }, 22);

    // Populate Choices
    this.optionsContainer.innerHTML = '';
    if (node.options && node.options.length > 0) {
      node.options.forEach((opt) => {
        const btn = document.createElement('button');
        btn.className = 'dialogue-choice-btn';
        btn.innerHTML = `<span>➜</span> <span>${opt.label}</span>`;
        btn.addEventListener('click', () => {
          if (opt.action === 'trigger_quest_1' && this.currentQuestManager) {
            this.currentQuestManager.completeQuest(1);
          }
          if (opt.close) {
            this.closeDialogue();
          } else if (opt.next && this.activeDialogueNpc.dialogues[opt.next]) {
            this.showNode(this.activeDialogueNpc.dialogues[opt.next]);
          }
        });
        this.optionsContainer.appendChild(btn);
      });
    }
  }

  closeDialogue() {
    if (this.typewriterTimer) clearInterval(this.typewriterTimer);
    this.modal.classList.add('hidden');
    this.activeDialogueNpc = null;
  }

  update(delta, totalTime, camera) {
    // Make NPC speech icons face camera and gently float
    this.npcs.forEach((npc) => {
      npc.iconMesh.quaternion.copy(camera.quaternion);
      npc.iconMesh.position.y = 2.0 + Math.sin(totalTime * 3 + npc.pos.x) * 0.1;
    });
  }
}
