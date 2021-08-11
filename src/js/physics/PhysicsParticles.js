import * as THREE from 'three';

class PhysicsParticles {
    constructor(sceneState) {
        this.sceneState = sceneState;
        this.maxParticles = this.sceneState.physics.particlesCount;
        this.subParticlesPerParticle = 3;
        this.nextPartIndex = 0;
        this.sceneState.levelAssets.fxTextures['sparks'] = {
            url: this.sceneState.settings.assetsUrl + '/sprites/orange_glow_256x256.png',
            texture: null,
        };
        this.material;
        this.particles;
    }

    initParticles() {
        this.material = this._createParticleShader();
        const partCount = this.maxParticles;
        const particlesPerParticle = this.subParticlesPerParticle;
        const positions = new Float32Array(partCount * particlesPerParticle * 3);
        const indexes = new Float32Array(partCount * particlesPerParticle);
        const randoms = new Float32Array(partCount * particlesPerParticle);
        let i = 0;
        for(let p1=0; p1<partCount; p1++) {
            for(let p2=0; p2<particlesPerParticle; p2++) {
                indexes[p1*particlesPerParticle+p2] = p1;
                randoms[p1*particlesPerParticle+p2] = p1;
                positions[i] = 0;
                positions[i+1] = 0;
                positions[i+2] = 0;
                i += 3;
            }
        }
        const projGeo = new THREE.BufferGeometry();
        projGeo.setAttribute('partindex', new THREE.BufferAttribute(indexes, 1));
        projGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3)); // This is used for the initial unused state (hidden from view)
        projGeo.setAttribute('random', new THREE.BufferAttribute(randoms, 1));
        this.particles = new THREE.Points(projGeo, this.material);
        this.particles.frustumCulled = false;
        this.sceneState.scenes[this.sceneState.curScene].add(this.particles);
    }

    updatePosition(index, pos) {
        if(!this.material) return;
        this.material.uniforms.uPositions.value[index].x = pos[0];
        this.material.uniforms.uPositions.value[index].y = pos[1];
        this.material.uniforms.uPositions.value[index].z = pos[2];
    }

    _createParticleShader() {
        let pixelRatio = window.devicePixelRatio;
        const material = new THREE.ShaderMaterial({
            uniforms: {
                uColors: { value: this._initShaderPart('color') },
                uTime: { value: 0 },
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
                attribute float random;
                uniform float uStartTime;
                uniform float uTime;
                uniform vec3 uPositions[${this.maxParticles}];
                uniform vec3 uColors[${this.maxParticles}];
                uniform float scale;
                varying vec3 vColor;

                void main() {
                    int intIndex = int(partindex);
                    vColor = uColors[intIndex];
                    vec3 pos = uPositions[intIndex];
                    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
                    vec4 vertexPosition = projectionMatrix * mvPosition;
                    gl_PointSize = 0.25 * (scale / length(-mvPosition.xyz));
                    gl_Position = vertexPosition;
                }
            `,
            fragmentShader: `
                uniform sampler2D diffuseTexture;
                varying vec3 vColor;

                void main() {
                    gl_FragColor = texture2D(diffuseTexture, gl_PointCoord);
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
        }
        return returnArray;
    }
}

export default PhysicsParticles;