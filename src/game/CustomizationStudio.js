export class CustomizationStudio {
  constructor(character, gameState, onSaveCallback) {
    this.character = character;
    this.gameState = gameState;
    this.onSave = onSaveCallback;

    this.state = {
      name: this.gameState.playerName,
      age: this.gameState.age,
      gender: this.gameState.gender,
      education: this.gameState.education,
      background: this.gameState.background,
      skinColor: this.character.profile.skinColor,
      hairColor: this.character.profile.hairColor,
      hairStyle: this.character.profile.hairStyle,
      kurtaColor: this.character.profile.kurtaColor,
      jacketColor: this.character.profile.jacketColor,
      hasJacket: this.character.profile.hasJacket
    };

    this.setupUI();
    this.syncUIFromState();
  }

  setupUI() {
    this.modal = document.getElementById('customization-modal');
    this.btnOpen = document.getElementById('btn-customize-open');
    this.profilePill = document.getElementById('profile-pill-btn');
    this.btnClose = document.getElementById('customize-close-btn');
    this.btnSave = document.getElementById('btn-save-customization');

    if (this.btnOpen) this.btnOpen.addEventListener('click', () => this.open());
    if (this.profilePill) this.profilePill.addEventListener('click', () => this.open());
    if (this.btnClose) this.btnClose.addEventListener('click', () => this.close());
    if (this.btnSave) this.btnSave.addEventListener('click', () => this.saveAndApply());

    // Tabs
    const tabs = document.querySelectorAll('.customization-tabs .tab-btn');
    tabs.forEach((btn) => {
      btn.addEventListener('click', () => {
        tabs.forEach((t) => t.classList.remove('active'));
        btn.classList.add('active');
        const targetId = btn.dataset.tab;
        document.querySelectorAll('.tab-pane').forEach((p) => p.classList.remove('active'));
        const pane = document.getElementById(targetId);
        if (pane) pane.classList.add('active');
      });
    });

    // 1. Name input
    const inputName = document.getElementById('input-character-name');
    if (inputName) {
      inputName.addEventListener('input', (e) => {
        this.state.name = e.target.value.trim() || 'नागरिक';
      });
    }

    // 2. Skin swatches
    this.setupSwatches('swatches-skin', (color) => {
      this.state.skinColor = color;
      this.character.applyProfile(this.state);
    });

    // 3. Hair style pills
    const hairPills = document.querySelectorAll('#hair-style-group .pill-btn');
    hairPills.forEach((btn) => {
      btn.addEventListener('click', () => {
        hairPills.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        this.state.hairStyle = btn.dataset.hairstyle;
        this.character.applyProfile(this.state);
      });
    });

    // 4. Hair color swatches
    this.setupSwatches('swatches-hair', (color) => {
      this.state.hairColor = color;
      this.character.applyProfile(this.state);
    });

    // 5. Nehru Jacket Color Swatches
    this.setupSwatches('swatches-outfit', (color) => {
      this.state.jacketColor = color;
      this.character.applyProfile(this.state);
    });

    // 6. Nehru Jacket Toggle
    const toggleJacket = document.getElementById('toggle-cape'); // Reused element
    if (toggleJacket) {
      toggleJacket.addEventListener('change', (e) => {
        this.state.hasJacket = e.target.checked;
        this.character.applyProfile(this.state);
      });
    }

    // 7. Age slider
    const sliderAge = document.getElementById('slider-age');
    const ageVal = document.getElementById('age-display-value');
    const ageBadge = document.getElementById('age-category-badge');

    if (sliderAge) {
      sliderAge.addEventListener('input', (e) => {
        const val = parseInt(e.target.value);
        this.state.age = val;
        if (ageVal) ageVal.textContent = `${val} वर्ष`;

        if (ageBadge) {
          if (val < 28) ageBadge.textContent = 'युवा नेता (Young Leader)';
          else if (val < 45) ageBadge.textContent = 'परिपक्व जनसेवक (Seasoned Activist)';
          else if (val < 60) ageBadge.textContent = 'वरिष्ठ जन-प्रतिनिधि (Senior Statesman)';
          else ageBadge.textContent = 'मार्गदर्शक नेता (Elder Statesman)';
        }

        this.character.applyProfile(this.state);
      });
    }

    // 8. Background Archetype Selection (Indian Career Roots)
    const cards = document.querySelectorAll('.archetype-card');
    cards.forEach((card) => {
      card.addEventListener('click', () => {
        cards.forEach((c) => c.classList.remove('active'));
        card.classList.add('active');
        this.state.background = card.dataset.archetype;
        this.applyStartingBackgroundBonus(card.dataset.archetype);
      });
    });
  }

  applyStartingBackgroundBonus(bg) {
    if (bg === 'activist') {
      // Grassroots Social Worker
      this.state.education = "समाज सेवा में स्नातक (BSW)";
    } else if (bg === 'lawyer') {
      // Young Advocate
      this.state.education = "विधि स्नातक (LLB Advocate)";
    } else if (bg === 'merchant') {
      // Local Merchant
      this.state.education = "वाणिज्य स्नातक (B.Com)";
    } else if (bg === 'teacher') {
      // Idealist Teacher
      this.state.education = "शिक्षा शास्त्र (B.Ed / M.A.)";
    }
  }

  setupSwatches(containerId, onSelect) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const btns = container.querySelectorAll('.swatch-btn');
    btns.forEach((btn) => {
      btn.addEventListener('click', () => {
        btns.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        onSelect(btn.dataset.color);
      });
    });
  }

  syncUIFromState() {
    this.state.name = this.gameState.playerName;
    this.state.age = this.gameState.age;
    this.state.background = this.gameState.background;

    const inputName = document.getElementById('input-character-name');
    if (inputName) inputName.value = this.state.name;

    const sliderAge = document.getElementById('slider-age');
    const ageVal = document.getElementById('age-display-value');
    if (sliderAge) sliderAge.value = this.state.age;
    if (ageVal) ageVal.textContent = `${this.state.age} वर्ष`;

    const hudName = document.getElementById('hud-player-name');
    const hudBadge = document.getElementById('hud-player-badge');
    const hudAge = document.getElementById('hud-age-tag');
    const hudWallet = document.getElementById('hud-wallet-count');

    if (hudName) hudName.textContent = this.gameState.playerName;
    if (hudBadge) hudBadge.textContent = this.gameState.getCareerTitle();
    if (hudAge) hudAge.textContent = `उम्र: ${this.gameState.age}`;
    if (hudWallet) hudWallet.textContent = `₹${this.gameState.wallet.toLocaleString('en-IN')}`;
  }

  open() {
    this.syncUIFromState();
    if (this.modal) this.modal.classList.remove('hidden');
  }

  close() {
    if (this.modal) this.modal.classList.add('hidden');
  }

  saveAndApply() {
    this.gameState.playerName = this.state.name;
    this.gameState.age = this.state.age;
    this.gameState.background = this.state.background;
    if (this.state.education) this.gameState.education = this.state.education;

    // Apply starting background economy if initial
    if (this.gameState.careerTier === 1 && !this.gameState.initializedBackground) {
      this.gameState.initializedBackground = true;
      if (this.state.background === 'activist') {
        this.gameState.wallet = 5000;
        this.gameState.popularity = 35;
        this.gameState.oratorySkill = 35;
      } else if (this.state.background === 'lawyer') {
        this.gameState.wallet = 25000;
        this.gameState.popularity = 22;
        this.gameState.oratorySkill = 45;
      } else if (this.state.background === 'merchant') {
        this.gameState.wallet = 65000;
        this.gameState.popularity = 18;
        this.gameState.oratorySkill = 25;
      } else if (this.state.background === 'teacher') {
        this.gameState.wallet = 15000;
        this.gameState.popularity = 30;
        this.gameState.oratorySkill = 40;
      }
    }

    this.character.applyProfile(this.state);
    this.syncUIFromState();
    this.close();

    if (this.onSave) {
      this.onSave(this.state);
    }
  }
}
