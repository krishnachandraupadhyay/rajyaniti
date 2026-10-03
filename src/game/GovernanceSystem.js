export class GovernanceSystem {
  constructor(gameState, world, audioSystem) {
    this.gameState = gameState;
    this.world = world;
    this.audio = audioSystem;

    // Available Development Projects with Real Consequences
    this.projects = [
      {
        id: 'road_paving',
        title: 'पक्की सड़क व जल निकासी निर्माण (Storm Drainage & Road Paving)',
        cost: 85000,
        satisfactionGain: 22,
        desc: 'मुख्य मार्ग के गड्ढों को भरकर इंटरलॉकिंग टाइल्स और पक्की नाली का निर्माण।',
        completed: false,
        effect: () => {
          this.world.repairPotholes();
          this.gameState.governance.potholesFixed = true;
        }
      },
      {
        id: 'solar_streetlights',
        title: 'सौर ऊर्जा स्ट्रीटलाइट्स स्थापना (Solar Streetlights)',
        cost: 45000,
        satisfactionGain: 15,
        desc: 'वार्ड के सभी 4 प्रमुख चौराहों पर 24 घंटे रोशन रहने वाली सौर बत्तियां।',
        completed: false,
        effect: () => {
          this.gameState.governance.streetlightsInstalled = true;
        }
      },
      {
        id: 'school_upgrade',
        title: 'राजकीय प्राथमिक विद्यालय आधुनिकीकरण (School Modernization)',
        cost: 50000,
        satisfactionGain: 16,
        desc: 'टपकती छत की मरम्मत, नए डेस्क, पंखे और बाल पुस्तकालय की स्थापना।',
        completed: false,
        effect: () => {
          this.gameState.governance.schoolRenovated = true;
        }
      },
      {
        id: 'health_clinic',
        title: 'मोहल्ला स्वास्थ्य केंद्र दवा आपूर्ति (Primary Clinic Medicine Stock)',
        cost: 60000,
        satisfactionGain: 18,
        desc: 'पीएचसी में आवश्यक जीवनरक्षक दवाइयां, ग्लूकोमीटर और डेंगू जांच किट।',
        completed: false,
        effect: () => {
          this.gameState.governance.clinicUpgraded = true;
        }
      },
      {
        id: 'waste_management',
        title: 'स्वच्छ वार्ड 7 अपशिष्ट प्रबंधन (Door-to-Door Waste Collection)',
        cost: 35000,
        satisfactionGain: 12,
        desc: 'कूड़ा उठाने वाली ई-रिक्शा गाड़ी और हर 100 मीटर पर डस्टबिन।',
        completed: false,
        effect: () => {
          this.gameState.governance.drainageCleaned = true;
        }
      }
    ];

    // Citizen Grievances
    this.grievances = [
      { id: 'g1', citizen: 'सुनीता देवी', issue: 'सड़क पर गंदे पानी का भराव', resolved: false, cost: 5000, rewardPop: 8 },
      { id: 'g2', citizen: 'शर्मा जी (मास्टरजी)', issue: 'कक्षा 4-5 के बच्चों के लिए पाठ्यपुस्तकें', resolved: false, cost: 4000, rewardPop: 6 },
      { id: 'g3', citizen: 'रमेश चायवाला', issue: 'बाजार में रात के समय स्ट्रीटलाइट बंद रहना', resolved: false, cost: 3000, rewardPop: 5 },
      { id: 'g4', citizen: 'डॉ. प्रिया', issue: 'मच्छर रोधी फॉगिंग और कीटनाशक छिड़काव', resolved: false, cost: 6000, rewardPop: 7 }
    ];

    // Prime Minister National Policies (Unlocked at Level 5 & 6)
    this.nationalPolicies = [
      {
        id: 'national_infra',
        title: 'राष्ट्रीय गति-शक्ति गलियारा (National Infra Corridor)',
        cost: 500000,
        gain: 30,
        desc: 'राजमार्गों और फ्रेट कॉरिडोर का राष्ट्रव्यापी विस्तार।',
        passed: false
      },
      {
        id: 'digital_health',
        title: 'आयुष्मान भारत डिजिटल मिशन (National Digital Health)',
        cost: 350000,
        gain: 25,
        desc: 'हर ग्रामीण प्राथमिक स्वास्थ्य केंद्र को टेली-मेडिसिन से जोड़ना।',
        passed: false
      },
      {
        id: 'solar_energy',
        title: 'सूर्य घर योजना - सौर ऊर्जा आत्मनिर्भरता (Solar Energy)',
        cost: 400000,
        gain: 28,
        desc: 'करोड़ों घरों को मुफ़्त सौर ऊर्जा और ग्रिड सब्सिडी।',
        passed: false
      }
    ];

    this.setupUI();
  }

  setupUI() {
    this.modal = document.getElementById('governance-modal');
    this.btnOpen = document.getElementById('btn-governance-open');
    this.btnClose = document.getElementById('governance-close-btn');

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

  render() {
    const treasuryEl = document.getElementById('gov-treasury-val');
    const satisfactionEl = document.getElementById('gov-satisfaction-val');
    const tierEl = document.getElementById('gov-tier-badge');
    const projectsContainer = document.getElementById('gov-projects-list');
    const grievancesContainer = document.getElementById('gov-grievances-list');
    const nationalContainer = document.getElementById('gov-national-section');

    if (treasuryEl) treasuryEl.textContent = `₹${this.gameState.governance.wardTreasury.toLocaleString('en-IN')}`;
    if (satisfactionEl) satisfactionEl.textContent = `${this.gameState.wardSatisfaction}%`;
    if (tierEl) tierEl.textContent = this.gameState.getCareerTitle();

    // Render Projects
    if (projectsContainer) {
      projectsContainer.innerHTML = '';
      this.projects.forEach((proj) => {
        const item = document.createElement('div');
        item.className = `gov-card ${proj.completed ? 'completed' : ''}`;
        item.innerHTML = `
          <div class="gov-card-header">
            <h4>${proj.title}</h4>
            <span class="gov-cost-tag">लागत: ₹${proj.cost.toLocaleString('en-IN')}</span>
          </div>
          <p class="gov-card-desc">${proj.desc}</p>
          <div class="gov-card-footer">
            <span class="gov-gain-tag">जन संतुष्टि: +${proj.satisfactionGain}%</span>
            <button class="btn-gov-action ${proj.completed ? 'disabled' : ''}">
              ${proj.completed ? '✓ स्वीकृत व पूर्ण' : 'योजना पास करें (Fund)'}
            </button>
          </div>
        `;

        if (!proj.completed) {
          item.querySelector('button').addEventListener('click', () => {
            if (this.gameState.governance.wardTreasury >= proj.cost) {
              this.gameState.governance.wardTreasury -= proj.cost;
              proj.completed = true;
              if (proj.effect) proj.effect();
              this.gameState.wardSatisfaction = Math.min(100, this.gameState.wardSatisfaction + proj.satisfactionGain);
              this.gameState.boostPopularity(proj.satisfactionGain / 2);
              if (this.audio) this.audio.playQuestComplete();
              this.render();
            } else {
              alert('वार्ड खजाने में पर्याप्त बजट नहीं है! (Insufficient Ward Treasury)');
            }
          });
        }

        projectsContainer.appendChild(item);
      });
    }

    // Render Grievances
    if (grievancesContainer) {
      grievancesContainer.innerHTML = '';
      this.grievances.forEach((g) => {
        const row = document.createElement('div');
        row.className = `grievance-row ${g.resolved ? 'resolved' : ''}`;
        row.innerHTML = `
          <div>
            <strong>${g.citizen}:</strong> ${g.issue}
            <div style="font-size:0.75rem; color:var(--text-muted)">लागत: ₹${g.cost.toLocaleString('en-IN')}</div>
          </div>
          <button class="btn-resolve ${g.resolved ? 'disabled' : ''}">
            ${g.resolved ? '✓ निस्तारित' : 'निपटारा करें'}
          </button>
        `;

        if (!g.resolved) {
          row.querySelector('button').addEventListener('click', () => {
            if (this.gameState.spendMoney(g.cost)) {
              g.resolved = true;
              this.gameState.boostPopularity(g.rewardPop);
              this.gameState.governance.solvedGrievanceCount++;
              if (this.audio) this.audio.playBlip();
              this.render();
            } else {
              alert(`जेब में पर्याप्त पैसे नहीं हैं! (Need ₹${g.cost})`);
            }
          });
        }

        grievancesContainer.appendChild(row);
      });
    }

    // Render National Section if Level >= 4
    if (nationalContainer) {
      if (this.gameState.careerTier >= 4) {
        nationalContainer.classList.remove('hidden');
        const list = document.getElementById('gov-national-list');
        if (list) {
          list.innerHTML = '';
          this.nationalPolicies.forEach((pol) => {
            const card = document.createElement('div');
            card.className = `gov-card ${pol.passed ? 'completed' : ''}`;
            card.innerHTML = `
              <div class="gov-card-header">
                <h4>${pol.title}</h4>
                <span class="gov-cost-tag">केंद्रीय बजट: ₹${pol.cost.toLocaleString('en-IN')}</span>
              </div>
              <p class="gov-card-desc">${pol.desc}</p>
              <div class="gov-card-footer">
                <span class="gov-gain-tag">राष्ट्रव्यापी समर्थन: +${pol.gain}%</span>
                <button class="btn-gov-action ${pol.passed ? 'disabled' : ''}">
                  ${pol.passed ? '✓ संसद में पारित' : 'नीति लागू करें'}
                </button>
              </div>
            `;

            if (!pol.passed) {
              card.querySelector('button').addEventListener('click', () => {
                if (this.gameState.party.partyFunds >= pol.cost) {
                  this.gameState.party.partyFunds -= pol.cost;
                  pol.passed = true;
                  this.gameState.boostPopularity(pol.gain);
                  if (this.audio) this.audio.playQuestComplete();
                  this.render();
                } else {
                  alert('पार्टी/राष्ट्रीय कोष में पर्याप्त बजट नहीं है!');
                }
              });
            }
            list.appendChild(card);
          });
        }
      } else {
        nationalContainer.classList.add('hidden');
      }
    }
  }
}
