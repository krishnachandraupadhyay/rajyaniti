import * as THREE from 'three';
import { AudioSystem } from './game/AudioSystem.js';
import { World } from './game/World.js';
import { Character } from './game/Character.js';
import { InputController } from './game/InputController.js';
import { NPCManager } from './game/NPCManager.js';
import { QuestManager } from './game/QuestManager.js';
import { CustomizationStudio } from './game/CustomizationStudio.js';
import { SaveSystem } from './game/SaveSystem.js';

class Game {
  constructor() {
    this.container = document.getElementById('canvas-container');
    this.clock = new THREE.Clock();
    this.totalTime = 0;

    // 1. Audio System
    this.audio = new AudioSystem();

    // 2. Three.js Scene & Renderer
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 300);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.container.appendChild(this.renderer.domElement);

    // 3. Game Subsystems
    this.world = new World(this.scene);
    this.character = new Character(this.scene, this.audio);
    this.input = new InputController(this.container);
    this.npcManager = new NPCManager(this.scene, this.audio);
    this.questManager = new QuestManager(this.world, this.audio);

    this.customStudio = new CustomizationStudio(this.character, (newProfile) => {
      this.questManager.showToast('✨ बदलाव लागू!', 'कैरेक्टर का रूप व गुण अपडेट हो गए हैं।');
      this.questManager.updateHUD(this.character.position);
    });

    this.saveSystem = new SaveSystem(this);

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

    // Start loop
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  loadAutoSaveIfExists() {
    const autoSave = localStorage.getItem('astral_realm_autosave');
    if (autoSave) {
      try {
        const data = JSON.parse(autoSave);
        this.saveSystem.applySaveData(data);
      } catch (e) {
        console.warn('Failed to parse autosave', e);
      }
    }
  }

  setupEventListeners() {
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // Android back button / escape to close open modals
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        document.querySelectorAll('.modal-overlay:not(.hidden)').forEach((modal) => {
          modal.classList.add('hidden');
        });
      }
    });

    // Unmute audio on first touch
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

  // Check for nearby interactive targets (NPCs, Crystals, Beacon, Shrine)
  checkInteractions() {
    const playerPos = this.character.position;

    // 1. Check NPC proximity
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

    // 2. Check Quest Objectives (Beacon, Shrine, Crystals)
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

    // Calculate camera target offset based on yaw and pitch
    const horizontalDist = dist * Math.cos(pitch);
    const verticalDist = dist * Math.sin(pitch);

    const camX = charPos.x - Math.sin(yaw) * horizontalDist;
    const camZ = charPos.z - Math.cos(yaw) * horizontalDist;
    let camY = charPos.y + verticalDist + 1.2;

    // Ensure camera stays above terrain
    const minTerrainCamY = this.world.getTerrainHeight(camX, camZ) + 0.8;
    if (camY < minTerrainCamY) camY = minTerrainCamY;

    // Smooth lerp camera position
    this.camera.position.lerp(new THREE.Vector3(camX, camY, camZ), Math.min(delta * 10, 1.0));

    // Look at player chest/head
    const targetY = charPos.y + 1.2;
    this.cameraTarget.lerp(new THREE.Vector3(charPos.x, targetY, charPos.z), Math.min(delta * 12, 1.0));
    this.camera.lookAt(this.cameraTarget);
  }

  animate() {
    requestAnimationFrame(this.animate);

    const delta = Math.min(this.clock.getDelta(), 0.1);
    this.totalTime += delta;

    // 1. Process Jump Input
    if (this.input.consumeJump()) {
      this.character.jump();
    }

    // Process Attack / Sword Slash Input
    if (this.input.consumeAttack()) {
      this.character.attack();
    }

    // 2. Process Interact Input
    if (this.input.consumeInteract() && this.currentInteractable) {
      this.currentInteractable.trigger();
    }

    // 3. Move Character
    const moveDir = this.input.getMoveDirection();
    const terrainHeightFunc = (x, z) => this.world.getTerrainHeight(x, z);
    this.character.update(delta, moveDir, this.input.cameraYaw, terrainHeightFunc);

    // 4. Update Third Person Camera
    this.updateCamera(delta);

    // 5. Update World (Crystals, Beacon, Shrine)
    this.world.update(delta, this.totalTime);

    // 6. Update NPCs (face camera, icon bounce)
    this.npcManager.update(delta, this.totalTime, this.camera);

    // 7. Check Interaction Proximity
    this.checkInteractions();

    // 8. Update HUD Quest Compass
    this.questManager.updateHUD(this.character.position);

    // 9. Render Scene
    this.renderer.render(this.scene, this.camera);
  }
}

// Bootstrap Game once DOM is loaded
window.addEventListener('DOMContentLoaded', () => {
  window.gameInstance = new Game();
});
