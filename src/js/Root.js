import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import Settings from './settings/Settings';
import Utils from './utils/Utils';
import PostProcessing from './postProcessing/PostProcessing';
import levelData from './data/dummyLevel01';
import userPlayerData from './data/userPlayerData';
import ModelLoader from './loaders/ModelLoader';
import Player from './players/Player';
import UserControls from './controls/UserControls';

class Root {
    constructor() {
        this.sceneState = {
            curScene: 'ship',
        };
        this.utils = new Utils();

        // Setup renderer [START]
        const urlParams = new URLSearchParams(window.location.search);
        const rendererAA = urlParams.get('aa');
        const renderer = new THREE.WebGLRenderer({ antialias: rendererAA === '1' });
        renderer.setClearColor('#ffffff');
        const screenSize = this.utils.getScreenResolution();
        renderer.setSize(screenSize.x, screenSize.y);
        renderer.domElement.id = 'main-stage';
        document.body.appendChild(renderer.domElement);
        this.renderer = renderer;
        this.sceneState.renderer = renderer;
        // Setup renderer [/END]

        // Setup scene and basic lights [START]
        const scene = new THREE.Scene();
        scene.add(new THREE.AmbientLight(0xffffff, 1));
        const hemiLight = new THREE.HemisphereLight(0xffffbb, 0x080820, 0.5);
        hemiLight.position.set(32, -32, 5);
        scene.add(hemiLight);
        this.sceneState.axesHelper = new THREE.AxesHelper(100);
        scene.add(this.sceneState.axesHelper);
        this.scene = scene;
        this.sceneState.scenes = {
            ship: scene,
        };
        // Setup scene and basic lights [/END]

        // Setup camera and aspect ratio [START]
        this.aspectRatio = screenSize.x / screenSize.y;
        const camera = new THREE.PerspectiveCamera(45, this.aspectRatio, 0.5, 128);
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.update();
        this.controls = controls;
        this.camera = camera;
        this.sceneState.cameras = {
            ship: camera,
        };
        // Setup camera and aspect ratio [/END]

        // Settings [START]
        const settings = new Settings(this.sceneState);
        this.stats = settings.createStats();
        settings.setAA(rendererAA);
        this.sceneState.settingsClass = settings;
        // Settings [/END]

        // Other setup [START]
        this.sceneState.clock = new THREE.Clock();
        this.sceneState.pp = new PostProcessing(this.sceneState);
        this.sceneState.resizeFns = [this.resize];
        this.initResizer();
        // Other setup [/END]

        this.runApp(scene, camera);
    }

    runApp(scene, camera) {

        // Add ground
        const groundGeo = new THREE.BoxBufferGeometry(5, 0.2, 2);
        const groundMat = new THREE.MeshLambertMaterial({ color: 0x666666 });
        const groundMesh = new THREE.Mesh(groundGeo, groundMat);
        groundMesh.position.set(0, -0.1, 0);
        // scene.add(groundMesh);

        // Add a box
        const boxGeo = new THREE.BoxBufferGeometry(1, 1, 1);
        const boxMat = new THREE.MeshLambertMaterial({ color: 0x999999 });
        const boxMesh = new THREE.Mesh(boxGeo, boxMat);
        boxMesh.position.set(0, 0.5, 0);
        // scene.add(boxMesh);

        for(let i=0; i<32; i++) {
            const newBox = new THREE.Mesh(boxGeo, boxMat);
            const randomScale = parseFloat((Math.random() * (2.0000 - 0.4000) + 0.4000).toFixed(4));
            newBox.scale.set(randomScale, randomScale, randomScale);
            let randomPosX = parseFloat((Math.random() * (5.0000 - 0.4000) + 0.4000).toFixed(4));
            let randomPosY = parseFloat((Math.random() * (5.0000 - 0.4000) + 0.4000).toFixed(4));
            let randomPosZ = parseFloat((Math.random() * (5.0000 - 0.4000) + 0.4000).toFixed(4));
            newBox.position.set(
                Math.random() < 0.5 ? randomPosX * -1 : randomPosX,
                randomPosY,
                Math.random() < 0.5 ? randomPosZ * -1 : randomPosZ);
            // scene.add(newBox);
        }

        const modelLoader = new ModelLoader(this.sceneState);
        modelLoader.loadModel(levelData);

        const userPlayer = new Player(this.sceneState, userPlayerData);
        userPlayer.create();
        new UserControls(this.sceneState, userPlayer);

        const playerPos = this.sceneState.players[this.sceneState.userPlayerId].position;
        camera.position.set(
            -10 + playerPos[0],
            17 + playerPos[1],
            -10 + playerPos[2]);
        camera.lookAt(new THREE.Vector3(playerPos[0], playerPos[1], playerPos[2]));

        this.resize(this.sceneState);
        this.sceneState.settingsClass.endInit();
        this.renderLoop();

    }

    renderLoop = () => {
        requestAnimationFrame(this.renderLoop);
        const ss = this.sceneState;
        // const delta = ss.clock.getDelta();
        ss.pp.getComposer().render();
        this._renderPlayers(ss);
        if(ss.settings.debug.showStats) this.stats.update(); // Debug statistics
    }

    _renderPlayers(ss) {
        let i = 0;
        const c = ss.playerKeysCount,
            k = ss.playerKeys,
            p = ss.players;
        for(i=0; i<c; i++) {
            p[k].render();
        }
    }

    resize(sceneState) {
        const reso = new Utils().getScreenResolution();
        const width = reso.x;
        const height = reso.y;
        const pixelRatio = window.devicePixelRatio || 1;
        sceneState.renderer.setPixelRatio(pixelRatio);
        document.getElementsByTagName('body')[0].style.width = width + 'px';
        document.getElementsByTagName('body')[0].style.height = height + 'px';
        const curScene = sceneState.curScene;
        sceneState.cameras[curScene].aspect = width / height;
        sceneState.cameras[curScene].updateProjectionMatrix();
        sceneState.renderer.setSize(width, height);
        sceneState.pp.getComposer().setSize(width, height);
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
                    fns[i](this.sceneState);
                }
            }, 500);
        });
    }
}

new Root();