import * as THREE from 'three';

export class QuestManager {
  constructor(world, audioSystem, gameState) {
    this.world = world;
    this.audio = audioSystem;
    this.gameState = gameState;

    this.signaturesCollected = false;
    this.healthCampDone = false;
    this.schoolPledged = false;

    // 4 Progressive Indian Civic & Political Missions
    this.quests = [
      {
        id: 1,
        title: '1. जन समस्या: टूटी सड़क व शिकायत (Citizen Grievance)',
        desc: 'सड़क के पास सुनीता देवी व रमेश चायवाले से बात करके जन-हस्ताक्षर लें, फिर नगर निगम कार्यालय में शिकायत दर्ज कराएं।',
        targetPos: new THREE.Vector3(-3.2, 0, 5.2), // Sunita Devi & Pothole
        targetName: 'सुनीता देवी व टूटी सड़क',
        status: 'active',
        reward: 'जनसेवक (Activist) उपाधि • +20% जनप्रियता • ₹2,000'
      },
      {
        id: 2,
        title: '2. स्वच्छ मोहल्ला व स्वास्थ्य शिविर (Health & Cleanliness Drive)',
        desc: 'प्राथमिक स्वास्थ्य केंद्र पर डॉ. प्रिया से मिलें और गंदे पानी व मच्छरों की रोकथाम के लिए दवा व स्वास्थ्य शिविर लगाएं।',
        targetPos: new THREE.Vector3(16, 0, -18), // Clinic
        targetName: 'प्राथमिक स्वास्थ्य केंद्र (डॉ. प्रिया)',
        status: 'locked',
        reward: 'पार्टी गठन की अनुमति • +25% जनप्रियता • ₹5,000'
      },
      {
        id: 3,
        title: '3. भविष्य की पाठशाला (Primary School Renovation)',
        desc: 'राजकीय प्राथमिक विद्यालय में मास्टरजी से मिलें और बच्चों की पढ़ाई के लिए डेस्क, पंखे व किताबों की व्यवस्था करें।',
        targetPos: new THREE.Vector3(-16, 0, 16), // School
        targetName: 'राजकीय प्राथमिक विद्यालय (मास्टरजी)',
        status: 'locked',
        reward: 'युवाओं का समर्थन • +30% जनप्रियता • ₹10,000'
      },
      {
        id: 4,
        title: '4. पहला चुनावी दंगल (Ward Election Campaign & Victory)',
        desc: 'गांधी मैदान के मंच पर अपनी पहली जनसभा व रैली करें, घर-घर प्रचार करें और पार्षद चुनाव जीतकर जन-प्रतिनिधि बनें!',
        targetPos: new THREE.Vector3(0, 0, -32), // Gandhi Maidan Stage
        targetName: 'गांधी मैदान जनसभा मंच',
        status: 'locked',
        reward: 'निर्वाचित वार्ड पार्षद (Councilor) • ₹1,50,000 नगर निगम बजट'
      }
    ];

    this.currentQuestId = 1;
    this.startTime = Date.now();

    this.setupUI();
    this.updateHUD();
  }

  setupUI() {
    this.hudTitle = document.getElementById('hud-quest-title');
    this.hudDist = document.getElementById('quest-distance-indicator');
    this.questModal = document.getElementById('quest-modal');
    this.questItemsList = document.getElementById('quest-items-list');

    const btnLog = document.getElementById('btn-quest-log');
    const btnTracker = document.getElementById('quest-tracker-btn');
    const btnClose = document.getElementById('quest-close-btn');

    if (btnLog) btnLog.addEventListener('click', () => this.openQuestLog());
    if (btnTracker) btnTracker.addEventListener('click', () => this.openQuestLog());
    if (btnClose) btnClose.addEventListener('click', () => this.closeQuestLog());
  }

  getCurrentQuest() {
    return this.quests.find((q) => q.id === this.currentQuestId);
  }

  completeQuest(questId) {
    const q = this.quests.find((item) => item.id === questId);
    if (!q || q.status === 'completed') return;

    q.status = 'completed';
    if (this.audio) this.audio.playQuestComplete();

    // Mission 1 completion
    if (questId === 1) {
      this.gameState.promoteCareer(2); // Promoted to Community Activist
      this.gameState.addMoney(2000);
      this.gameState.boostPopularity(20);
      this.showToast('🎉 जनसेवक का उदय!', 'नगर निगम में जन-शिकायत दर्ज! आप अब "जनसेवक" बन गए हैं। (+₹2,000, +20% जनप्रियता)');
    } else if (questId === 2) {
      this.gameState.addMoney(5000);
      this.gameState.boostPopularity(25);
      this.gameState.party.isFormed = true;
      this.showToast('🏥 स्वास्थ्य शिविर सफल!', 'स्वच्छता व स्वास्थ्य अभियान पूर्ण! पार्टी गठन की अनुमति मिली। (+₹5,000, +25% जनप्रियता)');
    } else if (questId === 3) {
      this.gameState.party.partyFunds += 10000;
      this.gameState.boostPopularity(30);
      this.showToast('📚 शिक्षा संकल्प पूर्ण!', 'स्कूल में पुस्तकें व डेस्क वितरित! भारी जनसमर्थन मिला। (+₹10,000 पार्टी फंड, +30% जनप्रियता)');
    } else if (questId === 4) {
      this.gameState.promoteCareer(3); // Ward Councilor
      this.showToast('🏆 ऐतिहासिक चुनावी विजय!', 'आप आनंदनगर वार्ड 7 के निर्वाचित पार्षद बन चुके हैं!');
    }

    // Advance to next quest
    if (questId < this.quests.length) {
      this.currentQuestId = questId + 1;
      const nextQ = this.quests.find((item) => item.id === this.currentQuestId);
      if (nextQ) nextQ.status = 'active';
    }

    this.updateHUD();
  }

  // Hook for Mission 1 signature event
  onSignaturesCollected() {
    this.signaturesCollected = true;
    this.showToast('✍️ हस्ताक्षर प्राप्त!', 'सुनीता देवी व मोहल्लेवासियों के हस्ताक्षर मिल गए। अब नगर निगम दफ्तर जाएं!');
    const q1 = this.quests.find((q) => q.id === 1);
    if (q1) {
      q1.targetPos = new THREE.Vector3(-18, 0, -12); // Nagar Nigam Office
      q1.targetName = 'नगर निगम कार्यालय (शिकायत पेटी)';
    }
    this.updateHUD();
  }

  // Hook for Mission 2 health camp
  onHealthCampOrganized() {
    this.healthCampDone = true;
    if (this.currentQuestId === 2) {
      this.completeQuest(2);
    }
  }

  // Hook for Mission 3 school support
  onSchoolDonationPledged() {
    this.schoolPledged = true;
    if (this.currentQuestId === 3) {
      this.completeQuest(3);
    }
  }

  // Check world interaction targets (e.g. Nagar Nigam Complaint Drop, Gandhi Maidan Stage)
  checkWorldObjectives(playerPos) {
    // Mission 1: Submit Petition at Nagar Nigam Drop Box
    if (this.currentQuestId === 1 && this.signaturesCollected) {
      const dist = playerPos.distanceTo(new THREE.Vector3(-18, 0, -12));
      if (dist < 4.2) {
        return {
          type: 'petition_submit',
          actionText: 'शिकायत दर्ज करें (File Petition)',
          name: 'नगर निगम शिकायत पेटी (Grievance Box)',
          execute: () => {
            this.completeQuest(1);
          }
        };
      }
    }

    // Mission 4: Gandhi Maidan Stage
    if (this.currentQuestId === 4) {
      const dist = playerPos.distanceTo(new THREE.Vector3(0, 0, -32));
      if (dist < 5.0) {
        return {
          type: 'rally_speech',
          actionText: 'रैली शुरू करें (Hold Election Rally)',
          name: 'गांधी मैदान जनसभा मंच',
          execute: () => {
            const electionBtn = document.getElementById('btn-election-open');
            if (electionBtn) electionBtn.click();
          }
        };
      }
    }

    return null;
  }

  showToast(title, desc) {
    const toast = document.getElementById('game-toast');
    const tTitle = document.getElementById('toast-title');
    const tDesc = document.getElementById('toast-desc');
    if (!toast) return;

    tTitle.textContent = title;
    tDesc.textContent = desc;
    toast.classList.remove('hidden');

    if (this.toastTimeout) clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => {
      toast.classList.add('hidden');
    }, 4500);
  }

  updateHUD(playerPos = null) {
    const cur = this.getCurrentQuest();
    if (cur && this.hudTitle) {
      this.hudTitle.textContent = cur.title;
    }

    if (playerPos && cur && this.hudDist) {
      const target = cur.targetPos;
      if (target) {
        const d = Math.round(playerPos.distanceTo(target));
        this.hudDist.textContent = `🎯 ${cur.targetName} (${d}m)`;
      } else {
        this.hudDist.textContent = `✓ पूर्ण`;
      }
    }
  }

  openQuestLog() {
    if (!this.questModal || !this.questItemsList) return;
    this.questItemsList.innerHTML = '';

    this.quests.forEach((q) => {
      const card = document.createElement('div');
      card.className = `quest-card ${q.status}`;

      let badgeHtml = '';
      if (q.status === 'completed') {
        badgeHtml = '<span class="quest-status-badge badge-completed">✓ पूर्ण (Completed)</span>';
      } else if (q.status === 'active') {
        badgeHtml = '<span class="quest-status-badge badge-active">⚡ सक्रिय (Current Goal)</span>';
      } else {
        badgeHtml = '<span class="quest-status-badge badge-locked">🔒 आगामी (Next Stage)</span>';
      }

      card.innerHTML = `
        <div class="quest-title-row">
          <div class="quest-item-title">${q.title}</div>
          ${badgeHtml}
        </div>
        <div class="quest-item-desc">${q.desc}</div>
        <div class="quest-reward-tag">🎁 पुरस्कार व प्रभाव: ${q.reward}</div>
      `;

      this.questItemsList.appendChild(card);
    });

    this.questModal.classList.remove('hidden');
  }

  closeQuestLog() {
    if (this.questModal) this.questModal.classList.add('hidden');
  }
}
