// RashtraNiti: Central Political & Citizen Life Simulation State
export class GameState {
  constructor(audioSystem) {
    this.audio = audioSystem;

    // Player Identity & Citizen Profile
    this.playerName = "आर्यन शर्मा (Aaryan)";
    this.age = 25;
    this.gender = "male";
    this.education = "स्नातक (Graduate - BA/LLB)";
    this.background = "activist"; // activist, lawyer, merchant, teacher

    // Career Progression Tier:
    // 1: आम नागरिक (Citizen)
    // 2: जनसेवक / समाजसेवी (Community Activist)
    // 3: वार्ड पार्षद (Ward Municipal Councilor)
    // 4: विधायक (MLA - Vidhan Sabha)
    // 5: मुख्यमंत्री (Chief Minister)
    // 6: प्रधानमंत्री (Prime Minister of India)
    this.careerTier = 1;
    this.careerTitles = {
      1: "आम नागरिक (Citizen)",
      2: "जनसेवक (Community Activist)",
      3: "वार्ड पार्षद (Ward Councilor)",
      4: "विधायक (Member of Legislative Assembly - MLA)",
      5: "मुख्यमंत्री (Chief Minister)",
      6: "प्रधानमंत्री (Prime Minister of India)"
    };

    // Economy & Vitals (in INR ₹)
    this.wallet = 12000;
    this.popularity = 25; // % public support in neighborhood (0 - 100)
    this.energy = 100; // 0 - 100 (depletes on work, restored by tea/sleep)
    this.oratorySkill = 30; // Public speaking / speech talent (0 - 100)
    this.integrity = 85; // Clean governance / anti-corruption index (0 - 100)
    this.wardSatisfaction = 42; // Ward overall happiness %

    // Political Party Info
    this.party = {
      isFormed: false,
      name: "राष्ट्र विकास दल (Rashtra Vikas Dal)",
      symbol: "🖋️ कलम (Pen)",
      symbolIcon: "🖋️",
      slogan: "शिक्षा, स्वास्थ्य, और सबका विकास",
      volunteers: 8,
      partyFunds: 25000
    };

    // In-game 24h Clock
    this.time = {
      day: 1,
      hour: 9,
      minute: 30
    };
    this.timeTicker = 0;

    // Governance & Civic Metrics (Ward No. 7 "आनंदनगर")
    this.governance = {
      wardTreasury: 450000,
      monthlyTaxRevenue: 60000,
      potholesFixed: false,
      drainageCleaned: false,
      streetlightsInstalled: false,
      schoolRenovated: false,
      clinicUpgraded: false,
      grievanceCount: 4,
      solvedGrievanceCount: 0
    };

    // Active Election State
    this.election = {
      inProgress: false,
      candidateRegistered: false,
      campaignRalliesDone: 0,
      votersCanvassed: 0,
      opponentName: "सुरेश तिवारी (निवर्तमान पार्षद)",
      opponentParty: "रूढ़िवादी मोर्चा",
      opponentStrength: 52, // % initial
      lastResult: null // { playerVotes, opponentVotes, won: bool, margin: number }
    };

    // Listeners for UI updates
    this.listeners = [];
  }

  subscribe(callback) {
    this.listeners.push(callback);
  }

  notify() {
    this.listeners.forEach((fn) => fn(this));
  }

  // Time & Day Cycle Loop
  updateTime(delta) {
    this.timeTicker += delta;
    // 1 in-game minute = 1 real second
    if (this.timeTicker >= 1.0) {
      this.timeTicker = 0;
      this.time.minute += 1;
      if (this.time.minute >= 60) {
        this.time.minute = 0;
        this.time.hour += 1;
        if (this.time.hour >= 24) {
          this.time.hour = 0;
          this.time.day += 1;
          this.onNewDay();
        }
      }
      this.notify();
    }
  }

  onNewDay() {
    // Daily expenses & passive volunteer growth
    const dailyExpenses = 250;
    this.wallet = Math.max(0, this.wallet - dailyExpenses);

    if (this.party.isFormed) {
      // Modest citizen donations
      const dailyDonations = Math.round(this.popularity * 35);
      this.party.partyFunds += dailyDonations;
    }

    if (this.careerTier >= 3) {
      // Municipal honorarium / salary
      this.wallet += 1500;
    }

    this.notify();
  }

  getTimeFormatted() {
    const h = String(this.time.hour).padStart(2, '0');
    const m = String(this.time.minute).padStart(2, '0');
    const period = this.time.hour >= 12 ? 'PM' : 'AM';
    return `दिन ${this.time.day} • ${h}:${m} ${period}`;
  }

  isNight() {
    return this.time.hour >= 19 || this.time.hour < 5;
  }

  getCareerTitle() {
    return this.careerTitles[this.careerTier] || "नागरिक";
  }

  // Financial transactions
  addMoney(amount, reason = "") {
    this.wallet += amount;
    this.notify();
  }

  spendMoney(amount) {
    if (this.wallet >= amount) {
      this.wallet -= amount;
      this.notify();
      return true;
    }
    return false;
  }

  // Popularity & Skill increments
  boostPopularity(pts) {
    this.popularity = Math.min(100, Math.max(0, this.popularity + pts));
    this.notify();
  }

  boostOratory(pts) {
    this.oratorySkill = Math.min(100, Math.max(0, this.oratorySkill + pts));
    this.notify();
  }

  consumeEnergy(amount) {
    this.energy = Math.max(0, this.energy - amount);
    this.notify();
  }

  restoreEnergy(amount) {
    this.energy = Math.min(100, this.energy + amount);
    this.notify();
  }

  // Career Promotion
  promoteCareer(newTier) {
    if (newTier > this.careerTier) {
      this.careerTier = newTier;
      if (this.audio) this.audio.playQuestComplete();
      this.notify();
    }
  }

  // Serialize to JSON
  toJSON() {
    return {
      playerName: this.playerName,
      age: this.age,
      gender: this.gender,
      education: this.education,
      background: this.background,
      careerTier: this.careerTier,
      wallet: this.wallet,
      popularity: this.popularity,
      energy: this.energy,
      oratorySkill: this.oratorySkill,
      integrity: this.integrity,
      wardSatisfaction: this.wardSatisfaction,
      party: { ...this.party },
      time: { ...this.time },
      governance: { ...this.governance },
      election: { ...this.election }
    };
  }

  fromJSON(data) {
    if (!data) return;
    if (data.playerName) this.playerName = data.playerName;
    if (data.age) this.age = data.age;
    if (data.gender) this.gender = data.gender;
    if (data.education) this.education = data.education;
    if (data.background) this.background = data.background;
    if (data.careerTier) this.careerTier = data.careerTier;
    if (data.wallet !== undefined) this.wallet = data.wallet;
    if (data.popularity !== undefined) this.popularity = data.popularity;
    if (data.energy !== undefined) this.energy = data.energy;
    if (data.oratorySkill !== undefined) this.oratorySkill = data.oratorySkill;
    if (data.integrity !== undefined) this.integrity = data.integrity;
    if (data.wardSatisfaction !== undefined) this.wardSatisfaction = data.wardSatisfaction;
    if (data.party) this.party = { ...this.party, ...data.party };
    if (data.time) this.time = { ...this.time, ...data.time };
    if (data.governance) this.governance = { ...this.governance, ...data.governance };
    if (data.election) this.election = { ...this.election, ...data.election };
    this.notify();
  }
}
