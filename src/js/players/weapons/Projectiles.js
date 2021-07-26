import * as THREE from 'three';

class Projectiles {
    constructor(sceneState) {
        this.sceneState = sceneState;
        this.material = this._createParticleShader();
        sceneState.shadersToUpdate.push({ material: this.material });
        sceneState.shadersToUpdateLength++;
        this._initProjectiles();
    }

    _initProjectiles() {
        // Init points here:
        // Create a large number of points (float32 attributes as vertices for the BufferGeometry)
        // (let's say about 30 x 100 = 3000, this means 30 simultaneous projectiles)
        // Add a COLOR uniform (THREE.Color) for each projectile.
        // Add a FROM uniform (THREE.Vector3) for each projectile.
        // Add a TO uniform (THREE.Vector3) for each projectile.
        // Add a SPEED uniform (float) for each projectile.
        // Add a HIT uniform (boolean) for each projectile.
        // Every uniform is an array where each index represents a projectile.

        const startPosX = 15;
        const startPosZ = 4;

        const projCount = 2;
        const particlesPerProjectile = 100;
        const positions = new Float32Array(projCount * particlesPerProjectile * 3);
        const delays = new Float32Array(projCount * particlesPerProjectile);
        let i = 0;
        for(let p1=0; p1<projCount; p1++) {
            for(let p2=0; p2<particlesPerProjectile; p2++) {
                positions[i] = startPosX;
                positions[i+1] = 1;
                positions[i+2] = startPosZ - p1;
                delays[p2+p1*particlesPerProjectile] = p2 * 0.04 * Math.random();
                i += 3;
            }
        }
        const projGeo = new THREE.BufferGeometry();
        projGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3)); // This is used for the initial unused state (hidden from view)
        projGeo.setAttribute('delay', new THREE.BufferAttribute(delays, 1));
        const particles = new THREE.Points(projGeo, this.material);
        this.sceneState.scenes[this.sceneState.curScene].add(particles);
    }

    _createParticleShader() {
        return new THREE.ShaderMaterial({
            uniforms: {
                uColor: { value: new THREE.Color(0xff0000) },
                uTime: { value: 0 },
                uStartTime: { value: performance.now() },
                uDeltaTime: { value: 0 },
                diffuseTexture: { value: new THREE.TextureLoader().load(
                    this.sceneState.settings.assetsUrl + '/sprites/orange_glow2_256x256.png'
                )},
            },
            depthTest: true,
            depthWrite: false,
            transparent: true,
            blending: THREE.AdditiveBlending,
            vertexShader: `
                attribute float delay;
                uniform float uStartTime;
                uniform float uTime;
                varying float timePhase;
                varying float _delay;

                const float LIFETIME = 1000.0;

                void main() {
                    float timeElapsed = uTime - uStartTime;
                    timePhase = mod(timeElapsed, LIFETIME * delay);
                    float newPosX = position.x - 0.002 * timePhase;
                    vec4 mvPosition = modelViewMatrix * vec4(newPosX, position.y, position.z, 1.0);
                    vec4 vertexPosition = projectionMatrix * mvPosition;
                    gl_PointSize = 500.0 * (1.0 - (timePhase / LIFETIME * delay)) / distance(vertexPosition, mvPosition);
                    gl_Position = vertexPosition;
                }
            `,
            fragmentShader: `
                uniform sampler2D diffuseTexture;
                uniform vec3 uColor;
                varying float timePhase;
                varying float _delay;

                void main() {
                    if(length(gl_PointCoord - vec2(0.5, 0.5)) > 0.475) discard;
                    // gl_FragColor = vec4(color, 1.0);
                    gl_FragColor = texture2D(diffuseTexture, gl_PointCoord) * vec4(
                        1.0 - (timePhase / 1000.0),
                        1.0 - (timePhase / 200.0),
                        1.0 - (timePhase / 200.0)
                    , 1.0);
                    // gl_FragColor = texture2D(diffuseTexture, gl_PointCoord);
                }
            `,
        });

    }
}

export default Projectiles;