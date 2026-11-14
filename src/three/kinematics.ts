import * as THREE from 'three';
import { ConfiguratorState } from '../types/configurator';
import { PanelMeshNode } from './systemGeometry';

export class KinematicsEngine {
  /**
   * Updates all panels across main wing and side wings
   */
  public updateAllPanels(
    mainPanels: PanelMeshNode[],
    sidePanels: PanelMeshNode[],
    state: ConfiguratorState,
    currentProgress: number
  ) {
    const progress = Math.max(0, Math.min(1, currentProgress));
    const mainWidthM = state.widthCm / 100;
    const sideWidthM = state.sideWingWidthCm / 100;

    // 1. Update Main Wing Panels
    if (mainPanels.length > 0) {
      this.updateWingPanels(mainPanels, mainWidthM, state, progress, 'main');
    }

    // 2. Update Side Wing Panels (L-shape / U-shape)
    if (sidePanels.length > 0) {
      this.updateWingPanels(sidePanels, sideWidthM, state, progress, 'side');
    }
  }

  private updateWingPanels(
    panels: PanelMeshNode[],
    wingWidthM: number,
    state: ConfiguratorState,
    progress: number,
    wingType: 'main' | 'side'
  ) {
    switch (state.systemType) {
      case 'folding':
        this.updateFoldingBalconyKinematics(panels, wingWidthM, state, progress, wingType);
        break;
      case 'sliding':
        this.updateSlidingKinematics(panels, wingWidthM, state, progress, wingType);
        break;
      case 'accordion':
        this.updateAccordionKinematics(panels, wingWidthM, state, progress, wingType);
        break;
    }
  }

  /**
   * Exact CamBalkon-3D video kinematics:
   * Staged sequential opening where Panel 0 pivots open 85°, then Panel 1 slides to park station
   * and pivots, followed sequentially by each subsequent panel!
   */
  private updateFoldingBalconyKinematics(
    panels: PanelMeshNode[],
    wingWidthM: number,
    state: ConfiguratorState,
    progress: number,
    wingType: 'main' | 'side'
  ) {
    const count = panels.length;
    if (count === 0) return;

    const panelWidthM = wingWidthM / count;
    const isMain = wingType === 'main';
    const isCenterSplit = state.openingMode === 'center_split';
    const isStackRight = state.openingMode === 'stack_right';

    // Left parking station vs right parking station
    const parkLeftX = -wingWidthM / 2;
    const parkRightX = wingWidthM / 2;

    panels.forEach((p, i) => {
      // In center split mode: panels in left half stack left, right half stack right
      let targetSide: 'left' | 'right' = isStackRight ? 'right' : 'left';
      if (isCenterSplit && count > 1) {
        targetSide = i < Math.ceil(count / 2) ? 'left' : 'right';
      }

      // Closed resting position along the wing track
      const closedX = -wingWidthM / 2 + panelWidthM / 2 + i * panelWidthM;

      // Sequential timing window for this panel
      // Step size per panel
      const stepDuration = 0.85 / count;
      const startT = (i / count) * 0.75;
      const slideDuration = stepDuration * 0.6;
      const pivotDuration = stepDuration * 0.4;

      const slideEndT = startT + slideDuration;
      const pivotEndT = Math.min(1.0, slideEndT + pivotDuration);

      // Interpolation factors
      const slideFactor = THREE.MathUtils.clamp((progress - startT) / Math.max(0.001, slideDuration), 0, 1);
      const pivotFactor = THREE.MathUtils.clamp((progress - slideEndT) / Math.max(0.001, pivotDuration), 0, 1);

      // Swing angle: ~83 degrees (1.45 rad) perpendicular stacking into balcony
      const maxSwing = Math.PI * 0.46;

      if (targetSide === 'left') {
        const parkStationX = parkLeftX + panelWidthM / 2;
        const currentX = THREE.MathUtils.lerp(closedX, parkStationX, slideFactor);

        if (i === 0) {
          // Door leaf: pivots immediately from start
          const doorPivot = Math.min(1.0, progress * 2.5);
          const swingAngle = doorPivot * maxSwing;

          if (isMain) {
            p.group.position.set(parkLeftX, 0, 0);
            p.group.rotation.set(0, swingAngle, 0);
            this.setChildrenOffset(p, panelWidthM / 2);
          } else {
            // Side wing aligned along Z
            const cornerX = state.widthCm / 100 / 2;
            p.group.position.set(cornerX, 0, parkLeftX);
            p.group.rotation.set(0, Math.PI / 2 + swingAngle, 0);
            this.setChildrenOffset(p, panelWidthM / 2);
          }
        } else {
          // Subsequent panels slide to park station then swing
          const stackZ = i * 0.038; // Z-depth in parking stack
          const currentSwing = pivotFactor * maxSwing;

          if (isMain) {
            if (pivotFactor > 0) {
              p.group.position.set(parkLeftX + i * 0.015, 0, stackZ);
              p.group.rotation.set(0, currentSwing, 0);
              this.setChildrenOffset(p, panelWidthM / 2);
            } else {
              p.group.position.set(currentX, 0, 0);
              p.group.rotation.set(0, 0, 0);
              this.setChildrenOffset(p, 0);
            }
          } else {
            const cornerX = state.widthCm / 100 / 2;
            const sideZ = currentX + wingWidthM / 2;
            if (pivotFactor > 0) {
              p.group.position.set(cornerX - stackZ, 0, i * 0.015);
              p.group.rotation.set(0, Math.PI / 2 + currentSwing, 0);
              this.setChildrenOffset(p, panelWidthM / 2);
            } else {
              p.group.position.set(cornerX, 0, sideZ);
              p.group.rotation.set(0, Math.PI / 2, 0);
              this.setChildrenOffset(p, 0);
            }
          }
        }
      } else {
        // Stacking to the right
        const parkStationX = parkRightX - panelWidthM / 2;
        const currentX = THREE.MathUtils.lerp(closedX, parkStationX, slideFactor);
        const stackZ = (count - 1 - i) * 0.038;
        const currentSwing = pivotFactor * -maxSwing;

        if (isMain) {
          if (pivotFactor > 0) {
            p.group.position.set(parkRightX - (count - 1 - i) * 0.015, 0, stackZ);
            p.group.rotation.set(0, currentSwing, 0);
            this.setChildrenOffset(p, -panelWidthM / 2);
          } else {
            p.group.position.set(currentX, 0, 0);
            p.group.rotation.set(0, 0, 0);
            this.setChildrenOffset(p, 0);
          }
        } else {
          const cornerX = state.widthCm / 100 / 2;
          const sideZ = currentX + wingWidthM / 2;
          p.group.position.set(cornerX, 0, sideZ);
          p.group.rotation.set(0, Math.PI / 2, 0);
          this.setChildrenOffset(p, 0);
        }
      }
    });
  }

  /**
   * Parallel Multi-Track Sliding System
   */
  private updateSlidingKinematics(
    panels: PanelMeshNode[],
    wingWidthM: number,
    state: ConfiguratorState,
    progress: number,
    wingType: 'main' | 'side'
  ) {
    const count = panels.length;
    const trackSpacing = 0.032;
    const overlapM = 0.035;
    const panelWidthM = (wingWidthM + (count - 1) * overlapM) / count;
    const isMain = wingType === 'main';
    const cornerX = state.widthCm / 100 / 2;

    panels.forEach((p, i) => {
      const trackZ = (i - (count - 1) / 2) * trackSpacing;
      const closedX = -wingWidthM / 2 + panelWidthM / 2 + i * (panelWidthM - overlapM);
      const openX = wingWidthM / 2 - panelWidthM / 2 - (count - 1 - i) * 0.018;

      const motionRatio = count > 1 ? (count - 1 - i) / (count - 1) : 0;
      const effectiveProgress = Math.min(1, progress * (1 + (1 - motionRatio) * 0.45));
      const currentX = THREE.MathUtils.lerp(closedX, openX, effectiveProgress);

      if (isMain) {
        p.group.position.set(currentX, 0, trackZ);
        p.group.rotation.set(0, 0, 0);
      } else {
        const sideZ = currentX + wingWidthM / 2;
        p.group.position.set(cornerX + trackZ, 0, sideZ);
        p.group.rotation.set(0, Math.PI / 2, 0);
      }
      this.setChildrenOffset(p, 0);
    });
  }

  /**
   * Concertina Accordion Zigzag Kinematics
   */
  private updateAccordionKinematics(
    panels: PanelMeshNode[],
    wingWidthM: number,
    state: ConfiguratorState,
    progress: number,
    wingType: 'main' | 'side'
  ) {
    const count = panels.length;
    const panelWidthM = wingWidthM / count;
    const maxFoldAngle = Math.PI * 0.42;
    const currentFoldAngle = progress * maxFoldAngle;
    const projectedWidth = panelWidthM * Math.cos(currentFoldAngle);

    let currentAnchor = -wingWidthM / 2;
    const isMain = wingType === 'main';
    const cornerX = state.widthCm / 100 / 2;

    panels.forEach((p, i) => {
      const isEven = i % 2 === 0;
      const angle = isEven ? currentFoldAngle : -currentFoldAngle;
      const halfW = projectedWidth / 2;
      const centerX = currentAnchor + halfW;
      const centerZ = (isEven ? 1 : -1) * (panelWidthM * Math.sin(currentFoldAngle) * 0.5);

      if (isMain) {
        p.group.position.set(centerX, 0, centerZ);
        p.group.rotation.set(0, angle, 0);
      } else {
        const sideZ = centerX + wingWidthM / 2;
        p.group.position.set(cornerX + centerZ, 0, sideZ);
        p.group.rotation.set(0, Math.PI / 2 + angle, 0);
      }
      this.setChildrenOffset(p, 0);
      currentAnchor += projectedWidth;
    });
  }

  private setChildrenOffset(panel: PanelMeshNode, offsetX: number) {
    panel.glassMesh.position.x = offsetX;
    panel.topClampMesh.position.x = offsetX;
    panel.bottomClampMesh.position.x = offsetX;
    panel.rollerGroup.position.x = offsetX;
    panel.shadowMesh.position.x = offsetX;
  }
}
