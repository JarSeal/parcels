import * as THREE from 'three';

class Projectiles {
    constructor(sceneState) {
        this.sceneState = sceneState;
        this.particles;
        this.maxProjectiles = 100;
        this.material = this._createParticleShader();
        this.nextProjIndex = 0;
        this._initProjectiles();
    }

    _initProjectiles() {
        const projCount = this.maxProjectiles;
        const particlesPerProjectile = 30;
        const trailParticlesStart = 24;
        const trailParticlesStop = 30;
        const positions = new Float32Array(projCount * particlesPerProjectile * 3);
        const delays = new Float32Array(projCount * particlesPerProjectile);
        const projIndexes = new Float32Array(projCount * particlesPerProjectile);
        const trails = new Float32Array(projCount * particlesPerProjectile);
        let i = 0;
        for(let p1=0; p1<projCount; p1++) {
            for(let p2=0; p2<particlesPerProjectile; p2++) {
                projIndexes[p1*particlesPerProjectile+p2] = p1;
                delays[p1*particlesPerProjectile+p2] = p2 * 0.02;
                positions[i] = 0;
                positions[i+1] = 0;
                positions[i+2] = 0;
                if(p2 >= trailParticlesStart-1 && p2 <= trailParticlesStop-1) {
                    trails[p1*particlesPerProjectile+p2] = Math.random();
                } else {
                    trails[p1*particlesPerProjectile+p2] = 1.1;
                }
                i += 3;
            }
        }
        const projGeo = new THREE.BufferGeometry();
        projGeo.setAttribute('projindex', new THREE.BufferAttribute(projIndexes, 1));
        projGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3)); // This is used for the initial unused state (hidden from view)
        projGeo.setAttribute('delay', new THREE.BufferAttribute(delays, 1));
        projGeo.setAttribute('trails', new THREE.BufferAttribute(trails, 1));
        this.particles = new THREE.Points(projGeo, this.material);
        this.particles.frustumCulled = false;
        this.sceneState.scenes[this.sceneState.curScene].add(this.particles);
        setInterval(() => {
            this.newProjectile(
                new THREE.Vector3(12, 1, 4),
                new THREE.Vector3(17, 1, 4),
                5
            );
        }, 1500);
    }

    newProjectile(from, to, distance) {
        const index = this.nextProjIndex;
        const speed = 0.1;
        this.material.uniforms.uFroms.value[index] = from;
        this.material.uniforms.uTos.value[index] = to;
        this.material.uniforms.uDistances.value[index] = distance;
        this.material.uniforms.uSpeeds.value[index] = speed;
        this.material.uniforms.uStartTimes.value[index] = performance.now();
        this.nextProjIndex++;
        if(this.nextProjIndex > this.maxProjectiles-1) this.nextProjIndex = 0;
        setTimeout(() => {
            this.material.uniforms.uFroms.value[index] = new THREE.Vector3(0, 2000, 0);
            this.material.uniforms.uTos.value[index] = new THREE.Vector3(0, 2000, 0);
            this.material.uniforms.uDistances.value[index] = 0;
            this.material.uniforms.uSpeeds.value[index] = 0;
            this.material.uniforms.uStartTimes.value[index] = performance.now();
        }, speed * distance * 1000);
    }

    _createParticleShader() {
        let pixelRatio = window.devicePixelRatio;
        const material = new THREE.ShaderMaterial({
            uniforms: {
                uColors: { value: this._initShaderPart('color') },
                uTime: { value: 0 },
                uStartTimes: { value: this._initShaderPart('startTime') },
                uSpeeds: { value: this._initShaderPart('speed') },
                uDistances: { value: this._initShaderPart('distance') },
                // Create a uniform for travel time
                uFroms: { value: this._initShaderPart('position') },
                uTos: { value: this._initShaderPart('position') },
                uPixelRatio: { value: pixelRatio },
                scale: { type: 'f', value: window.innerHeight * pixelRatio / 2 },
                diffuseTexture: { value: new THREE.TextureLoader().load(                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                
                    this.sceneState.settings.assetsUrl + '/sprites/white_glow_256x256.png'
                )},
            },
            depthTest: true,
            depthWrite: false,
            transparent: true,
            blending: THREE.AdditiveBlending,
            vertexShader: `
                attribute float delay;
                attribute float projindex;
                attribute float trails;
                uniform float uStartTime;
                uniform float uTime;
                uniform vec3 uFroms[${this.maxProjectiles}];
                uniform vec3 uTos[${this.maxProjectiles}];
                uniform vec3 uColors[${this.maxProjectiles}];
                uniform float uStartTimes[${this.maxProjectiles}];
                uniform float uSpeeds[${this.maxProjectiles}];
                uniform float uDistances[${this.maxProjectiles}];
                uniform float uPixelRatio;
                uniform float scale;
                varying float vTimePhase;
                varying vec3 vColor;
                varying float vIsTrail;
                varying float vTrailTime;
                varying float vDelay;

                void main() {
                    int intIndex = int(projindex);
                    vColor = uColors[intIndex];
                    float speed = uSpeeds[intIndex];
                    float startTime = uStartTimes[intIndex] + delay * 1000.0 * speed;
                    float travelTime = speed * uDistances[intIndex] * 1000.0 + delay;
                    float timeElapsed = uTime - startTime;
                    vTimePhase = clamp(mod(timeElapsed, travelTime) / travelTime + floor(timeElapsed / travelTime), 0.0, 1.0);
                    vec3 from = uFroms[intIndex];
                    vec3 to = uTos[intIndex];
                    vIsTrail = clamp(floor(vTimePhase / trails), 0.0, 1.0);
                    float notTrail = 1.0 - vIsTrail;
                    vTrailTime = trails;
                    vDelay = delay;
                    vec3 trailPos = (to - from) * (trails + 0.2 * vTimePhase) * vIsTrail;
                    vec3 newPos = (to - from) * vTimePhase * notTrail;
                    vec4 mvPosition = modelViewMatrix * vec4(from + newPos + trailPos, 1.0);
                    vec4 vertexPosition = projectionMatrix * mvPosition;
                    float size = vIsTrail * 2.0 + notTrail * 0.58 * (1.0 - delay / 2.0);
                    // gl_PointSize = (size * uPixelRatio) / distance(vertexPosition, mvPosition);
                    // gl_PointSize = size * scale / distance(vertexPosition, mvPosition);
                    gl_PointSize = size * (scale / length(mvPosition.xyz));
                    gl_Position = vertexPosition;
                }
            `,
            fragmentShader: `
                uniform sampler2D diffuseTexture;
                varying float vTimePhase;
                varying vec3 vColor;
                varying float vIsTrail;
                varying float vTrailTime;
                varying float vDelay;

                void main() {
                    float alpha = 1.0 - (vTimePhase / clamp(vTrailTime + 0.7, 0.0, 1.0)) * vIsTrail;
                    gl_FragColor = texture2D(diffuseTexture, gl_PointCoord) * vec4(vColor + (0.5 - vDelay), alpha);
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
            for(let i=0; i<this.maxProjectiles; i++) {
                returnArray.push(new THREE.Color(0xff0000));
            }
        } else if(part === 'startTime') {
            for(let i=0; i<this.maxProjectiles; i++) {
                returnArray.push(performance.now());
            }
        } else if(part === 'speed') {
            for(let i=0; i<this.maxProjectiles; i++) {
                returnArray.push(0.15);
            }
        } else if(part === 'distance') {
            for(let i=0; i<this.maxProjectiles; i++) {
                returnArray.push(0);
            }
        } else if(part === 'position') {
            for(let i=0; i<this.maxProjectiles; i++) {
                returnArray.push(new THREE.Vector3(0, 2000, 0));
            }
        }
        return returnArray;
    }
}

export default Projectiles;