import * as THREE from 'three';

export class NPCManager {
  constructor(scene, audioSystem, gameState) {
    this.scene = scene;
    this.audio = audioSystem;
    this.gameState = gameState;
    this.npcs = [];
    this.activeDialogueNpc = null;
    this.typewriterTimer = null;

    this.createIndianCitizens();
    this.setupDialogueUI();
  }

  createIndianCitizens() {
    // 1. Ramesh Chaiwala (At Chai Tapri)
    this.addNPC({
      id: 'ramesh_chai',
      name: 'रमेश चायवाला (Ramesh Tea Stall)',
      role: 'चाय विक्रेता व मोहल्ले का केंद्र (Community Hub)',
      avatar: '☕',
      position: new THREE.Vector3(14, 0, 6.8),
      robeColor: 0xd97706, // Ochre Kurta
      hasBeard: false,
      hasMustache: true,
      dialogues: {
        intro: {
          text: 'अरे भैया, राम-राम! आज सुबह की ताज़ा अदरक वाली कड़क चाय तैयार है। क्या चल रहा है अपने आनंदनगर मोहल्ले में?',
          options: [
            { label: '☕ एक स्पेशल कड़क चाय दीजिए (-₹15, +30 ऊर्जा)', action: 'buy_tea', next: 'tea_served' },
            { label: '🗣️ मोहल्ले में लोग किस बात से परेशान हैं?', next: 'local_gossip' },
            { label: '🗳️ वर्तमान पार्षद तिवारी जी का क्या हाल है?', next: 'councillor_talk' }
          ]
        },
        tea_served: {
          text: 'ये लीजिए गरमा-गरम चाय! पीकर एकदम ताजगी आ जाएगी। मोहल्ले के लोगों की सेवा में आपकी मेहनत दिख रही है भाई!',
          options: [
            { label: 'धन्यवाद रमेश भाई! (अलविदा)', close: true }
          ]
        },
        local_gossip: {
          text: 'अरे पूछिए मत! मुख्य सड़क पर जो बड़ा गड्ढा है, उसमें कल एक ऑटो पलटते-पलटते बचा। गंदा पानी भरा है और बदबू फैल रही है। कोई सुनने वाला नहीं!',
          options: [
            { label: '📝 मैं नगर निगम में इसकी जन-शिकायत दर्ज कराऊंगा!', action: 'hint_quest1', next: 'activist_praise' }
          ]
        },
        councillor_talk: {
          text: 'तिवारी जी तो बस चुनाव के समय हाथ जोड़कर आते हैं, फिर 5 साल नगर निगम के दफ्तर में बैठकर मलाई काटते हैं। अगर कोई आप जैसा पढ़ा-लिखा युवा आगे आए, तो हम सब साथ देंगे!',
          options: [
            { label: 'मैं पूरी कोशिश करूंगा रमेश भाई! (Close)', close: true }
          ]
        },
        activist_praise: {
          text: 'शाबाश! सड़क के पास सुनीता देवी और बाकी दुकानदार खड़े हैं, उनके हस्ताक्षर ले लीजिए। नगर निगम दफ्तर जाकर बाबू को अर्जी दीजिए!',
          options: [
            { label: 'मैं अभी जाता हूँ! (Close)', close: true }
          ]
        }
      }
    });

    // 2. Sunita Devi (Resident near Potholed Road)
    this.addNPC({
      id: 'sunita_devi',
      name: 'सुनीता देवी (Sunita Devi)',
      role: 'वार्ड 7 निवासी व मतदाता (Ward Resident)',
      avatar: '👩‍🦰',
      position: new THREE.Vector3(-3.2, 0, 5.2),
      robeColor: 0xb91c1c, // Crimson Saree
      hasBeard: false,
      hasMustache: false,
      dialogues: {
        intro: {
          text: 'बेटा, देखो इस सड़क की क्या दुर्दशा हो गई है! हल्की बारिश में ही घरों के आगे कीचड़ और पानी भर जाता है। बच्चे स्कूल तक नहीं जा पा रहे।',
          options: [
            { label: '✍️ आप हस्ताक्षर कीजिए, मैं नगर निगम में शिकायत दूंगा!', action: 'sign_petition', next: 'signed' },
            { label: 'क्या पार्षद जी ने कभी इस पर ध्यान दिया?', next: 'complaint_history' }
          ]
        },
        signed: {
          text: 'बिल्कुल बेटा! मेरा और पूरे मोहल्ले की औरतों का हस्ताक्षर लो। भगवान करे तुम हमारे वार्ड के नेता बनो, कम से कम काम तो कराओगे!',
          options: [
            { label: 'धन्यवाद माता जी, अब काम होकर रहेगा! (Close)', close: true }
          ]
        },
        complaint_history: {
          text: 'हमने तीन बार पार्षद तिवारी जी को बोला, वो कहते हैं "अभी फंड नहीं आया है"। 2 साल से यही बहाना चल रहा है!',
          options: [
            { label: 'अब जनता अपना अधिकार खुद लेगी! (Close)', close: true }
          ]
        }
      }
    });

    // 3. Masterji Sharma (At Primary School)
    this.addNPC({
      id: 'masterji',
      name: 'शर्मा जी (Masterji Sharma)',
      role: 'प्राथमिक विद्यालय वरिष्ठ शिक्षक (School Headmaster)',
      avatar: '📚',
      position: new THREE.Vector3(-16, 0, 16),
      robeColor: 0x1e3a8a, // Navy Kurta
      hasBeard: false,
      hasMustache: true,
      dialogues: {
        intro: {
          text: 'नमस्कार! क्या आप जानते हैं कि किसी भी देश या समाज की नींव उसके प्राथमिक विद्यालयों में रखी जाती है? पर हमारे इस स्कूल की छत टपकती है और बच्चों के पास पर्याप्त किताबें नहीं हैं।',
          options: [
            { label: '📖 मैं स्कूल के लिए शिक्षा सहायता अभियान चलाऊंगा!', action: 'school_support', next: 'school_pleased' },
            { label: '🏛️ क्या शिक्षा विभाग से मदद नहीं मिलती?', next: 'school_funds' }
          ]
        },
        school_pleased: {
          text: 'वाह! यही एक सच्चे जनसेवक की पहचान है। अगर युवाओं में शिक्षा के प्रति ऐसी निष्ठा हो, तो हमारा भारत सचमुच विश्वगुरु बन सकता है!',
          options: [
            { label: 'मैं सदैव आपके साथ हूँ मास्टर जी! (Close)', close: true }
          ]
        },
        school_funds: {
          text: 'सरकारी कागज़ों में सब पास हो जाता है, पर नीचे ज़मीन पर आते-आते सब भ्रष्टाचार की भेंट चढ़ जाता है। हमें ईमानदार नेतृत्व की जरूरत है।',
          options: [
            { label: 'हम मिलकर बदलाव लाएंगे। (Close)', close: true }
          ]
        }
      }
    });

    // 4. Dr. Priya Mehta (At Primary Health Center)
    this.addNPC({
      id: 'dr_priya',
      name: 'डॉ. प्रिया मेहता (Dr. Priya Mehta)',
      role: 'पीएचसी प्रभारी चिकित्सक (Medical Officer)',
      avatar: '🩺',
      position: new THREE.Vector3(16, 0, -18),
      robeColor: 0x059669, // Medical Green Coat
      hasBeard: false,
      hasMustache: false,
      dialogues: {
        intro: {
          text: 'नमस्ते! मैं बहुत चिंतित हूँ। सड़क पर जो गंदा पानी जमा है, उससे डेंगू और मलेरिया के मच्छर पनप रहे हैं। अगर जल्द ही स्वच्छता अभियान नहीं चलाया गया, तो महामारी फैल सकती है!',
          options: [
            { label: '🧹 हम मिलकर स्वच्छ मोहल्ला व स्वास्थ्य शिविर लगाएंगे!', action: 'health_camp', next: 'camp_agreed' },
            { label: '🏥 अस्पताल में दवाइयों की क्या स्थिति है?', next: 'medicine_status' }
          ]
        },
        camp_agreed: {
          text: 'यह बहुत सराहनीय कदम होगा! आप स्वयंसेवकों को इकट्ठा कीजिए, मैं नि:शुल्क स्वास्थ्य परीक्षण और ओआरएस/दवाइयों का वितरण संभालूंगी।',
          options: [
            { label: 'शानदार, चलिए शुरू करते हैं! (Close)', close: true }
          ]
        },
        medicine_status: {
          text: 'आवश्यक दवाइयों का स्टॉक कम है। स्थानीय प्रशासन से कई बार मांग की गई, पर बजट स्वास्थ्य की जगह विज्ञापनों में खर्च हो जाता है।',
          options: [
            { label: 'हम प्रशासन से इसका हिसाब मांगेंगे! (Close)', close: true }
          ]
        }
      }
    });

    // 5. Councilor Suresh Tiwari (Near Nagar Nigam Office)
    this.addNPC({
      id: 'councillor_tiwari',
      name: 'सुरेश तिवारी (Councilor Tiwari)',
      role: 'वर्तमान वार्ड पार्षद (Incumbent Politician)',
      avatar: '🗳️',
      position: new THREE.Vector3(-16, 0, -8),
      robeColor: 0x475569, // Grey Kurta & Heavy Scarf
      hasBeard: true,
      hasMustache: true,
      dialogues: {
        intro: {
          text: 'अरे भाई, तुम कौन हो? सुना है मोहल्ले में लोगों को भड़का रहे हो और सड़क को लेकर अर्जी दे रहे हो? राजनीति बच्चों का खेल नहीं है!',
          options: [
            { label: '📋 जनता का काम करना राजनीति है, बहाने बनाना नहीं!', next: 'heated_reply' },
            { label: 'सड़क कब बनेगी पार्षद जी? 2 साल से गड्ढा है!', next: 'excuse' }
          ]
        },
        heated_reply: {
          text: 'अच्छा! तो तुम मुझे सिखाओगे? सामने चुनाव आ रहे हैं—अगर इतना ही दम है तो पर्चा भरकर मैदान में आकर दिखाओ। जनता तय करेगी कौन काम करता है!',
          options: [
            { label: '⚔️ चुनाव मैदान में ही फैसला होगा तिवारी जी! (Close)', close: true }
          ]
        },
        excuse: {
          text: 'फाइल ऊपर गई हुई है। टेंडर पास होने में समय लगता है। तुम जैसे नए लड़के सरकारी काम की पेचीदगियां क्या समझोगे!',
          options: [
            { label: 'जनता अब और इंतज़ार नहीं करेगी! (Close)', close: true }
          ]
        }
      }
    });

    // 6. Inspector Vikram Singh (At Police Chowki)
    this.addNPC({
      id: 'inspector_singh',
      name: 'इंस्पेक्टर विक्रम सिंह (Inspector Singh)',
      role: 'थाना चौकी प्रभारी (Police In-charge)',
      avatar: '👮‍♂️',
      position: new THREE.Vector3(-12, 0, 4),
      robeColor: 0x9a3412, // Khaki Police Uniform
      hasBeard: false,
      hasMustache: true,
      dialogues: {
        intro: {
          text: 'जय हिन्द! कानून और व्यवस्था बनाए रखना पुलिस का पहला फर्ज है। अगर गांधी मैदान में कोई जनसभा या रैली करनी है, तो पहले शांतिपूर्वक अनुमति लेना जरूरी है।',
          options: [
            { label: '👮‍♂️ हम शांतिपूर्ण लोकतंत्र और नियमों का सम्मान करते हैं।', next: 'police_respect' },
            { label: 'गली में स्ट्रीटलाइट न होने से रात में असुरक्षा रहती है।', next: 'lighting_issue' }
          ]
        },
        police_respect: {
          text: 'बहुत खूब। आपके जैसे जागरूक नागरिक समाज में हों, तो अपराध अपने आप घट जाता है। शांति बनाए रखें!',
          options: [
            { label: 'जय हिन्द सर! (Close)', close: true }
          ]
        },
        lighting_issue: {
          text: 'हां, यह समस्या सही है। नगर निगम अगर स्ट्रीटलाइट की मरम्मत करा दे, तो रात की गश्त और सुरक्षित हो जाएगी।',
          options: [
            { label: 'हम नगर निगम में यह प्रस्ताव पास कराएंगे। (Close)', close: true }
          ]
        }
      }
    });
  }

  addNPC(config) {
    const group = new THREE.Group();
    group.position.copy(config.position);

    // Shared Materials
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xe0ac69, roughness: 0.65 });
    const clothesMat = new THREE.MeshStandardMaterial({ color: config.robeColor, roughness: 0.7 });
    const hairMat = new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.5 });
    const whiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 });
    const eyeIrisMat = new THREE.MeshStandardMaterial({ color: 0x3e2723 });
    const pupilMat = new THREE.MeshBasicMaterial({ color: 0x0a0a0a });
    const lipsMat = new THREE.MeshStandardMaterial({ color: 0xb5655a });

    // 1. Human Body / Torso
    const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.24, 0.7, 12), clothesMat);
    torso.position.y = 0.9;
    torso.scale.set(1.1, 1.0, 0.85);
    torso.castShadow = true;
    group.add(torso);

    // Lower Kurta / Pants
    const lowerPajama = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.2, 0.8, 12), new THREE.MeshStandardMaterial({ color: 0xf1f5f9 }));
    lowerPajama.position.y = 0.4;
    group.add(lowerPajama);

    // 2. Head & Facial Anatomy
    const headGroup = new THREE.Group();
    headGroup.position.y = 1.45;
    group.add(headGroup);

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.2, 14, 12), skinMat);
    head.scale.set(0.92, 1.06, 0.95);
    head.castShadow = true;
    headGroup.add(head);

    // Nose & Lips
    const nose = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.08, 6), skinMat);
    nose.rotation.x = Math.PI / 2 + 0.2;
    nose.position.set(0, 0.01, 0.2);
    headGroup.add(nose);

    const lips = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.02, 0.02), lipsMat);
    lips.position.set(0, -0.06, 0.18);
    headGroup.add(lips);

    // Eyes
    [-0.07, 0.07].forEach((sideX) => {
      const eye = new THREE.Group();
      eye.position.set(sideX, 0.04, 0.18);
      const sclera = new THREE.Mesh(new THREE.SphereGeometry(0.032, 8, 6), whiteMat);
      sclera.scale.set(1, 0.75, 0.4);
      const iris = new THREE.Mesh(new THREE.CircleGeometry(0.018, 8), eyeIrisMat);
      iris.position.z = 0.015;
      const pupil = new THREE.Mesh(new THREE.CircleGeometry(0.009, 8), pupilMat);
      pupil.position.z = 0.016;
      eye.add(sclera, iris, pupil);
      headGroup.add(eye);
    });

    // Mustache
    if (config.hasMustache) {
      const stache = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.016, 5, 8, Math.PI), hairMat);
      stache.position.set(0, -0.03, 0.19);
      stache.rotation.x = Math.PI;
      headGroup.add(stache);
    }

    // Beard
    if (config.hasBeard) {
      const beard = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.08, 0.2, 8), hairMat);
      beard.position.set(0, -0.12, 0.08);
      headGroup.add(beard);
    }

    // Hair
    const hair = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 10, 0, Math.PI * 2, 0, Math.PI * 0.55), hairMat);
    hair.position.y = 0.04;
    headGroup.add(hair);

    // Arms
    const leftArm = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.055, 0.5, 8), clothesMat);
    leftArm.position.set(-0.32, 0.8, 0);
    leftArm.rotation.z = 0.12;
    group.add(leftArm);

    const rightArm = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.055, 0.5, 8), clothesMat);
    rightArm.position.set(0.32, 0.8, 0);
    rightArm.rotation.z = -0.12;
    group.add(rightArm);

    // Floating 3D Interaction Prompt
    const canvas = document.createElement('canvas');
    canvas.width = 64; canvas.height = 64;
    const ctx = canvas.getContext('2d');
    ctx.font = '42px sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(config.avatar, 32, 32);

    const texture = new THREE.CanvasTexture(canvas);
    const iconMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(0.65, 0.65),
      new THREE.MeshBasicMaterial({ map: texture, transparent: true, side: THREE.DoubleSide })
    );
    iconMesh.position.y = 2.1;
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

    if (this.typewriterTimer) clearInterval(this.typewriterTimer);

    const text = node.text;
    this.contentEl.textContent = '';
    let charIndex = 0;

    this.typewriterTimer = setInterval(() => {
      if (charIndex < text.length) {
        this.contentEl.textContent += text[charIndex];
        if (charIndex % 3 === 0 && this.audio) {
          this.audio.playBlip();
        }
        charIndex++;
      } else {
        clearInterval(this.typewriterTimer);
        this.typewriterTimer = null;
      }
    }, 20);

    this.optionsContainer.innerHTML = '';
    if (node.options && node.options.length > 0) {
      node.options.forEach((opt) => {
        const btn = document.createElement('button');
        btn.className = 'dialogue-choice-btn';
        btn.innerHTML = `<span>➜</span> <span>${opt.label}</span>`;
        btn.addEventListener('click', () => {
          // Process special game state actions
          if (opt.action === 'buy_tea' && this.gameState) {
            if (this.gameState.spendMoney(15)) {
              this.gameState.restoreEnergy(30);
              this.currentQuestManager.showToast('☕ ताजगी!', 'अदरक वाली कड़क चाय से ऊर्जा +30% बढ़ गई!');
            } else {
              alert('जेब में पर्याप्त पैसे नहीं हैं! (Need ₹15)');
              return;
            }
          }

          if (opt.action === 'sign_petition' && this.currentQuestManager) {
            this.currentQuestManager.onSignaturesCollected();
          }

          if (opt.action === 'health_camp' && this.currentQuestManager) {
            this.currentQuestManager.onHealthCampOrganized();
          }

          if (opt.action === 'school_support' && this.currentQuestManager) {
            this.currentQuestManager.onSchoolDonationPledged();
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
    this.npcs.forEach((npc) => {
      npc.iconMesh.quaternion.copy(camera.quaternion);
      npc.iconMesh.position.y = 2.1 + Math.sin(totalTime * 3 + npc.pos.x) * 0.08;
    });
  }
}
