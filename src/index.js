// aframe-terrain-plain - An A-Frame WebVR primitive with high-resolution terrain surrounded by a low-res plain
// Copyright © 2019 P. Douglas Reeder under the MIT License
// Written using Perlin noise & ideas from aframe-mountain-component by Kevin Ngo.

import ImprovedNoise from './ImprovedNoise';

AFRAME.registerGeometry('terrain-plain', {
    schema: {
        middleRadius: {type: 'number', default: 100, min: 10},
        unitSize: {type: 'number', default: 1, min: 0.1, max: 1000},
        far: {type: 'number', default: 4000},
        color: {type: 'color'},
        seaColor: {type: 'color'},
        log: {type: 'boolean', default: false}
    },
    init: function (data) {
        const perlin = new ImprovedNoise();
        const SEED = Math.random() * 100;
        const SQRT3HALF = Math.sqrt(3) / 2;

        const SIZE = Math.round(data.middleRadius / data.unitSize);
        const UNIT_SIZE = data.middleRadius / SIZE;

        const INNER_RADIUS = (SIZE-1) * UNIT_SIZE + 0.0001;
        const OUTER_RADIUS = (SIZE+1) * UNIT_SIZE + 0.0001;
        const FAR = data.far > OUTER_RADIUS ? data.far : OUTER_RADIUS;
        const PLATEAU_EDGE = INNER_RADIUS / 4;
        const SCAN_SIZE = Math.ceil(SIZE * 1.16);   // empirically determined

        const COLOR = new THREE.Color(data.color);
        const SEA_COLOR = new THREE.Color(data.seaColor);

        if (data.log) {
            console.log("terrain-plain", "SIZE="+SIZE, "SCAN_SIZE="+SCAN_SIZE, "UNIT_SIZE="+UNIT_SIZE,
                "middleRadius="+data.middleRadius, "FAR="+FAR);
        }

        let geometry = new THREE.Geometry();

        let vertexLookup = {};
        vertexLookup[-SCAN_SIZE-1] = {};
        let vertexInd = 0;
        for (let i= -SCAN_SIZE; i<=SCAN_SIZE; ++i) {
            vertexLookup[i] = {};
            for (let j= -SCAN_SIZE; j<=SCAN_SIZE; ++j) {
                let x = i * SQRT3HALF * UNIT_SIZE;
                let z = (j - i/2) * UNIT_SIZE;
                let r = Math.sqrt(x*x + z*z);
                if (r <= OUTER_RADIUS) {
                    let y;
                    if (r <= INNER_RADIUS) {
                        y = 10;
                        // generates smooth noisy terrain
                        for (let quality = 25; quality <= 1500; quality *= 5) {
                            y += perlin.noise((x+data.middleRadius) / quality, (z+data.middleRadius) / quality, SEED) * Math.min(quality / 2, 150);
                        }

                        y *= Math.min(INNER_RADIUS - r, PLATEAU_EDGE) / PLATEAU_EDGE;

                        if (y > 0) {
                            let quality = 5;
                            y += perlin.noise((x + data.middleRadius) / quality, (z + data.middleRadius) / quality, SEED) * quality / 2;
                        }

                        // flattens the bottom, so it's continuous with the plain
                        if (y < 0) {
                            y = 0;
                        }
                    } else if (r <= data.middleRadius) {
                        y = 0;
                    } else {
                        x *= FAR / r;
                        z *= FAR / r;
                        y = 0;
                    }

                    vertexLookup[i][j] = vertexInd++;
                    geometry.vertices.push(new THREE.Vector3(x, y, z));

                    let vertexAInd = vertexInd - 1;
                    let vertexAColor = y ? COLOR : SEA_COLOR;

                    let vertexBInd = vertexLookup[i][j-1];
                    let vertexB = geometry.vertices[vertexBInd];
                    let vertexBColor;
                    if (typeof vertexB !== 'undefined') {
                        vertexBColor = vertexB.y ? COLOR : SEA_COLOR;
                    }

                    let vertexCInd = vertexLookup[i-1][j-1];
                    let vertexC = geometry.vertices[vertexCInd];
                    let vertexCColor;
                    if (typeof vertexC !== 'undefined') {
                        vertexCColor = vertexC.y ? COLOR : SEA_COLOR;
                    }

                    let vertexDInd = vertexLookup[i-1][j];
                    let vertexD = geometry.vertices[vertexDInd];
                    let vertexDColor;
                    if (typeof vertexD !== 'undefined') {
                        vertexDColor = vertexD.y ? COLOR : SEA_COLOR;
                    }

                    if (typeof vertexBInd !== 'undefined' && typeof vertexCInd !== 'undefined') {
                        let face = new THREE.Face3(vertexAInd, vertexBInd, vertexCInd);
                        // face.vertexColors[0] = vertexAColor;
                        // face.vertexColors[1] = vertexBColor;
                        // face.vertexColors[2] = vertexCColor;
                        if (y || vertexB.y || vertexC.y) {
                            face.color.set(COLOR);
                        } else {
                            face.color.set(SEA_COLOR);
                        }
                        geometry.faces.push(face);
                    }
                    if (typeof vertexCInd !== 'undefined' && typeof vertexDInd !== 'undefined') {
                        let face = new THREE.Face3(vertexAInd, vertexCInd, vertexDInd);
                        // face.vertexColors[0] = vertexAColor;
                        // face.vertexColors[1] = vertexCColor;
                        // face.vertexColors[2] = vertexDColor;
                        if (y || vertexC.y || vertexD.y) {
                            face.color.set(COLOR);
                        } else {
                            face.color.set(SEA_COLOR);
                        }
                        geometry.faces.push(face);
                    }
                }
            }
        }
        geometry.computeBoundingBox();
        geometry.mergeVertices();
        geometry.computeFaceNormals();
        geometry.computeVertexNormals();
        this.geometry = geometry;
    }
});


AFRAME.registerPrimitive('a-terrain-plain', {
    defaultComponents: {
        geometry: {
            primitive: 'terrain-plain',
            middleRadius: 100,
            unitSize: 1,
            log: false
        },
        material: {
            vertexColors: 'vertex'
        }
    },

    mappings: {
        'middle-radius': 'geometry.middleRadius',
        'unit-size': 'geometry.unitSize',
        'far': 'geometry.far',
        'log': 'geometry.log',
        'shader': 'material.shader',
        'color': 'geometry.color',
        'sea-color': 'geometry.seaColor',
        'metalness': 'material.metalness',
        'roughness': 'material.roughness',
        'src': 'material.src',
        'flat-shading': 'material.flatShading'
    }
});
