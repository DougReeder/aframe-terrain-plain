// vertex-color+noise.js - an A-Frame material which interpolates the vertex colors and then adds noise
// Copyright © 2019 P. Douglas Reeder under the MIT License

import vertexShader from './vertex-color+noise-vert.glsl'
import fragmentShader from './vertex-color+noise-frag.glsl'

AFRAME.registerShader('vertex-color+noise', {
    schema: {
        sunPosition: {type: 'vec3', default: {x:-1.0, y:1.0, z:-1.0}},
        timeMsec: {type: 'time', is: 'uniform'}
    },

    /**
     * `init` used to initialize material. Called once.
     */
    init: function (data) {
        // console.log("material-vertex-color+noise data:", data);
        let sunPos = new THREE.Vector3(data.sunPosition.x, data.sunPosition.y, data.sunPosition.z);
        this.material = new THREE.ShaderMaterial({
            uniforms: {
                sunNormal: {value: sunPos.normalize()},
                wavesOffset: {type: 'vec3', value: {x:0, y:0, z:0}},
            },
            vertexShader: vertexShader,
            fragmentShader: fragmentShader
        });
    },

    /**
     * `update` used to update the material. Called on initialization and when data updates.
     */
    update: function (data) {
        if (data.sunPosition) {
            let sunPos = new THREE.Vector3(data.sunPosition.x, data.sunPosition.y, data.sunPosition.z);
            this.material.uniforms.sunNormal.value = sunPos.normalize();
        }
        if (data.timeMsec) {
            let time = data.timeMsec / 1000;
            this.material.uniforms.wavesOffset.value = new THREE.Vector3(Math.sin(time), 0.0, Math.cos(time*1.33333));
        }
    },
});
