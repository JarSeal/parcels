import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GUI } from 'three/examples/jsm/libs/dat.gui.module.js';
import * as Stats from './vendor/stats.min.js';

class Root {
    constructor() {
        this.sceneState = {};

        // Setup renderer [START]
        const renderer = new THREE.WebGLRenderer();
        renderer.setClearColor('#000000');
        const screenSize = this.getScreenResolution();
        renderer.setSize(screenSize.x, screenSize.y);
        renderer.domElement.id = 'main-stage';
        document.body.appendChild(renderer.domElement);
        this.renderer = renderer;
        // Setup renderer [/END]

        // Setup scene and basic lights [START]
        const scene = new THREE.Scene();
        const hemi = new THREE.HemisphereLight(0xffffbb, 0x080820, 0.65);
        hemi.position.set(32, -32, 5);
        scene.add(hemi);
        scene.add(new THREE.AmbientLight(0xffffff, 0.25));
        scene.add(new THREE.AxesHelper(10)); // Helper
        this.scene = scene;
        // Setup scene and basic lights [/END]

        // Setup camera and aspect ratio [START]
        this.aspectRatio = screenSize.x / screenSize.y;
        const camera = new THREE.PerspectiveCamera(45, this.aspectRatio, 0.1, 64);
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.update();
        this.controls = controls;
        this.camera = camera;
        // Setup camera and aspect ratio [/END]

        // Setup debug statisctics [START]
        const createStats = () => {
            const s = new Stats();
            s.setMode(0);
            return s;
        };
        this.stats = createStats();
        this.stats.domElement.id = 'debug-stats-wrapper';
        document.body.appendChild(this.stats.domElement);
        // Setup debug statisctics [/END]

        // Other setup [START]
        this.sceneState.clock = new THREE.Clock(),
        this.sceneState.resizeFns = [this.resize],
        this.sceneState.getScreenResolution = this.getScreenResolution;
        this.sceneState.defaultSettings = {
            showStats: true
        };
        this.sceneState.settings = { ...this.sceneState.defaultSettings };
        this.initResizer();
        // Other setup [/END]

        // GUI setup [START]
        const gui = new GUI();
        gui.close();
        gui.add(this.sceneState.settings, 'showStats').name('Show stats').onChange((value) => {
            document.getElementById('debug-stats-wrapper').style.display = value ? 'block' : 'none';
        });
        this.sceneState.gui = gui;
        // GUI setup [/END]

        this.runApp(scene, camera);
    }

    runApp(scene, camera) {

        // Main app logic [START]
        camera.position.set(1, 1, 10);
        camera.lookAt(new THREE.Vector3(0, 0, 0));

        // Add ground
        const groundGeo = new THREE.BoxBufferGeometry(5, 0.2, 2);
        const groundMat = new THREE.MeshLambertMaterial({ color: 0x666666 });
        const groundMesh = new THREE.Mesh(groundGeo, groundMat);
        groundMesh.position.set(0, -0.1, 0);
        scene.add(groundMesh);

        // Add a box
        const boxGeo = new THREE.BoxBufferGeometry(1, 1, 1);
        const boxMat = new THREE.MeshLambertMaterial({ color: 0x999999 });
        const boxMesh = new THREE.Mesh(boxGeo, boxMat);
        boxMesh.position.set(0, 0.5, 0);
        scene.add(boxMesh);

        // Main app logic [/END]

        this.resize(this.sceneState, this.renderer);
        this.renderLoop();

    }

    renderLoop = () => {
        requestAnimationFrame(this.renderLoop);
        // const delta = this.sceneState.clock.getDelta();
        this.renderer.render(this.scene, this.camera);
        if(this.sceneState.settings.showStats) this.stats.update(); // Debug statistics
    }

    resize(sceneState, renderer) {
        const width = sceneState.getScreenResolution().x;
        const height = sceneState.getScreenResolution().y;
        const pixelRatio = window.devicePixelRatio || 1;
        document.getElementsByTagName('body')[0].style.width = width + 'px';
        document.getElementsByTagName('body')[0].style.height = height + 'px';
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        renderer.setSize(width, height);
        renderer.setPixelRatio(pixelRatio);
    }

    initResizer() {
        let resizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                let i;
                const fns = this.sceneState.resizeFns,
                    fnsLength = fns.length;
                for(i=0; i<fnsLength; i++) {
                    fns[i](
                        this.sceneState,
                        this.renderer,
                        this.scene,
                        this.camera
                    );
                }
            }, 500);
        });
    }

    getScreenResolution() {
        return {
            x: Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0),
            y: Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0)
        };
    }
}

new Root();