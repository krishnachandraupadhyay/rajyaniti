export class ElectionSystem {
  constructor(gameState, audioSystem, character) {
    this.gameState = gameState;
    this.audio = audioSystem;
    this.character = character;

    this.symbols = [
      { name: "कलम (Pen)", icon: "🖋️" },
      { name: "मशाल (Torch)", icon: "🔥" },
      { name: "चक्र (Wheel)", icon: "⚙️" },
      { name: "अनाज की बाली (Wheat)", icon: "🌾" },
      { name: "दीया (Lamp)", icon: "💡" },
      { name: "बरगद (Banyan Tree)", icon: "🌳" }
    ];

    this.setupUI();
  }

  setupUI() {
    this.modal = document.getElementById('election-modal');
    this.btnOpen = document.getElementById('btn-election-open');
    this.btnClose = document.getElementById('election-close-btn');

    if (this.btnOpen) this.btnOpen.addEventListener('click', () => this.open());
    if (this.btnClose) this.btnClose.addEventListener('click', () => this.close());
  }

  open() {
    this.render();
    if (this.modal) this.modal.classList.remove('hidden');
  }

  close() {
    if (this.modal) this.modal.classList.add('hidden');
  }

  // Hold a Public Speech / Rally at Gandhi Maidan
  holdRally(speechFocus) {
    if (this.gameState.energy < 25) {
      alert('आप बहुत थक चुके हैं! रमेश की दुकान से चाय पीजिए या घर जाकर विश्राम करें। (Need 25 Energy)');
      return;
    }

    this.gameState.consumeEnergy(25);
    this.gameState.election.campaignRalliesDone++;
    this.character.doNamaste();

    // Calculate Speech impact
    const baseImpact = 6 + Math.round(this.gameState.oratorySkill * 0.15);
    this.gameState.boostPopularity(baseImpact);
    this.gameState.boostOratory(5);

    if (this.audio) this.audio.playQuestComplete();

    alert(`📢 गांधी मैदान में विशाल जनसभा सफल!\n"${speechFocus}" पर आपके भाषण से जनता में भारी उत्साह!\nजनप्रियता: +${baseImpact}% | भाषण कला: +5`);
    this.render();
  }

  // Door to door canvassing
  canvasNeighborhood() {
    if (this.gameState.energy < 15) {
      alert('ऊर्जा कम है! चाय पीकर तरोताजा हों। (Need 15 Energy)');
      return;
    }

    this.gameState.consumeEnergy(15);
    this.gameState.election.votersCanvassed += 25;
    this.gameState.boostPopularity(4);
    if (this.audio) this.audio.playBlip();

    alert('🤝 घर-घर जनसंपर्क:\nआपने 25 नए परिवारों से मुलाकात की और अपने विचार रखे।\nजनप्रियता: +4%');
    this.render();
  }

  // Conduct Election Day Vote Count (EVM simulation)
  conductElection() {
    const p = this.gameState;

    // Calculate total voter influence
    let score = p.popularity * 0.5;
    score += (p.governance.solvedGrievanceCount * 6);
    if (p.governance.potholesFixed) score += 12;
    if (p.governance.schoolRenovated) score += 10;
    if (p.governance.clinicUpgraded) score += 10;
    score += (p.election.campaignRalliesDone * 5);
    score += (p.election.votersCanvassed * 0.2);

    // Opposition score
    const oppositionBase = 48 + Math.floor(Math.random() * 8);

    // Calculate percentage
    const total = score + oppositionBase;
    const playerPercent = Math.min(88, Math.max(22, ((score / total) * 100))).toFixed(1);
    const opponentPercent = (100 - playerPercent).toFixed(1);
    const won = parseFloat(playerPercent) > 50.0;

    p.election.lastResult = {
      playerVotes: playerPercent,
      opponentVotes: opponentPercent,
      won
    };

    if (this.audio) {
      if (won) this.audio.playQuestComplete();
      else this.audio.playBlip();
    }

    if (won) {
      p.promoteCareer(3); // Promoted to Ward Councilor!
      p.governance.wardTreasury += 150000;
      alert(`🏆 ऐतिहासिक विजय!\n\nआपको मिले: ${playerPercent}% मत\nविपक्षी (सुरेश तिवारी) को मिले: ${opponentPercent}% मत\n\nबधाई! आप आनंदनगर वार्ड 7 के निर्वाचित 'वार्ड पार्षद' बन चुके हैं!\nनगर निगम बजट: +₹1,50,000`);
    } else {
      alert(`⚠️ चुनाव परिणाम:\n\nआपको मिले: ${playerPercent}% मत\nविपक्षी को मिले: ${opponentPercent}% मत\n\nआप थोड़े से अंतर से पीछे रह गए। मोहल्ले में और विकास कार्य करें, रैलियां करें और दोबारा चुनाव लड़ें!`);
    }

    this.render();
  }

  render() {
    const content = document.getElementById('election-sheet-content');
    if (!content) return;

    const p = this.gameState;

    content.innerHTML = `
      <div class="election-dashboard-card">
        <div class="election-hero-banner">
          <div>
            <h3>${p.party.name}</h3>
            <p style="color:var(--accent-gold); font-size:0.8rem">चुनाव चिन्ह: ${p.party.symbol} • ${p.party.slogan}</p>
          </div>
          <div class="party-flag-box">${p.party.symbolIcon}</div>
        </div>

        <div class="election-stats-row">
          <div class="stat-pill">
            <span class="pill-label">जनप्रियता</span>
            <span class="pill-val">${p.popularity}%</span>
          </div>
          <div class="stat-pill">
            <span class="pill-label">कार्यकर्ता</span>
            <span class="pill-val">${p.party.volunteers}</span>
          </div>
          <div class="stat-pill">
            <span class="pill-label">रैलियां</span>
            <span class="pill-val">${p.election.campaignRalliesDone}</span>
          </div>
          <div class="stat-pill">
            <span class="pill-label">पार्टी फंड</span>
            <span class="pill-val">₹${p.party.partyFunds.toLocaleString('en-IN')}</span>
          </div>
        </div>

        <!-- Campaign Action Center -->
        <h4 style="margin: 14px 0 8px; color:var(--accent-cyan); font-size:0.9rem">📢 चुनावी अभियान व जनसंपर्क गतिविधियां</h4>
        <div class="campaign-actions-grid">
          <button id="btn-action-rally" class="btn-campaign">
            🎤 गांधी मैदान में जनसभा (Hold Rally)
            <small>भाषण दें • +जनप्रियता • ऊर्जा -25</small>
          </button>
          <button id="btn-action-canvass" class="btn-campaign">
            🤝 घर-घर जनसंपर्क (Door-to-Door)
            <small>पर्चा वितरण • +वोटर्स • ऊर्जा -15</small>
          </button>
        </div>

        <!-- Party Symbol Customizer -->
        <div class="form-group" style="margin-top: 16px;">
          <label class="form-label">अपना चुनाव चिन्ह बदलें (Party Symbol):</label>
          <div class="symbol-pills-row" id="symbol-pills-container">
            ${this.symbols.map((sym) => `
              <button class="pill-btn ${p.party.symbol.includes(sym.icon) ? 'active' : ''}" data-symbol="${sym.icon} ${sym.name}" data-icon="${sym.icon}">
                ${sym.icon} ${sym.name}
              </button>
            `).join('')}
          </div>
        </div>

        <!-- Election Contest Button -->
        <div class="election-contest-card">
          <div style="font-weight:700; margin-bottom:4px">वार्ड 7 आम चुनाव (Ward Councilor Election)</div>
          <p style="font-size:0.75rem; color:var(--text-secondary); margin-bottom:10px">
            मुकाबला: <strong>${p.playerName}</strong> बनाम <strong>सुरेश तिवारी</strong> (रूढ़िवादी मोर्चा)
          </p>
          <button id="btn-trigger-election" class="btn-primary-glow" style="background:linear-gradient(135deg, #10b981, #047857)">
            🗳️ मतदान व मतगणना करवाएं (Conduct Election Day)
          </button>
        </div>

        ${p.election.lastResult ? `
          <div class="result-callout ${p.election.lastResult.won ? 'victory' : 'defeat'}">
            <h4>${p.election.lastResult.won ? '🎉 चुनाव परिणाम: आप विजयी रहे!' : '⚠️ चुनाव परिणाम: सुधार की जरूरत'}</h4>
            <div style="display:flex; justify-content:space-around; margin-top:8px; font-weight:700">
              <span>आप: ${p.election.lastResult.playerVotes}%</span>
              <span>सुरेश तिवारी: ${p.election.lastResult.opponentVotes}%</span>
            </div>
          </div>
        ` : ''}
      </div>
    `;

    // Hook buttons
    const btnRally = document.getElementById('btn-action-rally');
    const btnCanvass = document.getElementById('btn-action-canvass');
    const btnElection = document.getElementById('btn-trigger-election');

    if (btnRally) {
      btnRally.addEventListener('click', () => {
        const topics = [
          "भ्रष्टाचार मुक्त पारदर्शी नगर निगम",
          "पक्की सड़कें व 24 घंटे स्वच्छ पेयजल",
          "सरकारी स्कूल का कायाकल्प व बच्चों की शिक्षा",
          "युवाओं को स्वरोजगार व सम्मान"
        ];
        const selected = prompt("भाषण का मुख्य मुद्दा चुनें (1 से 4):\n1. " + topics[0] + "\n2. " + topics[1] + "\n3. " + topics[2] + "\n4. " + topics[3], "1");
        const idx = Math.max(0, Math.min(3, (parseInt(selected) || 1) - 1));
        this.holdRally(topics[idx]);
      });
    }

    if (btnCanvass) {
      btnCanvass.addEventListener('click', () => this.canvasNeighborhood());
    }

    if (btnElection) {
      btnElection.addEventListener('click', () => this.conductElection());
    }

    // Symbol selection
    const symbolBtns = content.querySelectorAll('#symbol-pills-container .pill-btn');
    symbolBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        p.party.symbol = btn.dataset.symbol;
        p.party.symbolIcon = btn.dataset.icon;
        if (this.audio) this.audio.playBlip();
        this.render();
      });
    });
  }
}
