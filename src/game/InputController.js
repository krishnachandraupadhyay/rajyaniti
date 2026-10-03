import * as THREE from 'three';

export class InputController {
  constructor(canvasContainer) {
    this.container = canvasContainer;

    // Output movement vector (-1 to 1)
    this.moveVector = new THREE.Vector2(0, 0);

    // Camera angles
    this.cameraYaw = 0; // Horizontal rotation
    this.cameraPitch = 0.28; // Vertical tilt
    this.cameraDistance = 5.2;

    // Action triggers
    this.isJumpPressed = false;
    this.isInteractPressed = false;
    this.isAttackPressed = false;

    // Keyboard state
    this.keys = {
      forward: false,
      backward: false,
      left: false,
      right: false
    };

    // Touch tracking
    this.joystickTouchId = null;
    this.cameraTouchId = null;
    this.lastTouchLookX = 0;
    this.lastTouchLookY = 0;

    // Mouse drag tracking for desktop
    this.isMouseDown = false;
    this.lastMouseX = 0;
    this.lastMouseY = 0;

    this.setupKeyboardListeners();
    this.setupJoystickControls();
    this.setupCameraTouchListeners();
    this.setupActionButtons();
  }

  // Trigger haptic vibration on Android
  vibrate(ms = 25) {
    if (window.navigator && window.navigator.vibrate) {
      try {
        window.navigator.vibrate(ms);
      } catch (e) {}
    }
  }

  setupKeyboardListeners() {
    window.addEventListener('keydown', (e) => {
      const code = e.code;
      if (code === 'KeyW' || code === 'ArrowUp') this.keys.forward = true;
      if (code === 'KeyS' || code === 'ArrowDown') this.keys.backward = true;
      if (code === 'KeyA' || code === 'ArrowLeft') this.keys.left = true;
      if (code === 'KeyD' || code === 'ArrowRight') this.keys.right = true;

      if (code === 'Space') {
        this.isJumpPressed = true;
        this.vibrate(15);
      }
      if (code === 'KeyE' || code === 'Enter') {
        this.isInteractPressed = true;
        this.vibrate(20);
      }
      if (code === 'KeyF') {
        this.isAttackPressed = true;
        this.vibrate(25);
      }
    });

    window.addEventListener('keyup', (e) => {
      const code = e.code;
      if (code === 'KeyW' || code === 'ArrowUp') this.keys.forward = false;
      if (code === 'KeyS' || code === 'ArrowDown') this.keys.backward = false;
      if (code === 'KeyA' || code === 'ArrowLeft') this.keys.left = false;
      if (code === 'KeyD' || code === 'ArrowRight') this.keys.right = false;

      if (code === 'Space') this.isJumpPressed = false;
      if (code === 'KeyE' || code === 'Enter') this.isInteractPressed = false;
      if (code === 'KeyF') this.isAttackPressed = false;
    });

    // Mouse drag on desktop
    window.addEventListener('mousedown', (e) => {
      // Ignore if clicking on UI buttons or modals
      if (e.target.closest('.hud-top-bar, .modal-sheet, .dialogue-card, .interact-prompt-card, .action-buttons-zone')) return;
      this.isMouseDown = true;
      this.lastMouseX = e.clientX;
      this.lastMouseY = e.clientY;
    });

    window.addEventListener('mousemove', (e) => {
      if (!this.isMouseDown) return;
      const dx = e.clientX - this.lastMouseX;
      const dy = e.clientY - this.lastMouseY;
      this.lastMouseX = e.clientX;
      this.lastMouseY = e.clientY;

      this.cameraYaw -= dx * 0.005;
      this.cameraPitch = Math.max(0.08, Math.min(1.1, this.cameraPitch + dy * 0.004));
    });

    window.addEventListener('mouseup', () => {
      this.isMouseDown = false;
    });
  }

  setupJoystickControls() {
    const zone = document.getElementById('joystick-zone');
    const base = document.getElementById('joystick-base');
    const thumb = document.getElementById('joystick-thumb');
    if (!zone || !base || !thumb) return;

    const maxRadius = 45; // Max joystick thumb travel in pixels
    let baseRect = null;

    const onTouchStart = (e) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        if (this.joystickTouchId === null) {
          this.joystickTouchId = touch.identifier;
          baseRect = base.getBoundingClientRect();
          updateJoystick(touch.clientX, touch.clientY);
          this.vibrate(15);
          break;
        }
      }
    };

    const onTouchMove = (e) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        if (touch.identifier === this.joystickTouchId) {
          updateJoystick(touch.clientX, touch.clientY);
          break;
        }
      }
    };

    const onTouchEnd = (e) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        if (touch.identifier === this.joystickTouchId) {
          this.joystickTouchId = null;
          this.moveVector.set(0, 0);
          thumb.style.transform = `translate(0px, 0px)`;
          break;
        }
      }
    };

    const updateJoystick = (clientX, clientY) => {
      if (!baseRect) baseRect = base.getBoundingClientRect();
      const centerX = baseRect.left + baseRect.width / 2;
      const centerY = baseRect.top + baseRect.height / 2;

      let dx = clientX - centerX;
      let dy = clientY - centerY;
      const dist = Math.hypot(dx, dy);

      if (dist > maxRadius) {
        dx = (dx / dist) * maxRadius;
        dy = (dy / dist) * maxRadius;
      }

      thumb.style.transform = `translate(${dx}px, ${dy}px)`;

      // Normalize output (-1 to 1). Note: dy inverted for 3D forward
      this.moveVector.x = dx / maxRadius;
      this.moveVector.y = -dy / maxRadius;
    };

    zone.addEventListener('touchstart', onTouchStart, { passive: false });
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd, { passive: false });
    window.addEventListener('touchcancel', onTouchEnd, { passive: false });
  }

  setupCameraTouchListeners() {
    // Touch swipe anywhere on right side of screen rotates camera
    window.addEventListener('touchstart', (e) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        // Check if touch is on right half and not on buttons
        const isRightHalf = touch.clientX > window.innerWidth * 0.35;
        const isInteractive = e.target.closest('button, .modal-sheet, .dialogue-card, .interact-prompt-card, #joystick-zone');

        if (isRightHalf && !isInteractive && this.cameraTouchId === null) {
          this.cameraTouchId = touch.identifier;
          this.lastTouchLookX = touch.clientX;
          this.lastTouchLookY = touch.clientY;
        }
      }
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        if (touch.identifier === this.cameraTouchId) {
          const dx = touch.clientX - this.lastTouchLookX;
          const dy = touch.clientY - this.lastTouchLookY;
          this.lastTouchLookX = touch.clientX;
          this.lastTouchLookY = touch.clientY;

          this.cameraYaw -= dx * 0.007;
          this.cameraPitch = Math.max(0.08, Math.min(1.1, this.cameraPitch + dy * 0.005));
        }
      }
    }, { passive: true });

    const endCameraTouch = (e) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === this.cameraTouchId) {
          this.cameraTouchId = null;
        }
      }
    };

    window.addEventListener('touchend', endCameraTouch);
    window.addEventListener('touchcancel', endCameraTouch);
  }

  setupActionButtons() {
    // Jump Button
    const btnJump = document.getElementById('btn-mobile-jump');
    if (btnJump) {
      btnJump.addEventListener('touchstart', (e) => {
        e.preventDefault();
        this.isJumpPressed = true;
        this.vibrate(20);
      });
      btnJump.addEventListener('touchend', () => {
        this.isJumpPressed = false;
      });
      btnJump.addEventListener('mousedown', () => {
        this.isJumpPressed = true;
      });
      btnJump.addEventListener('mouseup', () => {
        this.isJumpPressed = false;
      });
    }

    // Attack Button
    const btnAttack = document.getElementById('btn-mobile-attack');
    if (btnAttack) {
      const triggerAttack = (e) => {
        if (e) e.preventDefault();
        this.isAttackPressed = true;
        this.vibrate(30);
      };
      btnAttack.addEventListener('touchstart', triggerAttack);
      btnAttack.addEventListener('mousedown', triggerAttack);
      btnAttack.addEventListener('touchend', () => { this.isAttackPressed = false; });
      btnAttack.addEventListener('mouseup', () => { this.isAttackPressed = false; });
    }

    // Interact Button
    const btnInteract = document.getElementById('btn-mobile-interact');
    const promptCard = document.getElementById('interact-prompt');

    const triggerInteract = (e) => {
      if (e) e.preventDefault();
      this.isInteractPressed = true;
      this.vibrate(25);
      setTimeout(() => {
        this.isInteractPressed = false;
      }, 150);
    };

    if (btnInteract) {
      btnInteract.addEventListener('click', triggerInteract);
      btnInteract.addEventListener('touchstart', triggerInteract);
    }
    if (promptCard) {
      promptCard.addEventListener('click', triggerInteract);
      promptCard.addEventListener('touchstart', triggerInteract);
    }
  }

  // Get combined keyboard + joystick direction
  getMoveDirection() {
    let x = this.moveVector.x;
    let y = this.moveVector.y;

    // Add keyboard inputs
    if (this.keys.forward) y += 1;
    if (this.keys.backward) y -= 1;
    if (this.keys.left) x -= 1;
    if (this.keys.right) x += 1;

    // Clamp length
    const len = Math.hypot(x, y);
    if (len > 1.0) {
      x /= len;
      y /= len;
    }

    return { x, y };
  }

  // Check and consume jump trigger
  consumeJump() {
    if (this.isJumpPressed) {
      this.isJumpPressed = false;
      return true;
    }
    return false;
  }

  // Check and consume attack trigger
  consumeAttack() {
    if (this.isAttackPressed) {
      this.isAttackPressed = false;
      return true;
    }
    return false;
  }

  // Check and consume interact trigger
  consumeInteract() {
    if (this.isInteractPressed) {
      this.isInteractPressed = false;
      return true;
    }
    return false;
  }
}
