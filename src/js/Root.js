import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import CannonHelper from './vendor/CannonHelper';
import Settings from './settings/Settings';
import Utils from './utils/Utils';
import Logger from './utils/Logger';
import PostProcessing from './postProcessing/PostProcessing';
import levelData from './data/dummyLevel01';
import userPlayerData from './data/userPlayerData';
import ModelLoader from './loaders/ModelLoader';
import LevelLoader from './loaders/LevelLoader';
import Player from './players/Player';
import UserControls from './controls/UserControls';
// import Worker from 'web-worker';

class Root {
    constructor() {
        this.sceneState = {
            curLevelId: 'levelDummy01',
            curScene: 'level',
            curFloor: 0,
        };
        this.utils = new Utils();
        this.sceneState.utils = this.utils;
        this.sceneState.logger = new Logger(this.sceneState);

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
        this.requestDelta = 0;
        this.logicDelta = 0;
        this.renderDelta = 0;
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
            level: scene,
        };
        // Setup scene and basic lights [/END]

        // Setup camera and aspect ratio [START]
        this.aspectRatio = screenSize.x / screenSize.y;
        const camera = new THREE.PerspectiveCamera(45, this.aspectRatio, 0.5, 128);
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.update();
        this.controls = controls;
        this.camera = camera;
        camera.userData.followXOffset = 10;
        camera.userData.followYOffset = 17;
        camera.userData.followZOffset = 10;
        this.sceneState.cameras = {
            level: camera,
        };
        this.sceneState.orbitControls = controls;
        // Setup camera and aspect ratio [/END]

        // Setup physics (cannon.js) [START]
        const world = new CANNON.World();
        world.allowSleep = true;
        world.gravity.set(0, -9.82, 0);
        // world.broadphase = new CANNON.SAPBroadphase(world);
        world.iterations = 10;
        world.solver.iterations = 10;
        this.sceneState.physics = {};
        this.sceneState.physics.world = world;
        this.sceneState.physics.timeStep = 1 / 60;
        this.sceneState.physics.addShape = this.addShapeToPhysics; // CHECK WHETHER OR NOT NEEDED!
        this.sceneState.physics.newShape = this.newPhysicsShape;
        this.sceneState.physics.movingShapes = [];
        this.sceneState.physics.movingShapesLength = 0;
        this.sceneState.physics.staticShapes = [];
        this.sceneState.physics.staticShapesLength = 0;
        this.tempShapes = {};
        this.sceneState.physics.positions = new Float32Array(100 * 7);
        this.sceneState.physics.quaternions = new Float32Array(100 * 7);
        this.sceneState.physics.removeShape = this.removePhysicsShape;
        this.sceneState.physics.shapes = [];
        this.sceneState.physics.shapesLength = 0;
        // this.sceneState.isGroundMeshes = []; // CHECK WHETHER OR NOT NEEDED!
        this.world = world;
        this.sceneState.physics.helper = new CannonHelper(scene, world);
        this.helper = this.sceneState.physics.helper;
        this.lastCallTime = performance.now() / 1000;
        // Setup physics (cannon.js) [/END]

        // Settings [START]
        const settings = new Settings(this.sceneState);
        this.stats = settings.createStats();
        settings.setAA(rendererAA);
        this.sceneState.settingsClass = settings;
        // Settings [/END]

        // Other setup [START]
        this.sceneState.clock = new THREE.Clock();
        this.sceneState.pp = new PostProcessing(this.sceneState);
        this.sceneState.resizeFns = [this._resize];
        this.levelLoader = new LevelLoader(this.sceneState);
        this._initResizer();
        // Other setup [/END]

        // Webworkers [START]
        this.workerSendTime = 0;
        this.worker = new Worker('./webworkers/physics.js');
        this.sceneState.additionalWorkerData = [];
        this._initPhysicsWorker(camera);
        // Webworkers [/ END]
    }

    _runApp(camera) {

        this.levelLoader.load(this.sceneState.curLevelId);
        
        const modelLoader = new ModelLoader(this.sceneState);
        modelLoader.loadModel(levelData);

        const userPlayer = new Player(this.sceneState, userPlayerData);
        userPlayer.create();
        new UserControls(this.sceneState, userPlayer);

        const playerPos = this.sceneState.players[this.sceneState.userPlayerId].position;
        camera.position.set(
            camera.userData.followXOffset + playerPos[0],
            camera.userData.followYOffset + playerPos[1],
            camera.userData.followZOffset + playerPos[2]
        );
        camera.lookAt(new THREE.Vector3(playerPos[0], playerPos[1], playerPos[2]));

        this._resize(this.sceneState);
        this.sceneState.settingsClass.endInit();
        this.lastCallTime = performance.now() / 1000;
        this.renderLoop();

    }

    renderLoop = () => {
        const ss = this.sceneState;
        const delta = ss.clock.getDelta();
        this.requestDelta = ss.clock.getDelta();
        requestAnimationFrame(() => {
            setTimeout(() => {
                this.renderLoop();
            }, 0);
        });
        // const unscaledTimeStep = (this.requestDelta + this.renderDelta + this.logicDelta);
        // let timeStep = unscaledTimeStep; // * 1 = time scale
        // timeStep = Math.max(timeStep, 0.03333333); // = 1 / 30 (min 30 fps)
        // this._updatePhysics();
        this.logicDelta = ss.clock.getDelta(); // Measuring logic time
        ss.pp.getComposer().render();
        // this._renderPlayers(delta, ss);
        if(ss.settings.debug.showStats) this.stats.update(); // Debug statistics
        this.renderDelta = ss.clock.getDelta(); // Measuring render time
    }

    _renderPlayers(timeStep, ss) {
        let i = 0;
        const c = ss.playerKeysCount,
            k = ss.playerKeys,
            p = ss.players;
        for(i=0; i<c; i++) {
            p[k].render(timeStep);
        }
    }

    _resize(sceneState) {
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

    _initResizer() {
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

    _updatePhysics = () => {
        const time = performance.now() / 1000;
        let i, shape;
        const l = this.sceneState.physics.shapesLength,
            s = this.sceneState.physics.shapes,
            settings = this.sceneState.settings,
            dt = time - this.lastCallTime;
        this.world.step(
            this.sceneState.physics.timeStep,
            dt
        );
        for(i=0; i<l; i++) {
            shape = s[i];
            shape.updateFn(shape);
        }
        if(settings.physics.showPhysicsHelpers) this.helper.update();
        this.lastCallTime = time;
    }

    addShapeToPhysics = (object, moving, helperColor) => {
        const mesh = object.mesh,
            body = object.body,
            updateFn = object.updateFn || null,
            id = 'phyShape-' + performance.now();
        mesh.name = id;
        body.bodyID = id;
        if(!this.sceneState.settings.physics.showPhysicsHelpers) this.scene.add(mesh);
        this.world.addBody(body);
        if(moving) {
            this.sceneState.physics.shapes.push({ id, mesh, body, updateFn });
        }
        this.sceneState.physics.shapesLength = this.sceneState.physics.shapes.length;
        if(this.sceneState.settings.physics.showPhysicsHelpers) {
            let color = helperColor;
            if(!color) moving ? color = 0xFF0000 : color = 0xFFFFFFF;
            this.helper.addVisual(body, color);
        }
    }

    newPhysicsShape = (shapeData) => {
        if(!shapeData) this.sceneState.logger.error('Trying to add new shape, but shapeData is missing (Root.js).');
        let id = shapeData.id;
        if(!id) {
            id = 'phyShape-' + performance.now();
            shapeData.id = id;
        }
        this.tempShapes[id] = shapeData;
        this.sceneState.additionalWorkerData.push({
            phase: 'addShape',
            shape: {
                type: shapeData.type,
                id: shapeData.id,
                moving: shapeData.moving,
                mass: shapeData.mass,
                size: shapeData.size,
                position: shapeData.position,
                quaternion: shapeData.quaternion,
                rotation: shapeData.rotation,
                material: shapeData.material,
                sleep: shapeData.sleep,
                characterData: shapeData.characterData
                    ? {
                        speed: shapeData.characterData.speed,
                        direction: shapeData.characterData.direction,
                        userPlayer: shapeData.characterData.userPlayer,
                    } : null
            },
        });
    }

    removePhysicsShape = (id) => {
        id;
    }

    _requestPhysicsFromWorker = () => {
        this.workerSendTime = performance.now();
        const sendObject = {
            timeStep: this.sceneState.physics.timeStep,
            positions: this.sceneState.physics.positions,
            quaternions: this.sceneState.physics.quaternions,
        };
        const additionals = this.sceneState.additionalWorkerData;
        if(additionals.length) {
            sendObject.additionals = [ ...additionals ];
            this.sceneState.additionalWorkerData = [];
        }
        this.worker.postMessage(
            sendObject,
            [this.sceneState.physics.positions.buffer, this.sceneState.physics.quaternions.buffer]
        );
    }

    _updateRenderShapes(data) {
        const positions = data.positions;
        const quaternions = data.quaternions;
        this.sceneState.physics.positions = positions;
        this.sceneState.physics.quaternions = quaternions;
        const shapes = this.sceneState.physics.movingShapes;
        const shapesL = this.sceneState.physics.movingShapesLength;
        let i;
        for(i=0; i<shapesL; i++) {
            const s = shapes[i];
            s.mesh.position.set(
                positions[i * 3],
                positions[i * 3 + 1],
                positions[i * 3 + 2]
            );
            if(!s.characterData) {
                s.mesh.quaternion.set(
                    quaternions[i * 4],
                    quaternions[i * 4 + 1],
                    quaternions[i * 4 + 2],
                    quaternions[i * 4 + 3]
                );
            }
            if(s.updateFn) s.updateFn(s);
        }
        const delay = this.sceneState.physics.timeStep * 1000 - (performance.now() - this.workerSendTime);
        setTimeout(this._requestPhysicsFromWorker, Math.max(delay, 0));
    }

    _initPhysicsWorker(camera) {
        this.worker.postMessage({
            init: true,
            initParams: {
                allowSleep: true,
                gravity: [0, -9.82, 0],
                iterations: 10,
                solverTolerance: 0.001,
            },
        });
        this.worker.addEventListener('message', (e) => {
            if(e.data.loop) {
                this._updateRenderShapes(e.data);
            } else if(e.data.additionals && e.data.additionals.length) {
                this._handleAdditionalsForMainThread(e.data.additionals);
                this._updateRenderShapes(e.data);
            } else if(e.data.initPhysicsDone) {
                this.sceneState.physics.initiated = true;
                this._requestPhysicsFromWorker();
            } else if(e.data.error) {
                this.sceneState.logger.error(e.data.error);
            }
        });
        this.worker.addEventListener('error', (e) => {
            this.sceneState.logger.error(e.message);
        });

        this._runApp(camera);
    }

    _handleAdditionalsForMainThread(additionals) {
        const aLength = additionals.length;
        let i;
        for(i=0; i<aLength; i++) {
            const a = additionals[i];
            if(a.phase === 'addShape') {
                const s = this.tempShapes[a.shape.id];
                if(s.moving) {
                    if(s.characterData) {
                        if(s.characterData.userPlayer) {
                            this.sceneState.userPlayerIndex = this.sceneState.physics.movingShapesLength;
                        }
                        s.characterData.bodyIndex = this.sceneState.physics.movingShapesLength;
                    }
                    this.sceneState.physics.movingShapes.push(s);
                    this.sceneState.physics.movingShapesLength++;
                } else {
                    this.sceneState.physics.staticShapes.push(s);
                    this.sceneState.physics.staticShapesLength++;
                }
            }
        }
        this.tempShapes = {};
    }
}

new Root();