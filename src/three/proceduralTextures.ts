import * as THREE from 'three';

/**
 * Creates a procedural architectural luxury stone/terrace tile floor texture.
 */
export function createFloorTexture(renderer?: THREE.WebGLRenderer): { map: THREE.CanvasTexture; roughnessMap: THREE.CanvasTexture } {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // Warm architectural limestone / light travertine base
  ctx.fillStyle = '#1c1e22';
  ctx.fillRect(0, 0, size, size);

  // Subtle terrazzo marble flakes & noise
  for (let i = 0; i < 4000; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const radius = 0.5 + Math.random() * 1.5;
    const brightness = 25 + Math.random() * 25;
    ctx.fillStyle = `rgb(${brightness}, ${brightness + 2}, ${brightness + 5})`;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  // Modern architectural slab tile grid lines (60x60cm scale)
  ctx.strokeStyle = '#0d0e11';
  ctx.lineWidth = 2.5;
  const tileSize = size / 2;
  for (let x = 0; x <= size; x += tileSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, size);
    ctx.stroke();
  }
  for (let y = 0; y <= size; y += tileSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(size, y);
    ctx.stroke();
  }

  const map = new THREE.CanvasTexture(canvas);
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(8, 8);
  map.colorSpace = THREE.SRGBColorSpace;
  if (renderer) {
    map.anisotropy = renderer.capabilities.getMaxAnisotropy();
  }

  // Roughness map (high roughness with slight gloss variations)
  const roughCanvas = document.createElement('canvas');
  roughCanvas.width = 256;
  roughCanvas.height = 256;
  const rCtx = roughCanvas.getContext('2d')!;
  rCtx.fillStyle = '#a0a0a0';
  rCtx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 2000; i++) {
    const x = Math.random() * 256;
    const y = Math.random() * 256;
    const v = 140 + Math.random() * 40;
    rCtx.fillStyle = `rgb(${v},${v},${v})`;
    rCtx.fillRect(x, y, 2, 2);
  }
  const roughnessMap = new THREE.CanvasTexture(roughCanvas);
  roughnessMap.wrapS = THREE.RepeatWrapping;
  roughnessMap.wrapT = THREE.RepeatWrapping;
  roughnessMap.repeat.set(8, 8);

  return { map, roughnessMap };
}

/**
 * Creates brushed aluminum micro-grooves bump map for extruded rails and hardware
 */
export function createBrushedBumpMap(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, 128, 512);

  // Vertical brushing striations
  for (let i = 0; i < 400; i++) {
    const x = Math.random() * 128;
    const shade = 100 + Math.random() * 55;
    ctx.fillStyle = `rgb(${shade},${shade},${shade})`;
    ctx.fillRect(x, 0, 1 + Math.random() * 2, 512);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1, 4);
  return texture;
}

/**
 * Creates high-fidelity corner laser safety stamp for Tabriz Securit tempered glass
 */
export function createSafetyStampTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, 256, 128);

  // Laser etched frosted white/grey badge
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(8, 8, 240, 112);

  ctx.font = 'bold 15px sans-serif';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
  ctx.textAlign = 'center';
  ctx.fillText('TABRIZ SECURIT', 128, 36);

  ctx.font = '11px sans-serif';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.fillText('TEMPERED SAFETY GLASS', 128, 56);
  ctx.fillText('ISIRI 3772 / EN 12150', 128, 74);

  ctx.font = '9px sans-serif';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.fillText('تبریز سکوریت - استاندارد ملی', 128, 98);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * Radial contact shadow texture for grounding moving glass panels and tracks
 */
export function createRadialShadowTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  gradient.addColorStop(0, 'rgba(0, 0, 0, 0.85)');
  gradient.addColorStop(0.35, 'rgba(0, 0, 0, 0.4)');
  gradient.addColorStop(0.7, 'rgba(0, 0, 0, 0.12)');
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 128, 128);

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}
