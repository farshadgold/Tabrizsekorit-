import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { ConfiguratorState, CameraPreset, EnvironmentPreset, LightingCondition, WeatherSimulation } from '../types/configurator';
import { System3DModel } from './systemGeometry';
import { KinematicsEngine } from './kinematics';

function createRainDropTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 16;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const gradient = ctx.createLinearGradient(8, 0, 8, 64);
    gradient.addColorStop(0, 'rgba(180, 220, 255, 0)');
    gradient.addColorStop(0.5, 'rgba(180, 225, 255, 0.45)');
    gradient.addColorStop(1, 'rgba(235, 248, 255, 0.95)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.ellipse(8, 32, 3, 28, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export class SceneManager {
  private container: HTMLDivElement;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private controls: OrbitControls;

  private systemModel: System3DModel;
  private kinematics: KinematicsEngine;

  private keyLight: THREE.DirectionalLight;
  private fillLight: THREE.DirectionalLight;
  private hemiLight: THREE.HemisphereLight;
  private envMapTexture: THREE.Texture | null = null;

  // Rain particle system for weather simulation
  private rainGroup: THREE.Group;
  private rainPoints: THREE.Points | null = null;
  private rainPositions: Float32Array | null = null;
  private rainCount: number = 1800;
  private rainTexture: THREE.CanvasTexture | null = null;

  public isSoftwareGl: boolean;
  private frameId: number = 0;
  private lastTime: number = 0;

  // Smoothed animation variables
  private currentProgress: number = 0;
  private targetProgress: number = 0;
  private animDirection: number = 1;
  private cachedState: ConfiguratorState | null = null;

  // Camera transition targets
  private targetCamPos = new THREE.Vector3();
  private targetLookAt = new THREE.Vector3();
  private isTransitioningCam = false;

  private onProgressUpdate?: (progress: number) => void;

  constructor(container: HTMLDivElement, onProgressUpdate?: (progress: number) => void) {
    this.container = container;
    this.onProgressUpdate = onProgressUpdate;

    // Detect Software WebGL safely according to Three.js skill
    this.isSoftwareGl = (() => {
      try {
        const gl = document.createElement('canvas').getContext('webgl2');
        if (!gl) return true;
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
        const gpu = String(gl.getParameter(param));
        gl.getExtension('WEBGL_lose_context')?.loseContext();
        return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      } catch {
        return false;
      }
    })();

    // 1. Renderer setup
    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: true,
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.setPixelRatio(this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.setSize(container.clientWidth, container.clientHeight);

    container.appendChild(this.renderer.domElement);

    // 2. Scene setup
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0e1217);
    this.scene.fog = new THREE.FogExp2(0x0e1217, 0.038);

    // 3. Camera setup
    const aspect = container.clientWidth / container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(40, aspect, 0.1, 100);
    this.camera.position.set(3.5, 2.2, 5.2);

    // 4. OrbitControls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.maxPolarAngle = Math.PI / 2 - 0.02;
    this.controls.minDistance = 1.5;
    this.controls.maxDistance = 14.0;
    this.controls.target.set(0, 1.2, 0);

    this.controls.addEventListener('start', () => {
      this.isTransitioningCam = false;
    });

    // 5. Studio Environment Lighting
    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    pmremGenerator.compileEquirectangularShader();
    const roomEnv = new RoomEnvironment();
    this.envMapTexture = pmremGenerator.fromScene(roomEnv, 0.04).texture;
    this.scene.environment = this.envMapTexture;
    pmremGenerator.dispose();

    // 6. Balanced 3-Point Lighting Rig
    this.keyLight = new THREE.DirectionalLight(0xfff6ea, 2.4);
    this.keyLight.position.set(5.0, 7.0, 5.5);
    this.keyLight.castShadow = !this.isSoftwareGl;
    this.keyLight.shadow.mapSize.width = 2048;
    this.keyLight.shadow.mapSize.height = 2048;
    this.keyLight.shadow.bias = -0.0003;
    this.keyLight.shadow.normalBias = 0.02;
    this.keyLight.shadow.camera.near = 0.5;
    this.keyLight.shadow.camera.far = 20;
    this.keyLight.shadow.camera.left = -5.5;
    this.keyLight.shadow.camera.right = 5.5;
    this.keyLight.shadow.camera.top = 5.0;
    this.keyLight.shadow.camera.bottom = -1.0;
    this.scene.add(this.keyLight);

    this.fillLight = new THREE.DirectionalLight(0xc8dcfa, 1.2);
    this.fillLight.position.set(-4.5, 4.0, -3.5);
    this.scene.add(this.fillLight);

    this.hemiLight = new THREE.HemisphereLight(0xd4e5ff, 0x1a202c, 0.95);
    this.hemiLight.position.set(0, 8, 0);
    this.scene.add(this.hemiLight);

    // 7. Initialize Kinematics & 3D Model
    this.kinematics = new KinematicsEngine();
    this.systemModel = new System3DModel(this.isSoftwareGl, this.renderer);
    this.scene.add(this.systemModel.rootGroup);

    // 8. Rain Simulation Particle System
    this.rainGroup = new THREE.Group();
    this.rainGroup.name = 'RainSimulation';
    this.rainGroup.visible = false;
    this.initRainParticles();
    this.scene.add(this.rainGroup);

    window.addEventListener('resize', this.onResize);

    this.startLoop();
  }

  private initRainParticles() {
    this.rainTexture = createRainDropTexture();
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(this.rainCount * 3);
    for (let i = 0; i < this.rainCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 16;
      positions[i * 3 + 1] = Math.random() * 6.5;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 12 + 1.0;
    }
    this.rainPositions = positions;
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const mat = new THREE.PointsMaterial({
      color: 0xcde8ff,
      size: 0.28,
      map: this.rainTexture,
      transparent: true,
      opacity: 0.75,
      depthWrite: false,
      blending: THREE.NormalBlending,
    });

    this.rainPoints = new THREE.Points(geo, mat);
    this.rainGroup.add(this.rainPoints);
  }

  private onResize = () => {
    if (!this.container || !this.renderer || !this.camera) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  };

  public updateConfig(state: ConfiguratorState) {
    this.cachedState = state;
    this.targetProgress = state.openProgress;

    this.controls.autoRotate = state.autoRotate;
    this.controls.autoRotateSpeed = 1.0;

    // Update 3D Geometry and weather-reactive materials
    this.systemModel.updateFrame(state);
    this.systemModel.rebuildPanels(state);
    this.systemModel.updateMaterials(state.hardwareColor, state.glassTint, state.weather);
    this.systemModel.setGridVisibility(state.showFloorGrid);

    // Toggle active rain particle simulation
    this.rainGroup.visible = state.weather === 'rainy';

    // Apply lighting condition (Morning, Noon, Sunset, Night) with weather simulation
    this.applyLightingCondition(state.lightingCondition, state.environment, state.weather);

    // Apply kinematics immediately to both wings
    this.kinematics.updateAllPanels(
      this.systemModel.mainPanels,
      this.systemModel.sidePanels,
      state,
      this.currentProgress
    );
  }

  /**
   * Applies precise sun angles, light color temperatures, sky atmosphere,
   * and weather simulations (sunny, rainy, cloudy) to create realistic reflections on the glass panels.
   */
  public applyLightingCondition(
    condition: LightingCondition,
    envPreset?: EnvironmentPreset,
    weather: WeatherSimulation = 'sunny'
  ) {
    // 1. Rainy Weather Simulation
    if (weather === 'rainy') {
      // Overcast rainy atmosphere: cool diffused light, high humidity rain fog
      this.keyLight.position.set(2.0, 7.5, 3.5);
      this.keyLight.color.set(0x9fc3ea);
      this.keyLight.intensity = 1.9;

      this.fillLight.position.set(-3.5, 4.0, -2.5);
      this.fillLight.color.set(0x56728f);
      this.fillLight.intensity = 1.4;

      this.hemiLight.color.set(0x7397be);
      this.hemiLight.groundColor.set(0x19222c);
      this.hemiLight.intensity = 1.1;

      const rainBgColor = 0x141b24;
      this.scene.background = new THREE.Color(rainBgColor);
      if (this.scene.fog instanceof THREE.FogExp2) {
        this.scene.fog.color.set(rainBgColor);
        this.scene.fog.density = 0.052;
      }
      this.renderer.toneMappingExposure = 1.05;
      return;
    }

    // 2. Cloudy Weather Simulation
    if (weather === 'cloudy') {
      // Overcast cloudy atmosphere: soft pearl diffuse lighting, no harsh specular glare
      this.keyLight.position.set(1.0, 8.0, 2.0);
      this.keyLight.color.set(0xe2e8f0);
      this.keyLight.intensity = 2.2;

      this.fillLight.position.set(-3.0, 4.5, -2.5);
      this.fillLight.color.set(0x94a3b8);
      this.fillLight.intensity = 1.6;

      this.hemiLight.color.set(0xcbd5e1);
      this.hemiLight.groundColor.set(0x334155);
      this.hemiLight.intensity = 1.25;

      const cloudyBgColor = 0x202734;
      this.scene.background = new THREE.Color(cloudyBgColor);
      if (this.scene.fog instanceof THREE.FogExp2) {
        this.scene.fog.color.set(cloudyBgColor);
        this.scene.fog.density = 0.038;
      }
      this.renderer.toneMappingExposure = 1.12;
      return;
    }

    // 3. Sunny Weather (Morning, Noon, Sunset, Night)
    switch (condition) {
      case 'morning':
        // Morning: Low sun from east (elevation ~26°), warm golden-peach sunlight
        this.keyLight.position.set(6.5, 3.2, 4.8);
        this.keyLight.color.set(0xffd8a8);
        this.keyLight.intensity = 3.0;

        this.fillLight.position.set(-4.5, 3.5, -2.5);
        this.fillLight.color.set(0x9ec5ea);
        this.fillLight.intensity = 1.2;

        this.hemiLight.color.set(0xd4ebfc);
        this.hemiLight.groundColor.set(0x322415);
        this.hemiLight.intensity = 1.0;

        this.scene.background = new THREE.Color(0x151b24);
        if (this.scene.fog instanceof THREE.FogExp2) {
          this.scene.fog.color.set(0x151b24);
          this.scene.fog.density = 0.032;
        }
        this.renderer.toneMappingExposure = 1.15;
        break;

      case 'noon':
        // Noon: High steep sun directly overhead (elevation ~76°), brilliant white sunlight
        this.keyLight.position.set(1.5, 8.8, 2.2);
        this.keyLight.color.set(0xffffff);
        this.keyLight.intensity = 3.4;

        this.fillLight.position.set(-3.0, 5.0, -3.0);
        this.fillLight.color.set(0xc0d8f5);
        this.fillLight.intensity = 1.4;

        this.hemiLight.color.set(0xbae6fd);
        this.hemiLight.groundColor.set(0x243242);
        this.hemiLight.intensity = 1.15;

        const isBrightCamBalkon = envPreset === 'cambalkon_bright';
        const noonBgColor = isBrightCamBalkon ? 0xe7f0f8 : 0x101620;
        this.scene.background = new THREE.Color(noonBgColor);
        if (this.scene.fog instanceof THREE.FogExp2) {
          this.scene.fog.color.set(noonBgColor);
          this.scene.fog.density = isBrightCamBalkon ? 0.024 : 0.030;
        }
        this.renderer.toneMappingExposure = 1.08;
        break;

      case 'sunset':
        // Sunset (Golden Hour): Very low grazing sun at horizon from west (elevation ~14°)
        // Deep fiery amber-orange specular highlights and sunset reflections
        this.keyLight.position.set(-7.0, 1.8, 4.2);
        this.keyLight.color.set(0xff6c24);
        this.keyLight.intensity = 3.6;

        this.fillLight.position.set(4.5, 3.2, -4.0);
        this.fillLight.color.set(0x5d3275);
        this.fillLight.intensity = 1.0;

        this.hemiLight.color.set(0x833ab4); // Twilight magenta sky
        this.hemiLight.groundColor.set(0x3b1606); // Warm amber ground bounce
        this.hemiLight.intensity = 0.95;

        this.scene.background = new THREE.Color(0x1b0e18);
        if (this.scene.fog instanceof THREE.FogExp2) {
          this.scene.fog.color.set(0x1b0e18);
          this.scene.fog.density = 0.038;
        }
        this.renderer.toneMappingExposure = 1.25;
        break;

      case 'night':
        // Night: Cool moonlight and subtle warm architectural accent
        this.keyLight.position.set(3.0, 5.5, 3.5);
        this.keyLight.color.set(0xd8e6f8);
        this.keyLight.intensity = 1.3;

        this.fillLight.position.set(-4.0, 3.0, -2.5);
        this.fillLight.color.set(0x20355a);
        this.fillLight.intensity = 0.7;

        this.hemiLight.color.set(0x1e293b);
        this.hemiLight.groundColor.set(0x080c14);
        this.hemiLight.intensity = 0.65;

        this.scene.background = new THREE.Color(0x05070a);
        if (this.scene.fog instanceof THREE.FogExp2) {
          this.scene.fog.color.set(0x05070a);
          this.scene.fog.density = 0.048;
        }
        this.renderer.toneMappingExposure = 1.35;
        break;
    }
  }

  public applyEnvironmentPreset(preset: EnvironmentPreset) {
    if (this.cachedState) {
      this.applyLightingCondition(this.cachedState.lightingCondition, preset, this.cachedState.weather);
    }
  }

  public setCameraPreset(preset: CameraPreset, widthM: number, heightM: number) {
    this.isTransitioningCam = true;
    const centerY = heightM * 0.52;
    this.targetLookAt.set(0, centerY, 0);

    switch (preset) {
      case 'front':
        this.targetCamPos.set(0, centerY, Math.max(3.8, widthM * 1.05));
        break;
      case 'perspective':
        this.targetCamPos.set(widthM * 0.75, centerY * 1.3, Math.max(3.4, widthM * 0.95));
        break;
      case 'side':
        this.targetCamPos.set(widthM * 0.95, centerY, 0.4);
        break;
      case 'top':
        this.targetCamPos.set(0, centerY * 3.0, widthM * 0.85);
        break;
      case 'corner_view':
        // View focusing at the 90-degree corner intersection
        this.targetCamPos.set(widthM / 2 + 1.2, centerY * 1.2, 2.2);
        this.targetLookAt.set(widthM / 2, centerY * 0.8, 0.4);
        break;
      case 'close_hardware':
        this.targetCamPos.set(widthM * 0.35, heightM - 0.1, 0.85);
        this.targetLookAt.set(widthM * 0.3, heightM - 0.15, 0);
        break;
    }
  }

  private startLoop() {
    this.lastTime = performance.now();

    const tick = (now: number) => {
      const dt = Math.min((now - this.lastTime) / 1000, 0.1);
      this.lastTime = now;

      // Smoothly interpolate opening progress using exponential damping
      const progressDiff = this.targetProgress - this.currentProgress;
      if (Math.abs(progressDiff) > 0.0005) {
        this.currentProgress = THREE.MathUtils.damp(this.currentProgress, this.targetProgress, 10, dt);
        if (this.cachedState) {
          this.kinematics.updateAllPanels(
            this.systemModel.mainPanels,
            this.systemModel.sidePanels,
            this.cachedState,
            this.currentProgress
          );
        }
        if (this.onProgressUpdate) {
          this.onProgressUpdate(this.currentProgress);
        }
      }

      // Smooth camera transition
      if (this.isTransitioningCam) {
        this.camera.position.x = THREE.MathUtils.damp(this.camera.position.x, this.targetCamPos.x, 6, dt);
        this.camera.position.y = THREE.MathUtils.damp(this.camera.position.y, this.targetCamPos.y, 6, dt);
        this.camera.position.z = THREE.MathUtils.damp(this.camera.position.z, this.targetCamPos.z, 6, dt);

        this.controls.target.x = THREE.MathUtils.damp(this.controls.target.x, this.targetLookAt.x, 6, dt);
        this.controls.target.y = THREE.MathUtils.damp(this.controls.target.y, this.targetLookAt.y, 6, dt);
        this.controls.target.z = THREE.MathUtils.damp(this.controls.target.z, this.targetLookAt.z, 6, dt);

        if (this.camera.position.distanceTo(this.targetCamPos) < 0.02) {
          this.isTransitioningCam = false;
        }
      }

      // Animate falling rain streaks in rainy weather simulation
      if (this.cachedState?.weather === 'rainy' && this.rainPositions && this.rainPoints) {
        const pos = this.rainPositions;
        const fallSpeed = 13.5 * dt;
        const drift = 1.4 * dt;
        for (let i = 0; i < pos.length; i += 3) {
          pos[i + 1] -= fallSpeed; // Y drop
          pos[i] -= drift; // X slight wind drift
          if (pos[i + 1] < -0.05) {
            pos[i + 1] = 6.4;
            pos[i] = (Math.random() - 0.5) * 16;
            pos[i + 2] = (Math.random() - 0.5) * 12 + 1.0;
          }
        }
        this.rainPoints.geometry.attributes.position.needsUpdate = true;
      }

      this.controls.update();
      this.renderer.render(this.scene, this.camera);

      if (this.isSoftwareGl) {
        this.afterDraw(() => {
          this.frameId = requestAnimationFrame(tick);
        });
      } else {
        this.frameId = requestAnimationFrame(tick);
      }
    };

    this.frameId = requestAnimationFrame(tick);
  }

  private afterDraw(cb: () => void) {
    try {
      const gl = this.renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          window.setTimeout(poll, 6);
        } else {
          if (sync) gl.deleteSync(sync);
          window.setTimeout(cb, 60);
        }
      };
      window.setTimeout(poll, 6);
    } catch {
      window.setTimeout(cb, 60);
    }
  }

  public setOpenProgress(progress: number, state: ConfiguratorState) {
    this.targetProgress = Math.max(0, Math.min(1, progress));
    this.currentProgress = this.targetProgress;
    this.kinematics.updateAllPanels(
      this.systemModel.mainPanels,
      this.systemModel.sidePanels,
      state,
      this.currentProgress
    );
    if (this.onProgressUpdate) {
      this.onProgressUpdate(this.currentProgress);
    }
  }

  public stepAnimationCycle(state: ConfiguratorState, delta: number) {
    const speed = 0.32;
    let next = this.targetProgress + this.animDirection * speed * delta;
    if (next >= 1.0) {
      next = 1.0;
      this.animDirection = -1;
    } else if (next <= 0.0) {
      next = 0.0;
      this.animDirection = 1;
    }
    this.targetProgress = next;
    this.currentProgress = next;
    this.kinematics.updateAllPanels(
      this.systemModel.mainPanels,
      this.systemModel.sidePanels,
      state,
      next
    );
    if (this.onProgressUpdate) {
      this.onProgressUpdate(next);
    }
  }

  public captureScreenshot(): string {
    this.renderer.render(this.scene, this.camera);
    return this.renderer.domElement.toDataURL('image/png');
  }

  public dispose() {
    cancelAnimationFrame(this.frameId);
    window.removeEventListener('resize', this.onResize);
    this.controls.dispose();
    this.systemModel.dispose();
    if (this.envMapTexture) {
      this.envMapTexture.dispose();
    }
    if (this.rainTexture) {
      this.rainTexture.dispose();
    }
    if (this.rainPoints) {
      this.rainPoints.geometry.dispose();
      (this.rainPoints.material as THREE.Material).dispose();
    }
    this.renderer.dispose();
    if (this.renderer.domElement && this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
  }
}
