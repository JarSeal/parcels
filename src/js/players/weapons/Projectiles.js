class Projectiles {
    constructor(sceneState) {
        this.sceneState = sceneState;
        this._initProjectiles();
    }

    _initProjectiles() {
        console.log('TADAA!');

        // Init points here:
        // Create a large number of points (float32 attributes as vertices for the BufferGeometry)
        // (let's say about 30 x 100 = 3000, this means 30 simultaneous projectiles)
        // Add a COLOR uniform (THREE.Color) for each projectile.
        // Add a FROM uniform (THREE.Vector3) for each projectile.
        // Add a TO uniform (THREE.Vector3) for each projectile.
        // Add a SPEED uniform (float) for each projectile.
        // Add a HIT uniform (boolean) for each projectile.
        // Every uniform is an array where each index represents a projectile.
    }
}

export default Projectiles;