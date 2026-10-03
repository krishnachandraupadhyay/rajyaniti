export class CustomizationStudio {
  constructor(character, onSaveCallback) {
    this.character = character;
    this.onSave = onSaveCallback;

    // Temporary working state
    this.state = { ...this.character.profile };

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
        this.state.name = e.target.value.trim() || 'योद्धा';
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

    // 5. Outfit color swatches
    this.setupSwatches('swatches-outfit', (color) => {
      this.state.outfitColor = color;
      this.character.applyProfile(this.state);
    });

    // 6. Cape toggle
    const toggleCape = document.getElementById('toggle-cape');
    if (toggleCape) {
      toggleCape.addEventListener('change', (e) => {
        this.state.hasCape = e.target.checked;
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
          if (val < 22) ageBadge.textContent = 'तरुण योद्धा (Novice)';
          else if (val < 38) ageBadge.textContent = 'वीर योद्धा (Prime)';
          else if (val < 52) ageBadge.textContent = 'अनुभवी सेनापति (Veteran)';
          else ageBadge.textContent = 'पूज्य गुरु (Elder Master)';
        }

        this.character.applyProfile(this.state);
      });
    }

    // 8. Archetype cards
    const cards = document.querySelectorAll('.archetype-card');
    cards.forEach((card) => {
      card.addEventListener('click', () => {
        cards.forEach((c) => c.classList.remove('active'));
        card.classList.add('active');
        this.state.archetype = card.dataset.archetype;
        this.character.applyProfile(this.state);
      });
    });
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
    this.state = { ...this.character.profile };

    // Update Name
    const inputName = document.getElementById('input-character-name');
    if (inputName) inputName.value = this.state.name;

    // Update Age
    const sliderAge = document.getElementById('slider-age');
    const ageVal = document.getElementById('age-display-value');
    if (sliderAge) sliderAge.value = this.state.age;
    if (ageVal) ageVal.textContent = `${this.state.age} वर्ष`;

    // Update Cape
    const toggleCape = document.getElementById('toggle-cape');
    if (toggleCape) toggleCape.checked = !!this.state.hasCape;

    // Update HUD
    const hudName = document.getElementById('hud-player-name');
    const hudBadge = document.getElementById('hud-player-badge');
    const hudAge = document.getElementById('hud-age-tag');

    if (hudName) hudName.textContent = this.state.name;
    if (hudBadge) hudBadge.textContent = this.state.archetype.toUpperCase();
    if (hudAge) hudAge.textContent = `उम्र: ${this.state.age}`;
  }

  open() {
    this.syncUIFromState();
    if (this.modal) this.modal.classList.remove('hidden');
  }

  close() {
    if (this.modal) this.modal.classList.add('hidden');
  }

  saveAndApply() {
    this.character.applyProfile(this.state);
    this.syncUIFromState();
    this.close();

    if (this.onSave) {
      this.onSave(this.state);
    }
  }
}
