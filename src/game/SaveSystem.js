export class SaveSystem {
  constructor(game) {
    this.game = game;
    this.storageKeyPrefix = 'rashtraniti_save_slot_';
    this.autoSaveKey = 'rashtraniti_autosave';

    this.setupUI();
    this.startAutoSaveLoop();
  }

  setupUI() {
    this.modal = document.getElementById('save-modal');
    this.btnOpen = document.getElementById('btn-save-menu');
    this.btnClose = document.getElementById('save-close-btn');
    this.container = document.getElementById('save-slots-container');
    this.btnExport = document.getElementById('btn-export-save');
    this.inputImport = document.getElementById('input-import-save');

    if (this.btnOpen) this.btnOpen.addEventListener('click', () => this.open());
    if (this.btnClose) this.btnClose.addEventListener('click', () => this.close());

    if (this.btnExport) {
      this.btnExport.addEventListener('click', () => this.exportSaveFile());
    }

    if (this.inputImport) {
      this.inputImport.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            try {
              const data = JSON.parse(event.target.result);
              this.applySaveData(data);
              this.game.questManager.showToast('📥 लोड सफल!', 'राष्ट्रनीति गेम फ़ाइल सफलतापूर्वक लोड की गई।');
              this.close();
            } catch (err) {
              alert('अमान्य सेव फ़ाइल! (Invalid save file)');
            }
          };
          reader.readAsText(file);
        }
      });
    }
  }

  gatherSaveData() {
    return {
      version: 2,
      gameTitle: "RashtraNiti 3D Simulator",
      timestamp: new Date().toLocaleString('hi-IN'),
      gameState: this.game.gameState.toJSON(),
      player: {
        profile: { ...this.game.character.profile },
        position: {
          x: this.game.character.position.x,
          y: this.game.character.position.y,
          z: this.game.character.position.z
        },
        rotation: this.game.character.rotation
      },
      quests: {
        currentQuestId: this.game.questManager.currentQuestId,
        signaturesCollected: this.game.questManager.signaturesCollected,
        questsStatus: this.game.questManager.quests.map((q) => ({ id: q.id, status: q.status }))
      }
    };
  }

  applySaveData(data) {
    if (!data) return;

    // 1. Restore Political & Economic State
    if (data.gameState) {
      this.game.gameState.fromJSON(data.gameState);
    }

    // 2. Restore Character
    if (data.player) {
      this.game.character.applyProfile(data.player.profile);
      if (data.player.position) {
        this.game.character.position.set(data.player.position.x, data.player.position.y, data.player.position.z);
        this.game.character.rotation = data.player.rotation || 0;
      }
    }

    // 3. Restore Quests
    if (data.quests) {
      this.game.questManager.currentQuestId = data.quests.currentQuestId || 1;
      this.game.questManager.signaturesCollected = !!data.quests.signaturesCollected;
      if (data.quests.questsStatus) {
        data.quests.questsStatus.forEach((qs) => {
          const q = this.game.questManager.quests.find((item) => item.id === qs.id);
          if (q) q.status = qs.status;
        });
      }
    }

    // 4. Restore World consequences (e.g. fixed potholes)
    if (this.game.gameState.governance.potholesFixed) {
      this.game.world.repairPotholes();
    }

    // Update UI HUD
    this.game.questManager.updateHUD(this.game.character.position);
    this.game.customStudio.syncUIFromState();
  }

  saveToSlot(slotId) {
    const data = this.gatherSaveData();
    localStorage.setItem(this.storageKeyPrefix + slotId, JSON.stringify(data));
    this.game.questManager.showToast('💾 गेम सेव!', `स्लॉट ${slotId} में प्रगति सुरक्षित कर ली गई।`);
    this.renderSlots();
  }

  loadFromSlot(slotId) {
    const json = localStorage.getItem(this.storageKeyPrefix + slotId);
    if (!json) return;
    try {
      const data = JSON.parse(json);
      this.applySaveData(data);
      this.game.questManager.showToast('⚡ लोड सफल!', `स्लॉट ${slotId} से गेम लोड किया गया।`);
      this.close();
    } catch (e) {
      console.error(e);
    }
  }

  startAutoSaveLoop() {
    setInterval(() => {
      const data = this.gatherSaveData();
      localStorage.setItem(this.autoSaveKey, JSON.stringify(data));
    }, 35000);
  }

  exportSaveFile() {
    const data = this.gatherSaveData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rashtraniti_save_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  renderSlots() {
    if (!this.container) return;
    this.container.innerHTML = '';

    for (let slotId = 1; slotId <= 3; slotId++) {
      const json = localStorage.getItem(this.storageKeyPrefix + slotId);
      const card = document.createElement('div');
      card.className = `save-slot-card ${json ? '' : 'empty'}`;

      let detailsHtml = 'खाली स्लॉट (Empty Slot)';
      if (json) {
        try {
          const d = JSON.parse(json);
          const gs = d.gameState || {};
          detailsHtml = `
            <div><strong>${gs.playerName || 'नागरिक'}</strong> • ${this.game.gameState.careerTitles[gs.careerTier || 1]}</div>
            <div>💰 ₹${(gs.wallet || 0).toLocaleString('en-IN')} • जनप्रियता: ${gs.popularity || 0}% • मिशन: ${d.quests?.currentQuestId || 1}/4</div>
            <div style="color:var(--text-muted); font-size:0.68rem; margin-top:2px">📅 ${d.timestamp}</div>
          `;
        } catch (e) {}
      }

      card.innerHTML = `
        <div class="slot-info">
          <div class="slot-title">स्लॉट ${slotId}</div>
          <div class="slot-details">${detailsHtml}</div>
        </div>
        <div class="slot-buttons">
          <button class="slot-action-btn btn-slot-save" data-slot="${slotId}">सेव (Save)</button>
          ${json ? `<button class="slot-action-btn btn-slot-load" data-slot="${slotId}">लोड (Load)</button>` : ''}
        </div>
      `;

      card.querySelector('.btn-slot-save').addEventListener('click', () => this.saveToSlot(slotId));
      if (json) {
        card.querySelector('.btn-slot-load').addEventListener('click', () => this.loadFromSlot(slotId));
      }

      this.container.appendChild(card);
    }
  }

  open() {
    this.renderSlots();
    if (this.modal) this.modal.classList.remove('hidden');
  }

  close() {
    if (this.modal) this.modal.classList.add('hidden');
  }
}
