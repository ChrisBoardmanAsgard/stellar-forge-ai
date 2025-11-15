import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import type { ModelParams } from '../App';
import { DownloadIcon } from './Icons';

interface ModelViewerProps {
  modelParams: ModelParams;
  imageUrl: string | null;
}

const ModelViewer: React.FC<ModelViewerProps> = ({ modelParams, imageUrl }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const groupRef = useRef<THREE.Group | null>(null);
  const ambientLightRef = useRef<THREE.AmbientLight | null>(null);
  const directionalLightRef = useRef<THREE.DirectionalLight | null>(null);

  const [ambientIntensity, setAmbientIntensity] = useState(0.8);
  const [directionalIntensity, setDirectionalIntensity] = useState(1.5);

  const handleExportGLB = () => {
    if (!groupRef.current) {
        console.error("3D model group not available for export.");
        return;
    }
    const exporter = new GLTFExporter();
    exporter.parse(
        groupRef.current,
        (result) => {
            const blob = new Blob([result as ArrayBuffer], { type: 'application/octet-stream' });
            
            const link = document.createElement('a');
            link.style.display = 'none';
            document.body.appendChild(link);
            
            link.href = URL.createObjectURL(blob);
            link.download = 'stellar_forge_model.glb';
            link.click();
            
            URL.revokeObjectURL(link.href);
            document.body.removeChild(link);
        },
        (error) => {
            console.error('An error happened during GLB export:', error);
            alert('Sorry, there was an error exporting the model. Please check the console for details.');
        },
        { binary: true }
    );
  };
  
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
    const ambientLight = new THREE.AmbientLight(0xffffff, ambientIntensity);
    scene.add(ambientLight);
    ambientLightRef.current = ambientLight;

    const directionalLight = new THREE.DirectionalLight(0xffffff, directionalIntensity);
    directionalLight.position.set(8, 10, 5);
    scene.add(directionalLight);
    directionalLightRef.current = directionalLight;

    // Create Model from Params
    const group = new THREE.Group();
    groupRef.current = group; // Store group in ref for exporter
    
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
      groupRef.current = null; // Clear ref on cleanup
      ambientLightRef.current = null;
      directionalLightRef.current = null;
    };
  }, [modelParams, imageUrl]);

  useEffect(() => {
    if (ambientLightRef.current) {
      ambientLightRef.current.intensity = ambientIntensity;
    }
  }, [ambientIntensity]);

  useEffect(() => {
    if (directionalLightRef.current) {
      directionalLightRef.current.intensity = directionalIntensity;
    }
  }, [directionalIntensity]);
  
  return (
    <div className="relative w-full h-full">
        <div ref={mountRef} className="w-full h-full rounded-lg" />
        <button
            onClick={handleExportGLB}
            className="absolute top-3 right-3 z-10 p-2 bg-gray-800/70 hover:bg-cyan-700/80 rounded-full text-white transition-colors duration-200 backdrop-blur-sm"
            aria-label="Export 3D Model as GLB"
            title="Export as GLB"
        >
            <DownloadIcon className="w-5 h-5" />
        </button>
        <div className="absolute bottom-3 left-3 right-3 z-10 p-3 bg-gray-800/70 rounded-lg backdrop-blur-sm flex flex-col sm:flex-row gap-4 items-center">
            <div className="w-full sm:w-1/2">
                <label htmlFor="ambient-intensity" className="block text-xs font-medium text-gray-300 mb-1">Ambient Light ({ambientIntensity.toFixed(1)})</label>
                <input
                    id="ambient-intensity"
                    type="range"
                    min="0"
                    max="3"
                    step="0.1"
                    value={ambientIntensity}
                    onChange={(e) => setAmbientIntensity(parseFloat(e.target.value))}
                    className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer range-slider"
                    aria-label="Ambient light intensity"
                />
            </div>
            <div className="w-full sm:w-1/2">
                <label htmlFor="directional-intensity" className="block text-xs font-medium text-gray-300 mb-1">Directional Light ({directionalIntensity.toFixed(1)})</label>
                <input
                    id="directional-intensity"
                    type="range"
                    min="0"
                    max="5"
                    step="0.1"
                    value={directionalIntensity}
                    onChange={(e) => setDirectionalIntensity(parseFloat(e.target.value))}
                    className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer range-slider"
                    aria-label="Directional light intensity"
                />
            </div>
        </div>
    </div>
  );
};

export default ModelViewer;