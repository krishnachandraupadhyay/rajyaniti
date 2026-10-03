export class SaveSystem {
  constructor(game) {
    this.game = game;
    this.storageKeyPrefix = 'astral_realm_save_slot_';
    this.autoSaveKey = 'astral_realm_autosave';

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
              this.game.questManager.showToast('📥 लोड सफल!', 'सेव फ़ाइल सफलतापूर्वक लोड की गई।');
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

  // Build serialized state object
  gatherSaveData() {
    return {
      version: 1,
      timestamp: new Date().toLocaleString('hi-IN'),
      player: {
        name: this.game.character.profile.name,
        profile: { ...this.game.character.profile },
        position: {
          x: this.game.character.position.x,
          y: this.game.character.position.y,
          z: this.game.character.position.z
        },
        rotation: this.game.character.rotation
      },
      world: {
        beaconIgnited: this.game.world.beaconIgnited,
        shrineUnlocked: this.game.world.shrineUnlocked,
        crystals: this.game.world.crystals.map((c) => ({ id: c.id, collected: c.collected }))
      },
      quests: {
        currentQuestId: this.game.questManager.currentQuestId,
        collectedCrystals: Array.from(this.game.questManager.collectedCrystals),
        questsStatus: this.game.questManager.quests.map((q) => ({ id: q.id, status: q.status }))
      }
    };
  }

  // Restore state from serialized data
  applySaveData(data) {
    if (!data) return;

    // 1. Restore Character
    if (data.player) {
      this.game.character.applyProfile(data.player.profile);
      if (data.player.position) {
        this.game.character.position.set(data.player.position.x, data.player.position.y, data.player.position.z);
        this.game.character.rotation = data.player.rotation || 0;
      }
    }

    // 2. Restore Quests
    if (data.quests) {
      this.game.questManager.currentQuestId = data.quests.currentQuestId;
      this.game.questManager.collectedCrystals = new Set(data.quests.collectedCrystals || []);

      if (data.quests.questsStatus) {
        data.quests.questsStatus.forEach((qs) => {
          const q = this.game.questManager.quests.find((item) => item.id === qs.id);
          if (q) q.status = qs.status;
        });
      }
    }

    // 3. Restore World
    if (data.world) {
      if (data.world.beaconIgnited) {
        this.game.world.igniteBeacon();
      }
      if (data.world.shrineUnlocked) {
        this.game.world.unlockShrine();
      }
      if (data.world.crystals) {
        data.world.crystals.forEach((cs) => {
          const c = this.game.world.crystals.find((item) => item.id === cs.id);
          if (c && cs.collected) {
            c.collected = true;
            c.group.visible = false;
          }
        });
      }
    }

    // Update HUD and studio UI
    this.game.questManager.updateHUD(this.game.character.position);
    this.game.customStudio.syncUIFromState();
  }

  // Save to specific slot (1, 2, 3)
  saveToSlot(slotId) {
    const data = this.gatherSaveData();
    localStorage.setItem(this.storageKeyPrefix + slotId, JSON.stringify(data));
    this.game.questManager.showToast('💾 गेम सेव हुआ!', `स्लॉट ${slotId} में प्रगति सुरक्षित कर ली गई।`);
    this.renderSlots();
  }

  // Load from specific slot
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

  // Auto-save every 40s
  startAutoSaveLoop() {
    setInterval(() => {
      const data = this.gatherSaveData();
      localStorage.setItem(this.autoSaveKey, JSON.stringify(data));
    }, 40000);
  }

  // Export Save File (.json)
  exportSaveFile() {
    const data = this.gatherSaveData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `astral_realm_save_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // Render Slots in Modal
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
          detailsHtml = `
            <div><strong>${d.player.name}</strong> • उम्र ${d.player.profile.age} • ${d.player.profile.archetype.toUpperCase()}</div>
            <div>💎 क्रिस्टल: ${d.quests.collectedCrystals.length}/4 • मिशन: ${d.quests.currentQuestId}/4</div>
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
