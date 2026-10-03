import * as THREE from 'three';
import { AudioSystem } from './game/AudioSystem.js';
import { GameState } from './game/GameState.js';
import { World } from './game/World.js';
import { Character } from './game/Character.js';
import { InputController } from './game/InputController.js';
import { NPCManager } from './game/NPCManager.js';
import { QuestManager } from './game/QuestManager.js';
import { GovernanceSystem } from './game/GovernanceSystem.js';
import { ElectionSystem } from './game/ElectionSystem.js';
import { CustomizationStudio } from './game/CustomizationStudio.js';
import { SaveSystem } from './game/SaveSystem.js';

class Game {
  constructor() {
    this.container = document.getElementById('canvas-container');
    this.clock = new THREE.Clock();
    this.totalTime = 0;

    // 1. Audio System
    this.audio = new AudioSystem();

    // 2. Central Political & Economic State
    this.gameState = new GameState(this.audio);

    // 3. Three.js Scene & Renderer
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 350);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.container.appendChild(this.renderer.domElement);

    // 4. Game Subsystems
    this.world = new World(this.scene);
    this.character = new Character(this.scene, this.audio);
    this.input = new InputController(this.container);
    this.npcManager = new NPCManager(this.scene, this.audio, this.gameState);
    this.questManager = new QuestManager(this.world, this.audio, this.gameState);
    this.governanceSystem = new GovernanceSystem(this.gameState, this.world, this.audio);
    this.electionSystem = new ElectionSystem(this.gameState, this.audio, this.character);

    this.customStudio = new CustomizationStudio(this.character, this.gameState, (newProfile) => {
      this.questManager.showToast('✨ बदलाव लागू!', 'नागरिक प्रोफाइल व गुण अपडेट हो गए हैं।');
      this.updateTopHUD();
    });

    this.saveSystem = new SaveSystem(this);

    // Subscribe to state changes
    this.gameState.subscribe(() => this.updateTopHUD());

    // Interaction target cache
    this.currentInteractable = null;
    this.interactPromptEl = document.getElementById('interact-prompt');
    this.promptActionEl = document.getElementById('prompt-action-text');
    this.promptTargetEl = document.getElementById('prompt-target-name');

    // Camera follow parameters
    this.cameraOffset = new THREE.Vector3();
    this.cameraTarget = new THREE.Vector3();

    this.setupEventListeners();
    this.setupAudioButton();
    this.loadAutoSaveIfExists();
    this.updateTopHUD();

    // Start loop
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  loadAutoSaveIfExists() {
    const autoSave = localStorage.getItem('rashtraniti_autosave');
    if (autoSave) {
      try {
        const data = JSON.parse(autoSave);
        this.saveSystem.applySaveData(data);
      } catch (e) {
        console.warn('Failed to parse autosave', e);
      }
    }
  }

  updateTopHUD() {
    const nameEl = document.getElementById('hud-player-name');
    const badgeEl = document.getElementById('hud-player-badge');
    const walletEl = document.getElementById('hud-wallet-count');
    const popEl = document.getElementById('hud-popularity-tag');
    const timeEl = document.getElementById('hud-time-tag');
    const energyBar = document.getElementById('hud-energy-fill');

    if (nameEl) nameEl.textContent = this.gameState.playerName;
    if (badgeEl) badgeEl.textContent = this.gameState.getCareerTitle();
    if (walletEl) walletEl.textContent = `₹${this.gameState.wallet.toLocaleString('en-IN')}`;
    if (popEl) popEl.textContent = `जनसमर्थन: ${this.gameState.popularity}%`;
    if (timeEl) timeEl.textContent = this.gameState.getTimeFormatted();
    if (energyBar) energyBar.style.width = `${this.gameState.energy}%`;
  }

  setupEventListeners() {
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        document.querySelectorAll('.modal-overlay:not(.hidden)').forEach((modal) => {
          modal.classList.add('hidden');
        });
      }
    });

    const firstTouch = () => {
      this.audio.ensureContext();
      window.removeEventListener('touchstart', firstTouch);
      window.removeEventListener('click', firstTouch);
    };
    window.addEventListener('touchstart', firstTouch);
    window.addEventListener('click', firstTouch);
  }

  setupAudioButton() {
    const btnAudio = document.getElementById('btn-audio-toggle');
    if (!btnAudio) return;

    const updateIcon = () => {
      btnAudio.textContent = this.audio.isMuted ? '🔇' : '🔊';
    };
    updateIcon();

    btnAudio.addEventListener('click', () => {
      this.audio.toggleMute();
      updateIcon();
    });
  }

  checkInteractions() {
    const playerPos = this.character.position;

    // 1. Check Citizen NPC Proximity
    const npcTarget = this.npcManager.checkInteractionTarget(playerPos);
    if (npcTarget) {
      this.currentInteractable = {
        actionText: npcTarget.actionText,
        name: npcTarget.name,
        trigger: () => {
          this.npcManager.startDialogue(npcTarget.target, this.questManager);
        }
      };
      this.showPrompt(this.currentInteractable);
      return;
    }

    // 2. Check Civic World Objectives (Nagar Nigam Drop Box, Gandhi Maidan Stage)
    const objTarget = this.questManager.checkWorldObjectives(playerPos);
    if (objTarget) {
      this.currentInteractable = {
        actionText: objTarget.actionText,
        name: objTarget.name,
        trigger: () => {
          if (objTarget.execute) objTarget.execute();
        }
      };
      this.showPrompt(this.currentInteractable);
      return;
    }

    // None in range
    this.currentInteractable = null;
    this.hidePrompt();
  }

  showPrompt(interactable) {
    if (!this.interactPromptEl) return;
    this.promptActionEl.textContent = interactable.actionText;
    this.promptTargetEl.textContent = interactable.name;
    this.interactPromptEl.classList.remove('hidden');
  }

  hidePrompt() {
    if (this.interactPromptEl) {
      this.interactPromptEl.classList.add('hidden');
    }
  }

  // Smooth Third-Person Camera Follow
  updateCamera(delta) {
    const charPos = this.character.position;
    const yaw = this.input.cameraYaw;
    const pitch = this.input.cameraPitch;
    const dist = this.input.cameraDistance;

    const horizontalDist = dist * Math.cos(pitch);
    const verticalDist = dist * Math.sin(pitch);

    const camX = charPos.x - Math.sin(yaw) * horizontalDist;
    const camZ = charPos.z - Math.cos(yaw) * horizontalDist;
    let camY = charPos.y + verticalDist + 1.25;

    // Smooth lerp camera position
    this.camera.position.lerp(new THREE.Vector3(camX, camY, camZ), Math.min(delta * 10, 1.0));

    // Look at player chest
    const targetY = charPos.y + 1.15;
    this.cameraTarget.lerp(new THREE.Vector3(charPos.x, targetY, charPos.z), Math.min(delta * 12, 1.0));
    this.camera.lookAt(this.cameraTarget);
  }

  animate() {
    requestAnimationFrame(this.animate);

    const delta = Math.min(this.clock.getDelta(), 0.1);
    this.totalTime += delta;

    // Advance in-game time
    this.gameState.updateTime(delta);

    // 1. Process Jump Input
    if (this.input.consumeJump()) {
      this.character.jump();
    }

    // 2. Process Namaste / Speech Gesture
    if (this.input.consumeAttack()) {
      this.character.doNamaste();
      if (this.audio) this.audio.playBlip();
    }

    // 3. Process Interact Input
    if (this.input.consumeInteract() && this.currentInteractable) {
      this.currentInteractable.trigger();
    }

    // 4. Move Character with Town Collision
    const moveDir = this.input.getMoveDirection();
    this.character.update(delta, moveDir, this.input.cameraYaw, this.world);

    // 5. Update Camera
    this.updateCamera(delta);

    // 6. Update Town World Lighting (Day/Night)
    this.world.update(delta, this.totalTime, this.gameState);

    // 7. Update NPCs
    this.npcManager.update(delta, this.totalTime, this.camera);

    // 8. Check Interaction Proximity
    this.checkInteractions();

    // 9. Update Quest Compass & Distance
    this.questManager.updateHUD(this.character.position);

    // 10. Render
    this.renderer.render(this.scene, this.camera);
  }
}

// Bootstrap Game once DOM is loaded
window.addEventListener('DOMContentLoaded', () => {
  window.gameInstance = new Game();
});
