import * as THREE from 'three';

class PhysicsParticles {
    constructor(sceneState) {
        this.sceneState = sceneState;
        this.maxParticles = this.sceneState.physics.particlesCount;
        const DL = this.sceneState.settings.physics.particleDetailLevel;
        this.subParticlesPerParticle = DL === 'high' ? 5 : DL === 'medium' ? 10 : 55;
        this.nextPartIndex = 0;
        this.sceneState.levelAssets.fxTextures['sparks'] = {
            url: this.sceneState.settings.assetsUrl + '/sprites/orange_glow_256x256.png',
            texture: null,
        };
        this.material;
        this.particles;
        this.timeouts = [];
    }

    initParticles() {
        this.material = this._createParticleShader();
        const partCount = this.maxParticles;
        const particlesPerParticle = this.subParticlesPerParticle;
        const positions = new Float32Array(partCount * particlesPerParticle * 3);
        const subindexes = new Float32Array(partCount * particlesPerParticle);
        const indexes = new Float32Array(partCount * particlesPerParticle);
        const randoms = new Float32Array(partCount * particlesPerParticle * 3);
        let i = 0;
        for(let p1=0; p1<partCount; p1++) {
            for(let p2=0; p2<particlesPerParticle; p2++) {
                indexes[p1*particlesPerParticle+p2] = p1;
                subindexes[p1*particlesPerParticle+p2] = p2;
                randoms[i] = Math.random() * (Math.random() < 0.5 ? -1 : 1);
                randoms[i+1] = Math.random() * (Math.random() < 0.5 ? -1 : 1);
                randoms[i+2] = Math.random() * (Math.random() < 0.5 ? -1 : 1);
                positions[i] = 0;
                positions[i+1] = 0;
                positions[i+2] = 0;
                i += 3;
            }
            this.timeouts.push(setTimeout(() => {}), 0);
        }
        const projGeo = new THREE.BufferGeometry();
        projGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        projGeo.setAttribute('partindex', new THREE.BufferAttribute(indexes, 1));
        projGeo.setAttribute('subpartindex', new THREE.BufferAttribute(subindexes, 1));
        projGeo.setAttribute('random', new THREE.BufferAttribute(randoms, 3));
        this.particles = new THREE.Points(projGeo, this.material);
        this.particles.frustumCulled = false;
        this.sceneState.scenes[this.sceneState.curScene].add(this.particles);
    }

    addParticles(from, to, speed) {
        let maxAmount = 2, minAmount = 1;
        const detailLevel = this.sceneState.settings.physics.particleDetailLevel;
        if(detailLevel === 'high') {
            maxAmount = 22; minAmount = 8;
        } else if(detailLevel === 'medium') {
            maxAmount = 5; minAmount = 3;
        }
        const amount = this.sceneState.utils.randomIntFromInterval(minAmount, maxAmount);
        for(let i=0; i<amount; i++) {
            const particleIndex = this.sceneState.physics.nextParticleIndex;
            this.sceneState.additionalPhysicsData.push({
                phase: 'moveParticle',
                data: {
                    bodyIndex: particleIndex,
                    position: [
                        from.x + (to.x - from.x) + (to.x < from.x ? 0.35 : -0.35),
                        from.y + (to.y - from.y) + (to.y < from.y ? 0.35 : -0.35),
                        from.z + (to.z - from.z) + (to.z < from.z ? 0.35 : -0.35),
                    ],
                    velocity: [
                        (to.x - from.x +
                            this.sceneState.utils.randomFloatFromInterval(1, 1.5) *
                            (Math.random() < 0.5 ? -1 : 1)
                        ) * speed * 10,
                        (to.y - from.y +
                            this.sceneState.utils.randomFloatFromInterval(3, 7) //*
                            // (Math.random() < 0.37 ? -1 : 1)
                        ) * speed * 10,
                        (to.z - from.z +
                            this.sceneState.utils.randomFloatFromInterval(1, 1.5) *
                            (Math.random() < 0.5 ? -1 : 1)
                        ) * speed * 10,
                    ],
                },
            });
            this.material.uniforms.uStartTimes.value[particleIndex] = performance.now();
            clearTimeout(this.timeouts[particleIndex]);
            this.timeouts[particleIndex] = setTimeout(() => {
                this.sceneState.additionalPhysicsData.push({
                    phase: 'resetPosition',
                    data: {
                        bodyIndex: particleIndex,
                        position: [particleIndex, 2000, 0],
                        sleep: true,
                    },
                });
            }, 3000);
            this.sceneState.physics.nextParticleIndex++;
            if(this.sceneState.physics.nextParticleIndex > this.sceneState.physics.particlesCount-1) {
                this.sceneState.physics.nextParticleIndex = 0;
            }
        }
    }

    updatePosition(index, pos) {
        if(!this.material) return;
        this.material.uniforms.uPositions.value[index].x = pos[0];
        this.material.uniforms.uPositions.value[index].y = pos[1];
        this.material.uniforms.uPositions.value[index].z = pos[2];
    }

    _createParticleShader() {
        let pixelRatio = window.devicePixelRatio;
        const DL = this.sceneState.settings.physics.particleDetailLevel;
        const material = new THREE.ShaderMaterial({
            uniforms: {
                //uColors: { value: this._initShaderPart('color') },
                uTime: { value: 0 },
                uStartTimes : { value: this._initShaderPart('zeros') },
                uDetailLevel: { value: DL === 'high' ? 8 : DL === 'medium' ? 8 : 12 },
                uPositions: { value: this._initShaderPart('position') },
                scale: { type: 'f', value: window.innerHeight * pixelRatio / 2 },
                diffuseTexture: { value: this.sceneState.levelAssets.fxTextures.sparks.texture },
            },
            depthTest: true,
            depthWrite: false,
            transparent: true,
            blending: THREE.AdditiveBlending,
            vertexShader: `
                attribute float partindex;
                attribute float subpartindex;
                attribute vec3 random;
                uniform float uStartTime;
                uniform float uTime;
                uniform vec3 uPositions[${this.maxParticles}];
                uniform float uStartTimes[${this.maxParticles}];
                uniform float scale;
                uniform float uDetailLevel;
                varying float vBigGlow;

                void main() {
                    int intIndex = int(partindex);
                    float startTime = uStartTimes[intIndex];
                    float timeElapsed = uTime - startTime;
                    vBigGlow = clamp(floor(1.0 - mod(subpartindex, uDetailLevel)), 0.0, 1.0);
                    float maxMovement = clamp(timeElapsed, 0.0, 1000.0 * random.x);
                    vec3 pos = uPositions[intIndex] + random * maxMovement * 0.001;
                    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
                    vec4 vertexPosition = projectionMatrix * mvPosition;
                    gl_PointSize = (0.25 + 4.0 * vBigGlow) * (scale / length(-mvPosition.xyz));
                    gl_Position = vertexPosition;
                }
            `,
            fragmentShader: `
                uniform sampler2D diffuseTexture;
                // varying vec3 vColor;
                varying float vBigGlow;

                void main() {
                    gl_FragColor = texture2D(diffuseTexture, gl_PointCoord) * vec4(1.0, 1.0, 1.0, 1.0 - 0.97 * vBigGlow);
                }
            `,
        });

        this.sceneState.shadersToUpdate.push({ material: material });
        this.sceneState.shadersToUpdateLength++;
        this.sceneState.shadersToResize.push({ material: material });
        return material;
    }

    _initShaderPart(part) {
        const returnArray = [];
        if(part === 'color') {
            for(let i=0; i<this.maxParticles; i++) {
                returnArray.push(new THREE.Color(0xfc2f00));
            }
        } else if(part === 'position') {
            for(let i=0; i<this.maxParticles; i++) {
                returnArray.push(new THREE.Vector3(0, 2000, 0));
            }
        } else if(part === 'zeros') {
            for(let i=0; i<this.maxParticles; i++) {
                returnArray.push(0);
            }
        }
        return returnArray;
    }
}

export default PhysicsParticles;