import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import type { ModelParams } from '../App';

interface ModelViewerProps {
  modelParams: ModelParams;
  imageUrl: string | null;
}

const ModelViewer: React.FC<ModelViewerProps> = ({ modelParams, imageUrl }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!mountRef.current || !modelParams) return;

    const currentMount = mountRef.current;

    // Scene
    const scene = new THREE.Scene();

    // Camera
    const camera = new THREE.PerspectiveCamera(50, currentMount.clientWidth / currentMount.clientHeight, 0.1, 1000);
    camera.position.set(5, 5, 10);
    camera.lookAt(0, 0, 0);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    currentMount.appendChild(renderer.domElement);

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 3;
    controls.maxDistance = 50;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.5;

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
    directionalLight.position.set(8, 10, 5);
    scene.add(directionalLight);

    // Create Model from Params
    const group = new THREE.Group();
    const textureLoader = new THREE.TextureLoader();
    
    const primaryMaterial = new THREE.MeshStandardMaterial({ 
        color: modelParams.primaryColor, 
        roughness: 0.5, 
        metalness: 0.7 
    });

    if(imageUrl) {
        textureLoader.load(imageUrl, (texture) => {
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.RepeatWrapping;
            texture.repeat.set(1, 1);
            primaryMaterial.map = texture;
            primaryMaterial.needsUpdate = true;
        }, undefined, (error) => {
            console.error('An error occurred loading the texture:', error);
        });
    }

    const secondaryMaterial = new THREE.MeshStandardMaterial({ 
        color: modelParams.secondaryColor, 
        roughness: 0.6, 
        metalness: 0.3 
    });

    modelParams.components.forEach((comp, index) => {
        let geometry: THREE.BufferGeometry;
        switch (comp.shape) {
            case 'sphere':
                geometry = new THREE.SphereGeometry(1, 32, 32);
                break;
            case 'cylinder':
                geometry = new THREE.CylinderGeometry(0.5, 0.5, 1, 32);
                break;
            case 'cone':
                geometry = new THREE.ConeGeometry(0.5, 1, 32);
                break;
            case 'box':
            default:
                geometry = new THREE.BoxGeometry(1, 1, 1);
                break;
        }

        // Use primary material (with texture if available) for the first component, and secondary for others.
        const material = index === 0 ? primaryMaterial : secondaryMaterial;
        const mesh = new THREE.Mesh(geometry, material);
        mesh.scale.set(comp.scale[0], comp.scale[1], comp.scale[2]);
        mesh.position.set(comp.position[0], comp.position[1], comp.position[2]);
        mesh.rotation.set(comp.rotation[0], comp.rotation[1], comp.rotation[2]);
        group.add(mesh);
    });

    scene.add(group);

    // Animation Loop
    let animationFrameId: number;
    const animate = () => {
        animationFrameId = requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
    };
    animate();

    // Handle Resize using ResizeObserver for robustness
    const resizeObserver = new ResizeObserver(entries => {
        if (!entries || entries.length === 0 || !currentMount) {
            return;
        }
        const { width, height } = entries[0].contentRect;
        renderer.setSize(width, height);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
    });
    resizeObserver.observe(currentMount);

    // Cleanup
    return () => {
      resizeObserver.disconnect();
      cancelAnimationFrame(animationFrameId);
      if (currentMount.contains(renderer.domElement)) {
        currentMount.removeChild(renderer.domElement);
      }
      
      // Dispose Three.js objects
      scene.remove(group);
      group.children.forEach(child => {
          if (child instanceof THREE.Mesh) {
              child.geometry.dispose();
          }
      });
      primaryMaterial.map?.dispose();
      primaryMaterial.dispose();
      secondaryMaterial.dispose();
      
      renderer.dispose();
      controls.dispose();
    };
  }, [modelParams, imageUrl]);
  
  return <div ref={mountRef} className="w-full h-full rounded-lg" />;
};

export default ModelViewer;