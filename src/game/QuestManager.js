import * as THREE from 'three';

export class QuestManager {
  constructor(world, audioSystem) {
    this.world = world;
    this.audio = audioSystem;

    // 4 Missions Specification
    this.quests = [
      {
        id: 1,
        title: '1. एल्डर से मिलें (Speak with Elder)',
        desc: 'गांव के मुख्य मंडप में जाएं और एल्डर एल्ड्रिन से बात करके अपनी यात्रा का उद्देश्य जानें।',
        targetPos: new THREE.Vector3(0, 0.4, 10),
        status: 'active', // active, completed, locked
        reward: 'आशीर्वाद और क्रिस्टल खोज मार्गदर्शिका'
      },
      {
        id: 2,
        title: '2. 4 तत्वीय क्रिस्टल ढूंढें (Collect 4 Crystals)',
        desc: 'द्वीप में छिपे 4 दिव्य क्रिस्टल (जल, अग्नि, पृथ्वी, वायु) खोजें और उनकी ऊर्जा प्राप्त करें।',
        targetPos: null, // Dynamic (points to nearest remaining crystal)
        status: 'locked',
        reward: 'तत्वीय शक्ति और मीनार की चाबी'
      },
      {
        id: 3,
        title: '3. मीनार का पावन दीया जलाएं (Ignite Mountain Beacon)',
        desc: 'पूर्वी पर्वत की चोटी पर स्थित प्राचीन मीनार पर चढ़ें और पवित्र दीया प्रज्वलित करें।',
        targetPos: new THREE.Vector3(35, 14, 35),
        status: 'locked',
        reward: 'राज्य की सुरक्षा और मंदिर सील कुंजी'
      },
      {
        id: 4,
        title: '4. प्राचीन मंदिर का सील तोड़ें (Unseal Astral Shrine)',
        desc: 'मध्यवर्ती पवित्र मंदिर पर लौटें, सुरक्षा कवच तोड़ें और प्राचीन पावन अवशेष प्राप्त करें।',
        targetPos: new THREE.Vector3(0, 1.2, -15),
        status: 'locked',
        reward: 'दिव्य योद्धा की उपाधि (Realm Champion)'
      }
    ];

    this.currentQuestId = 1;
    this.collectedCrystals = new Set();
    this.totalCrystals = 4;
    this.startTime = Date.now();
    this.isVictory = false;

    this.setupUI();
    this.updateHUD();
  }

  setupUI() {
    this.hudTitle = document.getElementById('hud-quest-title');
    this.hudDist = document.getElementById('quest-distance-indicator');
    this.hudCrystals = document.getElementById('hud-crystals-count');
    this.questModal = document.getElementById('quest-modal');
    this.questItemsList = document.getElementById('quest-items-list');

    const btnLog = document.getElementById('btn-quest-log');
    const btnTracker = document.getElementById('quest-tracker-btn');
    const btnClose = document.getElementById('quest-close-btn');

    if (btnLog) btnLog.addEventListener('click', () => this.openQuestLog());
    if (btnTracker) btnTracker.addEventListener('click', () => this.openQuestLog());
    if (btnClose) btnClose.addEventListener('click', () => this.closeQuestLog());

    // Victory modal continue button
    const btnVic = document.getElementById('btn-victory-continue');
    if (btnVic) {
      btnVic.addEventListener('click', () => {
        document.getElementById('victory-modal').classList.add('hidden');
      });
    }
  }

  getCurrentQuest() {
    return this.quests.find((q) => q.id === this.currentQuestId);
  }

  completeQuest(questId) {
    const q = this.quests.find((item) => item.id === questId);
    if (!q || q.status === 'completed') return;

    q.status = 'completed';
    this.audio.playQuestComplete();
    this.showToast('✨ मिशन पूर्ण! (Quest Complete)', q.title);

    // Advance to next quest
    if (questId < this.quests.length) {
      this.currentQuestId = questId + 1;
      const nextQ = this.quests.find((item) => item.id === this.currentQuestId);
      if (nextQ) nextQ.status = 'active';
    } else {
      // Victory!
      this.triggerVictory();
    }

    this.updateHUD();
  }

  // Handle crystal pickup
  onPickupCrystal(crystalId, crystalName) {
    if (this.collectedCrystals.has(crystalId)) return;
    this.collectedCrystals.add(crystalId);

    this.audio.playCrystalPickup();
    this.showToast('💎 क्रिस्टल मिला!', `${crystalName} एकत्र किया गया (${this.collectedCrystals.size}/${this.totalCrystals})`);

    this.updateHUD();

    // Check if Quest 2 is active and all crystals are collected
    if (this.currentQuestId === 2 && this.collectedCrystals.size >= this.totalCrystals) {
      setTimeout(() => {
        this.completeQuest(2);
      }, 500);
    }
  }

  // Check proximity triggers for Quest 3 (Beacon) and Quest 4 (Shrine)
  checkWorldObjectives(playerPos) {
    // Quest 3: Watchtower Beacon
    if (this.currentQuestId === 3 && !this.world.beaconIgnited) {
      const dist = playerPos.distanceTo(new THREE.Vector3(35, 14, 35));
      if (dist < 5.0) {
        return {
          type: 'beacon',
          actionText: 'दीया जलाएं (Ignite Beacon)',
          name: 'प्राचीन मीनार का पावन दीया',
          execute: () => {
            this.world.igniteBeacon();
            this.audio.playBeaconIgnite();
            this.completeQuest(3);
          }
        };
      }
    }

    // Quest 4: Central Astral Shrine
    if (this.currentQuestId === 4 && !this.world.shrineUnlocked) {
      const dist = playerPos.distanceTo(new THREE.Vector3(0, 1.2, -15));
      if (dist < 4.5) {
        return {
          type: 'shrine',
          actionText: 'सील तोड़ें (Unseal Shrine & Take Relic)',
          name: 'पवित्र दिव्य अवशेष (Astral Relic)',
          execute: () => {
            this.world.unlockShrine();
            this.audio.playShrineUnlock();
            this.completeQuest(4);
          }
        };
      }
    }

    // Crystals pickup trigger
    for (const c of this.world.crystals) {
      if (!c.collected && playerPos.distanceTo(c.pos) < 2.5) {
        return {
          type: 'crystal',
          actionText: 'क्रिस्टल उठाएं (Collect)',
          name: c.name,
          execute: () => {
            c.collected = true;
            c.group.visible = false;
            this.onPickupCrystal(c.id, c.name);
          }
        };
      }
    }

    return null;
  }

  triggerVictory() {
    this.isVictory = true;
    const modal = document.getElementById('victory-modal');
    const statsBox = document.getElementById('victory-stats-box');
    const elapsedSec = Math.floor((Date.now() - this.startTime) / 1000);
    const mins = Math.floor(elapsedSec / 60);
    const secs = elapsedSec % 60;

    if (statsBox) {
      statsBox.innerHTML = `
        <div><strong>💎 क्रिस्टल:</strong> 4 / 4</div>
        <div><strong>⏱️ समय:</strong> ${mins}m ${secs}s</div>
        <div><strong>🏅 उपाधि:</strong> दिव्य संरक्षक</div>
      `;
    }
    if (modal) modal.classList.remove('hidden');
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
    }, 3800);
  }

  updateHUD(playerPos = null) {
    const cur = this.getCurrentQuest();
    if (cur && this.hudTitle) {
      this.hudTitle.textContent = cur.title;
    }
    if (this.hudCrystals) {
      this.hudCrystals.textContent = `💎 ${this.collectedCrystals.size}/4`;
    }

    // Distance calculation
    if (playerPos && cur && this.hudDist) {
      let target = cur.targetPos;
      if (cur.id === 2) {
        // Nearest uncollected crystal
        let nearestDist = Infinity;
        for (const c of this.world.crystals) {
          if (!c.collected) {
            const d = playerPos.distanceTo(c.pos);
            if (d < nearestDist) {
              nearestDist = d;
              target = c.pos;
            }
          }
        }
      }

      if (target) {
        const d = Math.round(playerPos.distanceTo(target));
        this.hudDist.textContent = `🎯 ${d}m`;
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
        badgeHtml = '<span class="quest-status-badge badge-completed">✓ पूर्ण (Done)</span>';
      } else if (q.status === 'active') {
        badgeHtml = '<span class="quest-status-badge badge-active">⚡ सक्रिय (In Progress)</span>';
      } else {
        badgeHtml = '<span class="quest-status-badge badge-locked">🔒 लॉक (Locked)</span>';
      }

      card.innerHTML = `
        <div class="quest-title-row">
          <div class="quest-item-title">${q.title}</div>
          ${badgeHtml}
        </div>
        <div class="quest-item-desc">${q.desc}</div>
        <div class="quest-reward-tag">🎁 पुरस्कार: ${q.reward}</div>
      `;

      this.questItemsList.appendChild(card);
    });

    this.questModal.classList.remove('hidden');
  }

  closeQuestLog() {
    if (this.questModal) this.questModal.classList.add('hidden');
  }
}
