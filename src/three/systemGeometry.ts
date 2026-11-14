import * as THREE from 'three';
import {
  ConfiguratorState,
  HARDWARE_COLORS,
  GLASS_TINTS,
  HardwareColorId,
  GlassTintId,
  BalconyLayout,
  WeatherSimulation,
} from '../types/configurator';
import {
  createFloorTexture,
  createBrushedBumpMap,
  createSafetyStampTexture,
  createRadialShadowTexture,
} from './proceduralTextures';

export interface PanelMeshNode {
  group: THREE.Group;
  wing: 'main' | 'side' | 'side2';
  index: number;
  width: number;
  height: number;
  glassMesh: THREE.Mesh;
  topClampMesh: THREE.Mesh;
  bottomClampMesh: THREE.Mesh;
  rollerGroup: THREE.Group;
  shadowMesh: THREE.Mesh;
}

export class System3DModel {
  public rootGroup: THREE.Group;
  public frameGroup: THREE.Group;
  public panelsGroup: THREE.Group;
  public environmentGroup: THREE.Group;
  public gridGroup: THREE.Group;

  public mainPanels: PanelMeshNode[] = [];
  public sidePanels: PanelMeshNode[] = [];
  public allPanels: PanelMeshNode[] = [];

  // Shared reusable materials & textures
  private glassMaterial: THREE.MeshPhysicalMaterial;
  private hardwareMaterial: THREE.MeshStandardMaterial;
  private rubberMaterial: THREE.MeshStandardMaterial;
  private stainlessMaterial: THREE.MeshStandardMaterial;
  private rollerWheelMaterial: THREE.MeshStandardMaterial;
  private stampMaterial: THREE.MeshBasicMaterial;
  private shadowMaterial: THREE.MeshBasicMaterial;
  private axisLineMaterial: THREE.LineBasicMaterial;
  private floorMaterial: THREE.MeshStandardMaterial | null = null;

  private brushedBumpMap: THREE.CanvasTexture;
  private safetyStampTexture: THREE.CanvasTexture;
  private radialShadowTexture: THREE.CanvasTexture;

  private isSoftwareGl: boolean;
  private renderer?: THREE.WebGLRenderer;

  constructor(isSoftwareGl: boolean, renderer?: THREE.WebGLRenderer) {
    this.isSoftwareGl = isSoftwareGl;
    this.renderer = renderer;

    this.rootGroup = new THREE.Group();
    this.rootGroup.name = 'TabrizSecuritRoot';

    this.environmentGroup = new THREE.Group();
    this.frameGroup = new THREE.Group();
    this.panelsGroup = new THREE.Group();
    this.gridGroup = new THREE.Group();

    this.rootGroup.add(this.environmentGroup);
    this.rootGroup.add(this.gridGroup);
    this.rootGroup.add(this.frameGroup);
    this.rootGroup.add(this.panelsGroup);

    // Initialize textures
    this.brushedBumpMap = createBrushedBumpMap();
    this.safetyStampTexture = createSafetyStampTexture();
    this.radialShadowTexture = createRadialShadowTexture();

    // Base materials
    this.rubberMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a1e24,
      roughness: 0.9,
      metalness: 0.1,
    });

    this.stainlessMaterial = new THREE.MeshStandardMaterial({
      color: 0xe0e0e0,
      metalness: 0.95,
      roughness: 0.14,
      bumpMap: this.brushedBumpMap,
      bumpScale: 0.003,
    });

    this.rollerWheelMaterial = new THREE.MeshStandardMaterial({
      color: 0x22242a,
      roughness: 0.45,
      metalness: 0.2,
    });

    this.stampMaterial = new THREE.MeshBasicMaterial({
      map: this.safetyStampTexture,
      transparent: true,
      opacity: 0.75,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    });

    this.shadowMaterial = new THREE.MeshBasicMaterial({
      map: this.radialShadowTexture,
      transparent: true,
      opacity: 0.35,
      depthWrite: false,
    });

    this.hardwareMaterial = new THREE.MeshStandardMaterial({
      bumpMap: this.brushedBumpMap,
      bumpScale: 0.003,
    });

    this.axisLineMaterial = new THREE.LineBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.45,
    });

    // PBR Glass Material configuration
    this.glassMaterial = new THREE.MeshPhysicalMaterial({
      roughness: 0.03,
      metalness: 0.0,
      ior: 1.53,
      thickness: 0.015,
      clearcoat: 1.0,
      clearcoatRoughness: 0.04,
      reflectivity: 0.92,
      transparent: true,
      depthWrite: false,
      transmission: this.isSoftwareGl ? 0 : 0.90,
      opacity: this.isSoftwareGl ? 0.3 : 1.0,
    });

    this.buildSurroundingEnvironment();
    this.buildEngineeringGrid();
  }

  /**
   * Builds architectural environment
   */
  private buildSurroundingEnvironment() {
    this.environmentGroup.clear();

    const { map: floorMap, roughnessMap: floorRough } = createFloorTexture(this.renderer);

    const floorGeo = new THREE.PlaneGeometry(24, 20);
    const floorMat = new THREE.MeshStandardMaterial({
      map: floorMap,
      roughnessMap: floorRough,
      roughness: 0.38,
      metalness: 0.1,
    });
    this.floorMaterial = floorMat;
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.position.set(0, -0.01, 1.5);
    floorMesh.receiveShadow = !this.isSoftwareGl;
    this.environmentGroup.add(floorMesh);

    // Ceiling / Soffit slab above
    const ceilingGeo = new THREE.PlaneGeometry(24, 20);
    const ceilingMat = new THREE.MeshStandardMaterial({
      color: 0x181c22,
      roughness: 0.85,
      metalness: 0.05,
    });
    const ceilingMesh = new THREE.Mesh(ceilingGeo, ceilingMat);
    ceilingMesh.rotation.x = Math.PI / 2;
    ceilingMesh.position.set(0, 3.5, 1.5);
    this.environmentGroup.add(ceilingMesh);
  }

  /**
   * Builds the datum grid lines on the floor as seen in the CamBalkon-3D video
   */
  public buildEngineeringGrid() {
    this.gridGroup.clear();

    // Floor coordinate grid lines (inspired by CamBalkon-3D video background)
    const size = 16;
    const divisions = 32;
    const gridHelper = new THREE.GridHelper(size, divisions, 0x0284c7, 0x1e293b);
    gridHelper.position.y = 0.001;
    this.gridGroup.add(gridHelper);

    // Main axis lines intersecting at the corner / center
    const pointsX = [new THREE.Vector3(-8, 0.003, 0), new THREE.Vector3(8, 0.003, 0)];
    const geomX = new THREE.BufferGeometry().setFromPoints(pointsX);
    const lineX = new THREE.Line(geomX, this.axisLineMaterial);
    this.gridGroup.add(lineX);

    const pointsZ = [new THREE.Vector3(0, 0.003, -8), new THREE.Vector3(0, 0.003, 8)];
    const geomZ = new THREE.BufferGeometry().setFromPoints(pointsZ);
    const lineZ = new THREE.Line(geomZ, this.axisLineMaterial);
    this.gridGroup.add(lineZ);
  }

  /**
   * Rebuilds the frame profile (header rail, bottom track, jambs, corner post)
   */
  public updateFrame(state: ConfiguratorState) {
    this.frameGroup.clear();

    const mainWidthM = state.widthCm / 100;
    const sideWidthM = state.sideWingWidthCm / 100;
    const heightM = state.heightCm / 100;
    const numTracks = state.systemType === 'sliding' ? state.panelCount : 1;
    const trackDepth = state.systemType === 'sliding' ? Math.max(0.08, numTracks * 0.032) : 0.075;
    const headerHeight = 0.085;
    const floorTrackHeight = state.recessedFloorTrack ? 0.012 : 0.038;
    const jambWidth = 0.045;
    const jambHeight = heightM - headerHeight - floorTrackHeight;

    const isL = state.balconyLayout === 'l_shape';
    const isU = state.balconyLayout === 'u_shape';

    // 1. MAIN WING (Front rail along X)
    const headerGeo = new THREE.BoxGeometry(mainWidthM + (isL ? 0.03 : 0.06), headerHeight, trackDepth);
    const mainHeader = new THREE.Mesh(headerGeo, this.hardwareMaterial);
    mainHeader.position.set(0, heightM - headerHeight / 2, 0);
    mainHeader.castShadow = !this.isSoftwareGl;
    this.frameGroup.add(mainHeader);

    // Exit guide notch (CamBalkon exit gate where rollers pivot 90 degrees)
    const exitGuideGeo = new THREE.BoxGeometry(0.06, 0.015, trackDepth * 0.9);
    const exitGuide = new THREE.Mesh(exitGuideGeo, this.stainlessMaterial);
    exitGuide.position.set(-mainWidthM / 2 + 0.08, heightM - headerHeight - 0.006, 0);
    this.frameGroup.add(exitGuide);

    // Main floor track
    const floorTrackGeo = new THREE.BoxGeometry(mainWidthM + (isL ? 0.03 : 0.06), floorTrackHeight, trackDepth);
    const mainFloorTrack = new THREE.Mesh(floorTrackGeo, this.hardwareMaterial);
    mainFloorTrack.position.set(0, floorTrackHeight / 2, 0);
    mainFloorTrack.receiveShadow = !this.isSoftwareGl;
    this.frameGroup.add(mainFloorTrack);

    // Left Jamb (Wall side)
    const leftJambGeo = new THREE.BoxGeometry(jambWidth, jambHeight, trackDepth);
    const leftJamb = new THREE.Mesh(leftJambGeo, this.hardwareMaterial);
    leftJamb.position.set(-mainWidthM / 2 - jambWidth / 2, floorTrackHeight + jambHeight / 2, 0);
    this.frameGroup.add(leftJamb);

    if (!isL && !isU) {
      // Straight layout: standard right jamb
      const rightJamb = new THREE.Mesh(leftJambGeo, this.hardwareMaterial);
      rightJamb.position.set(mainWidthM / 2 + jambWidth / 2, floorTrackHeight + jambHeight / 2, 0);
      this.frameGroup.add(rightJamb);
    } else {
      // L-SHAPE / CORNER BALCONY (As in the video!)
      // Right corner profile connecting Main Wing and Side Wing at 90 degrees
      const cornerPosX = mainWidthM / 2;
      const cornerPosZ = 0;

      // 90-degree Corner Post Profile (ستون نبش اختصاصی شیشه بالکن تبریز سکوریت)
      const cornerPostGeo = new THREE.BoxGeometry(trackDepth, heightM, trackDepth);
      const cornerPost = new THREE.Mesh(cornerPostGeo, this.hardwareMaterial);
      cornerPost.position.set(cornerPosX, heightM / 2, cornerPosZ);
      this.frameGroup.add(cornerPost);

      // 2. SIDE WING (Return wing along Z axis)
      const sideHeaderGeo = new THREE.BoxGeometry(trackDepth, headerHeight, sideWidthM);
      const sideHeader = new THREE.Mesh(sideHeaderGeo, this.hardwareMaterial);
      sideHeader.position.set(cornerPosX, heightM - headerHeight / 2, sideWidthM / 2);
      this.frameGroup.add(sideHeader);

      const sideFloorTrackGeo = new THREE.BoxGeometry(trackDepth, floorTrackHeight, sideWidthM);
      const sideFloorTrack = new THREE.Mesh(sideFloorTrackGeo, this.hardwareMaterial);
      sideFloorTrack.position.set(cornerPosX, floorTrackHeight / 2, sideWidthM / 2);
      this.frameGroup.add(sideFloorTrack);

      // Side wing far jamb at the wall (Z = sideWidthM)
      const sideFarJamb = new THREE.Mesh(new THREE.BoxGeometry(trackDepth, jambHeight, jambWidth), this.hardwareMaterial);
      sideFarJamb.position.set(cornerPosX, floorTrackHeight + jambHeight / 2, sideWidthM + jambWidth / 2);
      this.frameGroup.add(sideFarJamb);

      if (isU) {
        // U-Shape: Add Left Side Wing too
        const leftCornerX = -mainWidthM / 2;
        const leftCornerPost = new THREE.Mesh(cornerPostGeo, this.hardwareMaterial);
        leftCornerPost.position.set(leftCornerX, heightM / 2, 0);
        this.frameGroup.add(leftCornerPost);

        const leftSideHeader = new THREE.Mesh(sideHeaderGeo, this.hardwareMaterial);
        leftSideHeader.position.set(leftCornerX, heightM - headerHeight / 2, sideWidthM / 2);
        this.frameGroup.add(leftSideHeader);

        const leftSideFloorTrack = new THREE.Mesh(sideFloorTrackGeo, this.hardwareMaterial);
        leftSideFloorTrack.position.set(leftCornerX, floorTrackHeight / 2, sideWidthM / 2);
        this.frameGroup.add(leftSideFloorTrack);

        const leftSideFarJamb = new THREE.Mesh(new THREE.BoxGeometry(trackDepth, jambHeight, jambWidth), this.hardwareMaterial);
        leftSideFarJamb.position.set(leftCornerX, floorTrackHeight + jambHeight / 2, sideWidthM + jambWidth / 2);
        this.frameGroup.add(leftSideFarJamb);
      }
    }
  }

  /**
   * Recreates glass panels for Main Wing and Side Wings
   */
  public rebuildPanels(state: ConfiguratorState) {
    this.panelsGroup.clear();
    this.mainPanels = [];
    this.sidePanels = [];
    this.allPanels = [];

    const mainWidthM = state.widthCm / 100;
    const sideWidthM = state.sideWingWidthCm / 100;
    const totalHeightM = state.heightCm / 100;
    const mainCount = state.panelCount;
    const sideCount = state.sideWingPanels;

    const headerHeight = 0.085;
    const floorTrackHeight = state.recessedFloorTrack ? 0.012 : 0.038;
    const availableHeight = totalHeightM - headerHeight - floorTrackHeight;
    const glassThicknessM = state.glassThickness / 1000;
    const clampHeight = 0.065;

    // Build Main Wing Panels
    const mainOverlap = state.systemType === 'sliding' ? 0.035 : 0.003;
    const mainPanelWidth = (mainWidthM + (mainCount - 1) * mainOverlap) / mainCount;

    for (let i = 0; i < mainCount; i++) {
      const panel = this.createPanelNode({
        wing: 'main',
        index: i,
        width: mainPanelWidth,
        availableHeight,
        floorTrackHeight,
        clampHeight,
        glassThicknessM,
        state,
        isFirstOrLast: i === 0 || i === mainCount - 1,
      });
      this.panelsGroup.add(panel.group);
      this.mainPanels.push(panel);
      this.allPanels.push(panel);
    }

    // Build Side Wing Panels if L-shape or U-shape (As in video!)
    if (state.balconyLayout === 'l_shape' || state.balconyLayout === 'u_shape') {
      const sidePanelWidth = (sideWidthM + (sideCount - 1) * mainOverlap) / sideCount;
      const cornerX = mainWidthM / 2;

      for (let j = 0; j < sideCount; j++) {
        const panel = this.createPanelNode({
          wing: 'side',
          index: j,
          width: sidePanelWidth,
          availableHeight,
          floorTrackHeight,
          clampHeight,
          glassThicknessM,
          state,
          isFirstOrLast: j === 0 || j === sideCount - 1,
        });

        // Rotate 90 degrees to align along Z axis
        panel.group.rotation.y = Math.PI / 2;
        panel.group.position.x = cornerX;
        this.panelsGroup.add(panel.group);
        this.sidePanels.push(panel);
        this.allPanels.push(panel);
      }
    }
  }

  /**
   * Helper to construct an individual composite 3-12 part glass panel
   */
  private createPanelNode(params: {
    wing: 'main' | 'side' | 'side2';
    index: number;
    width: number;
    availableHeight: number;
    floorTrackHeight: number;
    clampHeight: number;
    glassThicknessM: number;
    state: ConfiguratorState;
    isFirstOrLast: boolean;
  }): PanelMeshNode {
    const { wing, index, width, availableHeight, floorTrackHeight, clampHeight, glassThicknessM, state, isFirstOrLast } = params;

    const panelGroup = new THREE.Group();
    panelGroup.name = `Panel_${wing}_${index + 1}`;

    // 1. Primary Component: Tempered Glass Slab with chamfered look
    const glassHeight = availableHeight - clampHeight * 1.8;
    const glassGeo = new THREE.BoxGeometry(width - 0.008, glassHeight, glassThicknessM);
    const glassMesh = new THREE.Mesh(glassGeo, this.glassMaterial);
    glassMesh.position.set(0, floorTrackHeight + clampHeight + glassHeight / 2, 0);
    glassMesh.castShadow = !this.isSoftwareGl;
    glassMesh.receiveShadow = !this.isSoftwareGl;
    panelGroup.add(glassMesh);

    // 2. Secondary Component: Top Clamping Profile
    const clampWidth = width - 0.005;
    const clampGeo = new THREE.BoxGeometry(clampWidth, clampHeight, 0.032);
    const topClampMesh = new THREE.Mesh(clampGeo, this.hardwareMaterial);
    topClampMesh.position.set(0, floorTrackHeight + clampHeight + glassHeight + clampHeight / 2 - 0.004, 0);
    panelGroup.add(topClampMesh);

    // 3. Secondary Component: Bottom Clamping Shoe Profile
    const bottomClampMesh = new THREE.Mesh(clampGeo, this.hardwareMaterial);
    bottomClampMesh.position.set(0, floorTrackHeight + clampHeight / 2 + 0.004, 0);
    panelGroup.add(bottomClampMesh);

    // 4. Accent Detail: Carriage Roller Assembly
    const rollerGroup = new THREE.Group();
    const rollerShaftGeo = new THREE.CylinderGeometry(0.005, 0.005, 0.032, 12);
    const wheelGeo = new THREE.CylinderGeometry(0.013, 0.013, 0.008, 16);
    const rollerOffset = width * 0.28;

    [-rollerOffset, rollerOffset].forEach((rx) => {
      const pin = new THREE.Mesh(rollerShaftGeo, this.stainlessMaterial);
      pin.position.set(rx, floorTrackHeight + clampHeight + glassHeight + clampHeight + 0.016, 0);
      rollerGroup.add(pin);

      [-0.011, 0.011].forEach((wz) => {
        const wheel = new THREE.Mesh(wheelGeo, this.rollerWheelMaterial);
        wheel.rotation.x = Math.PI / 2;
        wheel.position.set(rx, floorTrackHeight + clampHeight + glassHeight + clampHeight + 0.026, wz);
        rollerGroup.add(wheel);
      });
    });
    panelGroup.add(rollerGroup);

    // 5. Accent Detail: Clear Polycarbonate vertical H-seal gasket
    const gasketGeo = new THREE.BoxGeometry(0.006, glassHeight, 0.014);
    const gasketMat = new THREE.MeshStandardMaterial({
      color: 0x88ccee,
      transparent: true,
      opacity: 0.45,
      roughness: 0.25,
      metalness: 0.1,
    });
    const rightGasket = new THREE.Mesh(gasketGeo, gasketMat);
    rightGasket.position.set((width - 0.008) / 2 + 0.003, floorTrackHeight + clampHeight + glassHeight / 2, 0);
    panelGroup.add(rightGasket);

    // 6. Accent Detail: Tabriz Securit Laser Etched Safety Stamp
    const stampGeo = new THREE.PlaneGeometry(0.08, 0.04);
    const stampMesh = new THREE.Mesh(stampGeo, this.stampMaterial);
    stampMesh.position.set(-width / 2 + 0.07, floorTrackHeight + clampHeight + 0.05, glassThicknessM / 2 + 0.001);
    panelGroup.add(stampMesh);

    // 7. Contact shadow mesh
    const shadowGeo = new THREE.PlaneGeometry(width * 1.1, 0.22);
    const shadowMesh = new THREE.Mesh(shadowGeo, this.shadowMaterial);
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.position.set(0, 0.002, 0);
    panelGroup.add(shadowMesh);

    return {
      group: panelGroup,
      wing,
      index,
      width,
      height: availableHeight,
      glassMesh,
      topClampMesh,
      bottomClampMesh,
      rollerGroup,
      shadowMesh,
    };
  }

  /**
   * Updates materials for hardware and glass reacting dynamically to weather conditions
   */
  public updateMaterials(hardwareId: HardwareColorId, glassId: GlassTintId, weather: WeatherSimulation = 'sunny') {
    const hw = HARDWARE_COLORS[hardwareId];
    if (hw) {
      this.hardwareMaterial.color.set(hw.hex);
      this.hardwareMaterial.metalness = hw.metalness;
      this.hardwareMaterial.roughness = hw.roughness;
      this.hardwareMaterial.needsUpdate = true;
    }

    const gt = GLASS_TINTS[glassId];
    if (gt) {
      this.glassMaterial.color.set(gt.color);
      this.glassMaterial.ior = gt.ior;
      this.glassMaterial.metalness = gt.metalness ?? 0.0;
      this.glassMaterial.reflectivity = gt.reflectivity ?? 0.95;

      // Realistic physical glass reaction to weather conditions and material specs
      if (weather === 'rainy') {
        // Rainy: Microscopic water film and condensation droplets
        this.glassMaterial.roughness = Math.max(gt.roughness + 0.045, 0.075);
        this.glassMaterial.clearcoat = gt.clearcoat !== undefined ? Math.min(1.0, gt.clearcoat + 0.05) : 1.0;
        this.glassMaterial.clearcoatRoughness = Math.max(0.06, (gt.clearcoatRoughness ?? 0.04) + 0.04);
        this.glassMaterial.reflectivity = Math.min(1.0, (gt.reflectivity ?? 0.95) + 0.05);

        if (this.isSoftwareGl) {
          this.glassMaterial.transmission = 0;
          this.glassMaterial.opacity = Math.min(0.85, gt.opacity + 0.15);
        } else {
          this.glassMaterial.transmission = Math.max(0.20, gt.transmission - 0.08);
          this.glassMaterial.opacity = 1.0;
        }
      } else if (weather === 'cloudy') {
        // Cloudy: Diffuse overcast sky, soft reflections, maximum clarity
        this.glassMaterial.roughness = Math.max(gt.roughness + 0.02, 0.045);
        this.glassMaterial.clearcoat = gt.clearcoat !== undefined ? gt.clearcoat * 0.75 : 0.65;
        this.glassMaterial.clearcoatRoughness = Math.max(0.1, (gt.clearcoatRoughness ?? 0.04) + 0.08);
        this.glassMaterial.reflectivity = Math.max(0.2, (gt.reflectivity ?? 0.95) * 0.75);

        if (this.isSoftwareGl) {
          this.glassMaterial.transmission = 0;
          this.glassMaterial.opacity = Math.max(0.20, gt.opacity - 0.04);
        } else {
          this.glassMaterial.transmission = Math.min(0.98, gt.transmission + 0.02);
          this.glassMaterial.opacity = 1.0;
        }
      } else {
        // Sunny: Direct sunlight with sharp specular reflections and crystal transparency
        this.glassMaterial.roughness = gt.roughness;
        this.glassMaterial.clearcoat = gt.clearcoat ?? 1.0;
        this.glassMaterial.clearcoatRoughness = gt.clearcoatRoughness ?? 0.035;
        this.glassMaterial.reflectivity = gt.reflectivity ?? 0.95;

        if (this.isSoftwareGl) {
          this.glassMaterial.transmission = 0;
          this.glassMaterial.opacity = gt.opacity;
        } else {
          this.glassMaterial.transmission = gt.transmission;
          this.glassMaterial.opacity = 1.0;
        }
      }

      this.glassMaterial.needsUpdate = true;
    }

    // Dynamic ground/floor wetness reflection reacting to weather
    if (this.floorMaterial) {
      if (weather === 'rainy') {
        // Wet terrace tiles: glossy wet puddles reflecting balcony and lights
        this.floorMaterial.roughness = 0.14;
        this.floorMaterial.metalness = 0.28;
      } else if (weather === 'cloudy') {
        // Overcast dry diffused floor
        this.floorMaterial.roughness = 0.52;
        this.floorMaterial.metalness = 0.05;
      } else {
        // Sunny clean dry architectural ceramic floor
        this.floorMaterial.roughness = 0.38;
        this.floorMaterial.metalness = 0.1;
      }
      this.floorMaterial.needsUpdate = true;
    }
  }

  public setGridVisibility(visible: boolean) {
    this.gridGroup.visible = visible;
  }

  public dispose() {
    this.glassMaterial.dispose();
    this.hardwareMaterial.dispose();
    this.rubberMaterial.dispose();
    this.stainlessMaterial.dispose();
    this.rollerWheelMaterial.dispose();
    this.stampMaterial.dispose();
    this.shadowMaterial.dispose();
    this.axisLineMaterial.dispose();
    if (this.floorMaterial) {
      this.floorMaterial.dispose();
    }
    this.brushedBumpMap.dispose();
    this.safetyStampTexture.dispose();
    this.radialShadowTexture.dispose();
  }
}
