import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader.js';

class PostProcessing {
    constructor(sceneState) {
        this.sceneState = sceneState;
        this.composer = new EffectComposer(sceneState.renderer);
        this._addRenderPass();
        this._addFXAA();
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
        const fxaaPass = new ShaderPass(FXAAShader);
        const pixelRatio = this.sceneState.renderer.getPixelRatio();
        const container = document.getElementById('main-stage');
		fxaaPass.material.uniforms['resolution'].value.x = 1 / (container.offsetWidth * pixelRatio);
		fxaaPass.material.uniforms['resolution'].value.y = 1 / (container.offsetHeight * pixelRatio);
        this.composer.addPass(fxaaPass);
        // fxaaPass.enabed = false;
        this.sceneState.settingsClass.addUserSetting({});
    }

    runComposer() {
        return this.composer;
    }
}

export default PostProcessing;