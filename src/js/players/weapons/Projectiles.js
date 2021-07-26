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
        const particlesPerProjectile = 5;
        const positions = new Float32Array(projCount * particlesPerProjectile * 3);
        let i = 0;
        for(let p1=0; p1<projCount; p1++) {
            for(let p2=0; p2<particlesPerProjectile; p2++) {
                positions[i] = startPosX - p2 * 0.04;
                positions[i+1] = 0.1;
                positions[i+2] = startPosZ - p1;
                i += 3;
            }
        }
        const projGeo = new THREE.BufferGeometry();
        projGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3)); // This is used for the initial unused state (hidden from view)
        const particles = new THREE.Points(projGeo, this.material);
        this.sceneState.scenes[this.sceneState.curScene].add(particles);
    }

    _createParticleShader() {
        return new THREE.ShaderMaterial({
            uniforms: {
                color: { value: new THREE.Color(0xffffff) },
                uTime: { value: 0 },
                deltaTime: { value: 0 },
                diffuseTexture: { value: new THREE.TextureLoader().load(
                    this.sceneState.settings.assetsUrl + '/sprites/white_glow_64x64.png'
                )},
            },
            vertexShader: `
                uniform float uTime;

                void main() {
                    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                    gl_PointSize = 10.0;
                    gl_Position = projectionMatrix * mvPosition;
                }
            `,
            fragmentShader: `
                uniform sampler2D diffuseTexture;
                uniform vec3 color;

                void main() {
                    if(length(gl_PointCoord - vec2(0.5, 0.5)) > 0.475) discard;
                    gl_FragColor = vec4(color, 1.0);
                }
            `,
        });

    }
}

export default Projectiles;