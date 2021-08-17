import * as THREE from 'three';

class HitZonePlates {
    constructor(sceneState) {
        this.sceneState = sceneState;
        this.nextPlateIndex = 0;
        this.totalPlates = 100;
        this.material;
        this.plates;
        this.timeouts = [];
        this.dummy = new THREE.Object3D();
        this.sceneState.levelAssets.fxTextures.sparks = {
            url: this.sceneState.settings.assetsUrl + '/sprites/orange_glow_256x256.png',
            texture: null,
        };
    }

    addHitZone(intersect) {
        const index = this.nextPlateIndex;
        const dummy = this.dummy;
        const hitPoint = intersect.point;
        const normalLookAt = new THREE.Vector3(
            hitPoint.x + intersect.face.normal.x,
            hitPoint.y + intersect.face.normal.y,
            hitPoint.z + intersect.face.normal.z
        );
        dummy.position.set(
            hitPoint.x + intersect.face.normal.x / (100 - index),
            hitPoint.y + intersect.face.normal.y / (100 - index),
            hitPoint.z + intersect.face.normal.z / (100 - index)
        );
        dummy.lookAt(normalLookAt);
        const scale = this.sceneState.utils.randomFloatFromInterval(0.3, 0.6);
        dummy.scale.set(scale, scale, scale);
        dummy.updateMatrix();
        this.plates.setMatrixAt(index, dummy.matrix);
        this.plates.instanceMatrix.needsUpdate = true;

        const attributes = this.plates.geometry.attributes;
        const vec4Index = index * 3;
        attributes.times.array[vec4Index] = performance.now(); // Start time
        attributes.times.array[vec4Index+1] = this.sceneState.utils.randomIntFromInterval(6000, 7200); // Dark smudge length (in ms)
        attributes.times.array[vec4Index+2] = this.sceneState.utils.randomIntFromInterval(1200, 4000); // Lava glow length (in ms
        attributes.times.needsUpdate = true;

        clearTimeout(this.timeouts[index]);
        this.timeouts[index] = setTimeout(() => {
            this.dummy.position.set(0, 2000, 0);
            this.dummy.updateMatrix();
            this.plates.setMatrixAt(index, this.dummy.matrix);
            this.plates.instanceMatrix.needsUpdate = true;
        }, 7200);

        this.nextPlateIndex++;
        if(this.nextPlateIndex > this.totalPlates) this.nextPlateIndex = 0;
    }

    initPlates() {
        const amount = this.totalPlates;
        const dummy = this.dummy;
        const geo = new THREE.InstancedBufferGeometry().copy(new THREE.PlaneBufferGeometry(0.4, 0.4, 1, 1));
        const times = new Float32Array(amount * 3);
        for(let i=0; i<amount*3; i+=3) {
            times[i] = 0;
            times[i+1] = 0;
            times[i+2] = 0;
        }
        geo.setAttribute('times', new THREE.InstancedBufferAttribute(times, 3, false, 1));
        const mat = this._createShaderMaterial();
        const mesh = new THREE.InstancedMesh(geo, mat, amount);
        // mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        for(let i=0; i<amount; i++) {
            dummy.position.set(i, 0, 0);
            dummy.updateMatrix();
            mesh.setMatrixAt(i, dummy.matrix);
            this.timeouts.push(setTimeout(() => {}, 0));
        }
        mesh.instanceMatrix.needsUpdate = true;
        this.plates = mesh;
        this.sceneState.scenes[this.sceneState.curScene].add(this.plates);
        console.log('PLATES', this.plates);
    }

    _createShaderMaterial() {
        const material = new THREE.ShaderMaterial({
            uniforms: {
                uTime: { value: 0 },
                lavaGlow: { value: this.sceneState.levelAssets.fxTextures.sparks.texture },
            },
            depthTest: true,
            depthWrite: true,
            transparent: true,
            // alphaTest: true,
            // blending: THREE.AdditiveBlending,
            blending: THREE.CustomBlending,
            blendEquation: THREE.AddEquation,
            blendSrc: THREE.OneFactor,
            blendDst: THREE.OneMinusSrcAlphaFactor,
            vertexShader: `
                attribute vec3 times;
                uniform float uTime;
                varying float vTimePhase;
                varying float vGlowPhase;
                varying vec2 vUv;

                void main() {
                    vUv = uv;
                    float startTime = times[0];
                    float timeElapsed = uTime - startTime;
                    float fullAge = times[1];
                    float glowAge = times[2];
                    vTimePhase = timeElapsed / fullAge;
                    vGlowPhase = timeElapsed / glowAge;
                    vec4 mvPosition = modelViewMatrix * instanceMatrix * vec4(position, 1.0);
                    vec4 vertexPosition = projectionMatrix * mvPosition;
                    gl_Position = vertexPosition;
                }
            `,
            fragmentShader: `
                uniform sampler2D lavaGlow;
                varying float vTimePhase;
                varying float vGlowPhase;
                varying vec2 vUv;

                void main() {
                    // gl_FragColor = texture2D(lavaGlow, vUv);
                    float overHalf = 1.0 - ceil(vGlowPhase - vTimePhase);
                    gl_FragColor = texture2D(lavaGlow, vUv)
                        + vec4(0.5, 0.5, 0.5, 0.0)
                        - vec4(vGlowPhase * 2.0, vGlowPhase * 1.8, vGlowPhase * 1.8, 0.0);
                    gl_FragColor.xyz *= gl_FragColor.w;
                    gl_FragColor.w *= vTimePhase + vGlowPhase * 0.25;
                    gl_FragColor.w *= 1.0 - (vTimePhase + 0.3 * vTimePhase);
                }
            `,
        });

        this.sceneState.shadersToUpdate.push({ material: material });
        this.sceneState.shadersToUpdateLength++;
        return material;
    }
}

export default HitZonePlates;