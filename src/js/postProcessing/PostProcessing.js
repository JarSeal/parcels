import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader.js';
import { SMAAPass } from 'three/examples/jsm/postprocessing/SMAAPass.js';

class PostProcessing {
    constructor(sceneState) {
        this.sceneState = sceneState;
        // this.composer = new EffectComposer(sceneState.renderer);
        // this._addRenderPass();
        // this._addFXAA();
        // this._addSMAA();
    }

    _addRenderPass() {
        const curScene = this.sceneState.curScene;
        const renderPass = new RenderPass(
            this.sceneState.scenes[curScene],
            this.sceneState.cameras[curScene]
        );
        this.composer.addPass(renderPass);
    }

    _addFXAA() {
        const ss = this.sceneState;
        if(ss.settings.aa.rendererAA) return;
        const fxaaPass = new ShaderPass(FXAAShader);
        const pixelRatio = ss.renderer.getPixelRatio();
        const container = document.getElementById('main-stage');
        fxaaPass.material.uniforms['resolution'].value.x = 1 / (container.offsetWidth * pixelRatio);
        fxaaPass.material.uniforms['resolution'].value.y = 1 / (container.offsetHeight * pixelRatio);
        this.composer.addPass(fxaaPass);
        fxaaPass.enabled = ss.settings.aa.fxaa;
        ss.settingsClass.addUserSetting(
            'boolean',
            ss.settings.aa,
            'fxaa',
            'Use FXAA',
            'Antialiasing',
            (value) => {
                fxaaPass.enabled = value;
                ss.LStorage.setItem('fxaa', value);
            }
        );
    }

    _addSMAA() {
        const ss = this.sceneState;
        if(ss.settings.aa.rendererAA) return;
        const pixelRatio = ss.renderer.getPixelRatio();
        const container = document.getElementById('main-stage');
        const smaaPass = new SMAAPass(container.offsetWidth * pixelRatio, container.offsetHeight * pixelRatio);
        this.composer.addPass(smaaPass);
        smaaPass.enabled = ss.settings.aa.smaa;
        ss.settingsClass.addUserSetting(
            'boolean',
            ss.settings.aa,
            'smaa',
            'Use SMAA',
            'Antialiasing',
            (value) => {
                smaaPass.enabled = value;
                ss.LStorage.setItem('smaa', value);
            }
        );
    }

    getComposer() {
        return this.composer;
    }
}

export default PostProcessing;