import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ImprovedNoise } from 'three/examples/jsm/math/ImprovedNoise.js';

/**
 * BrainScene — a glowing 3D brain built from a moving point cloud, with data
 * particles streaming outward, bloom glow, slow auto-rotation and mouse
 * parallax. Brand palette: orange → amber → white on a near-black field.
 */

const BRAIN_POINTS = 11000;
const STREAM_POINTS = 2600;

// brand colours
const C_ORANGE = new THREE.Color('#ff6600');
const C_AMBER = new THREE.Color('#ffc233');
const C_WHITE = new THREE.Color('#fff4e6');

function softSprite(): THREE.Texture {
  const size = 64;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d')!;
  const grad = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.35, 'rgba(255,255,255,0.7)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(c);
  tex.needsUpdate = true;
  return tex;
}

export function BrainScene() {
  const mountRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let width = mount.clientWidth;
    let height = mount.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#07060b');
    scene.fog = new THREE.FogExp2('#07060b', 0.12);

    const camera = new THREE.PerspectiveCamera(52, width / height, 0.1, 100);
    camera.position.set(0, 0, 3.6);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);

    const sprite = softSprite();
    const perlin = new ImprovedNoise();

    // pseeded-ish rng so the brain is stable across reloads
    let seed = 1337;
    const rand = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };

    // ---- brain point cloud ----
    const RX = 1.25;
    const RY = 1.0;
    const RZ = 1.55;
    const brainPositions = new Float32Array(BRAIN_POINTS * 3);
    const brainColors = new Float32Array(BRAIN_POINTS * 3);
    const brainBase = new Float32Array(BRAIN_POINTS * 3); // resting positions for breathing

    const tmp = new THREE.Color();
    for (let i = 0; i < BRAIN_POINTS; i++) {
      // uniform direction on sphere
      const u = rand();
      const v = rand();
      const theta = Math.acos(2 * u - 1);
      const phi = 2 * Math.PI * v;
      let x = Math.sin(theta) * Math.cos(phi);
      let y = Math.cos(theta);
      let z = Math.sin(theta) * Math.sin(phi);

      // ellipsoid
      x *= RX;
      y *= RY;
      z *= RZ;

      // perlin folds (gyri / sulci)
      const f1 = perlin.noise(x * 1.6, y * 1.6, z * 1.6);
      const f2 = perlin.noise(x * 4.2, y * 4.2, z * 4.2) * 0.5;
      const disp = 1 + 0.12 * f1 + 0.06 * f2;
      x *= disp;
      y *= disp;
      z *= disp;

      // flatten the underside a touch, lift the front
      y -= 0.12 * Math.max(0, -y);

      // central longitudinal fissure (two hemispheres)
      const side = x >= 0 ? 1 : -1;
      x += side * 0.05;
      if (Math.abs(x) < 0.07) x += side * 0.05;

      brainPositions[i * 3] = x;
      brainPositions[i * 3 + 1] = y;
      brainPositions[i * 3 + 2] = z;
      brainBase[i * 3] = x;
      brainBase[i * 3 + 1] = y;
      brainBase[i * 3 + 2] = z;

      // colour: orange→amber by height, sparkle to white
      const t = THREE.MathUtils.clamp((y + RY) / (2 * RY), 0, 1);
      tmp.copy(C_ORANGE).lerp(C_AMBER, t);
      const sparkle = Math.pow(rand(), 6);
      tmp.lerp(C_WHITE, sparkle * 0.9);
      brainColors[i * 3] = tmp.r;
      brainColors[i * 3 + 1] = tmp.g;
      brainColors[i * 3 + 2] = tmp.b;
    }

    const brainGeo = new THREE.BufferGeometry();
    brainGeo.setAttribute('position', new THREE.BufferAttribute(brainPositions, 3));
    brainGeo.setAttribute('color', new THREE.BufferAttribute(brainColors, 3));
    const brainMat = new THREE.PointsMaterial({
      size: 0.02,
      map: sprite,
      vertexColors: true,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    });
    const brain = new THREE.Points(brainGeo, brainMat);

    // ---- streaming data particles ----
    const streamPositions = new Float32Array(STREAM_POINTS * 3);
    const streamColors = new Float32Array(STREAM_POINTS * 3);
    const streamVel = new Float32Array(STREAM_POINTS * 3);
    const streamLife = new Float32Array(STREAM_POINTS);

    const seedStream = (i: number, fresh: boolean) => {
      const src = (Math.floor(rand() * BRAIN_POINTS)) * 3;
      const x = brainBase[src];
      const y = brainBase[src + 1];
      const z = brainBase[src + 2];
      streamPositions[i * 3] = x;
      streamPositions[i * 3 + 1] = y;
      streamPositions[i * 3 + 2] = z;
      // outward radial velocity, biased along ±x so streams fan sideways like the reference
      const len = Math.hypot(x, y, z) || 1;
      const speed = 0.004 + rand() * 0.01;
      streamVel[i * 3] = (x / len) * speed + (x >= 0 ? 1 : -1) * (0.004 + rand() * 0.006);
      streamVel[i * 3 + 1] = (y / len) * speed * 0.5;
      streamVel[i * 3 + 2] = (z / len) * speed;
      streamLife[i] = fresh ? rand() : 1;
      tmp.copy(x >= 0 ? C_AMBER : C_ORANGE).lerp(C_WHITE, Math.pow(rand(), 3) * 0.8);
      streamColors[i * 3] = tmp.r;
      streamColors[i * 3 + 1] = tmp.g;
      streamColors[i * 3 + 2] = tmp.b;
    };
    for (let i = 0; i < STREAM_POINTS; i++) seedStream(i, true);

    const streamGeo = new THREE.BufferGeometry();
    streamGeo.setAttribute('position', new THREE.BufferAttribute(streamPositions, 3));
    streamGeo.setAttribute('color', new THREE.BufferAttribute(streamColors, 3));
    const streamMat = new THREE.PointsMaterial({
      size: 0.03,
      map: sprite,
      vertexColors: true,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    });
    const streams = new THREE.Points(streamGeo, streamMat);

    const group = new THREE.Group();
    group.add(brain);
    group.add(streams);
    group.rotation.x = 0.08;
    scene.add(group);

    // ---- bloom ----
    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    const bloom = new UnrealBloomPass(new THREE.Vector2(width, height), 1.15, 0.55, 0.0);
    composer.addPass(bloom);

    // ---- interaction ----
    const mouse = { x: 0, y: 0 };
    const onMove = (e: MouseEvent) => {
      mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener('mousemove', onMove);

    const onResize = () => {
      width = mount.clientWidth;
      height = mount.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
      composer.setSize(width, height);
    };
    window.addEventListener('resize', onResize);

    let running = true;
    let raf = 0;
    const clock = new THREE.Clock();

    const animate = () => {
      if (!running) return;
      raf = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      // auto rotation + mouse parallax
      group.rotation.y += reduce ? 0 : 0.0016;
      const targetY = group.rotation.y + mouse.x * 0.35;
      const targetX = 0.08 + mouse.y * 0.25;
      group.rotation.y += (targetY - group.rotation.y) * 0.02;
      group.rotation.x += (targetX - group.rotation.x) * 0.04;

      if (!reduce) {
        // breathing brain
        const pos = brainGeo.attributes.position.array as Float32Array;
        for (let i = 0; i < BRAIN_POINTS; i++) {
          const bx = brainBase[i * 3];
          const by = brainBase[i * 3 + 1];
          const bz = brainBase[i * 3 + 2];
          const pulse = 1 + 0.012 * Math.sin(t * 1.5 + bx * 3 + by * 2 + bz);
          pos[i * 3] = bx * pulse;
          pos[i * 3 + 1] = by * pulse;
          pos[i * 3 + 2] = bz * pulse;
        }
        brainGeo.attributes.position.needsUpdate = true;

        // stream flow
        const sp = streamGeo.attributes.position.array as Float32Array;
        for (let i = 0; i < STREAM_POINTS; i++) {
          streamLife[i] -= 0.006;
          if (streamLife[i] <= 0) {
            seedStream(i, false);
          }
          sp[i * 3] += streamVel[i * 3];
          sp[i * 3 + 1] += streamVel[i * 3 + 1];
          sp[i * 3 + 2] += streamVel[i * 3 + 2];
        }
        streamGeo.attributes.position.needsUpdate = true;
      }

      composer.render();
    };
    animate();

    const onVisibility = () => {
      if (document.hidden) {
        running = false;
        cancelAnimationFrame(raf);
      } else if (!running) {
        running = true;
        animate();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', onVisibility);
      brainGeo.dispose();
      brainMat.dispose();
      streamGeo.dispose();
      streamMat.dispose();
      sprite.dispose();
      bloom.dispose();
      composer.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={mountRef} aria-hidden="true" className="absolute inset-0 h-full w-full" />;
}
