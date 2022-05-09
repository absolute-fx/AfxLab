import * as THREE from '../js/three.module.js';
import { FBXLoader } from '../js/jsm/loaders/FBXLoader.js';
import { SkeletonUtils } from '../js/jsm/utils/SkeletonUtils.js';


let mainCharacter = {};
let animations = {};
let assetsRoot;
let mouseBone = {};

let loadCharacter = function(setup, loadingManager){
    assetsRoot = setup.root;
    let path = setup.root + "characters/" + setup.name + '/';
    let modelPath = path + 'T-pose.fbx';
    let fbxLoader = new FBXLoader(loadingManager);
    fbxLoader.load( modelPath, function ( character ) {
        character.traverse(obj => obj.frustumCulled = false);
        character.traverse( function ( child ) {
            if ( child.isMesh ) {
                child.material = setMaterial(path, setup.envMap, child.name, setup[child.name], loadingManager);
                child.geometry.attributes.uv2 = child.geometry.attributes.uv;
                child.castShadow = !!setup.castShadow;
                child.receiveShadow = !!setup.receiveShadow;
                child.frustumCulled = false;
            }
            mainCharacter[setup.name] = character;
        });
    } );
};

let loadAnimation = function(name, animation, loadingManager){
    let animationPath = assetsRoot + 'characters/' + name + '/' + animation + '.fbx';
    let fbxLoader = new FBXLoader(loadingManager);
    fbxLoader.load( animationPath, function ( character ){
        animations[animation] = character.animations[ 0 ];
    });
};

let setMouseFollower = function(character, bone, room){
    character.traverse(obj => obj.frustumCulled = false);
    character.traverse( function ( child ) {
        if (child.isBone) {
            if (child.name === bone) {
                //console.log(child);
                mouseBone[room + '_' + bone] = child;
            }
        }
    });
};

let instanceCharacter = function(name){
    return SkeletonUtils.clone(mainCharacter[name]);
};

let getAnimation = function(name){
    return animations[name];
};

let moveHead = function (bone, room, degreeLimit, mX, mY) {
    if(mouseBone[room +  '_' + bone]){
        let degrees = getMouseDegrees(mX, mY, degreeLimit);
        mouseBone[room +  '_' + bone].rotation.y = THREE.Math.degToRad(degrees.x);
        mouseBone[room +  '_' + bone].rotation.x = THREE.Math.degToRad(degrees.y);
    }
};

function setMaterial(root, envMap, childName, newMap, loadingManager){
    let material;
    let textureLoader = new THREE.TextureLoader(loadingManager);

    if(!Array.isArray(newMap)){
        let materialData = {};
        let mixedTexture = ((!('roughnessMap' in newMap) || newMap.roughnessMap) || (!('metalnessMap' in newMap) || newMap.metalnessMap) || (!('aoMap' in newMap) || newMap.aoMap)) ? textureLoader.load((root + childName + '_mix.jpg')) : null;
        let baseFileFormat = ('transparent' in newMap) && newMap.transparent ? '.png' : '.jpg';

        materialData.envMap = envMap;
        if(('color' in newMap)) materialData.color = newMap.color;
        if(!('baseMap' in newMap) || newMap.baseMap) materialData.map = textureLoader.load(root + childName + '_base' + baseFileFormat);
        if(!('roughnessMap' in newMap) || newMap.roughnessMap) materialData.roughnessMap = mixedTexture;
        if(!('metalnessMap' in newMap) || newMap.metalnessMap) materialData.metalnessMap = mixedTexture;
        if(!('aoMap' in newMap) || newMap.aoMap) materialData.aoMap = mixedTexture;
        if(!('normalMap' in newMap) || newMap.normalMap) materialData.normalMap = textureLoader.load(root + childName + '_normal.jpg');
        materialData.roughness = (('roughness' in newMap)) ? newMap.roughness : 1;
        materialData.envMapIntensity = (('envMapIntensity' in newMap)) ? newMap.envMapIntensity : 1;
        materialData.metalness = (('metalness' in newMap)) ? newMap.metalness : 1;
        materialData.aoMapIntensity = (('aoMapIntensity' in newMap)) ? newMap.aoMapIntensity : 1;
        materialData.transparent = ('transparent' in newMap) && newMap.transparent;
        materialData.skinning = true;

        switch(newMap.type){
            case 'pbr':
                material = new THREE.MeshPhysicalMaterial(materialData);
                break;
            case 'std':
                material = new  THREE.MeshStandardMaterial(materialData);
                break;
        }
    }else{
        material = [];
        newMap.forEach((map) =>{
            let materialData = {};
            let mixedTexture = ((!('roughnessMap' in map) || map.roughnessMap) || (!('metalnessMap' in map) || map.metalnessMap) || (!('aoMap' in map) || map.aoMap)) ? textureLoader.load((root + childName + map.suffix + '_mix.jpg')) : null;
            let baseFileFormat = ('transparent' in map) && map.transparent ? '.png' : '.jpg';

            materialData.envMap = envMap;
            if(('color' in map)) materialData.color = map.color;
            if(!('baseMap' in map) || map.baseMap) materialData.map = textureLoader.load(root + childName + map.suffix + '_base' + baseFileFormat);
            if(!('roughnessMap' in map) || map.roughnessMap) materialData.roughnessMap = mixedTexture;
            if(!('metalnessMap' in map) || map.metalnessMap) materialData.metalnessMap = mixedTexture;
            if(!('aoMap' in map) || map.aoMap) materialData.aoMap = mixedTexture;
            if(!('normalMap' in map) || map.normalMap) materialData.normalMap = textureLoader.load(root + childName + map.suffix + '_normal.jpg');
            materialData.roughness = (('roughness' in map)) ? map.roughness : 1;
            materialData.envMapIntensity = (('envMapIntensity' in map)) ? map.envMapIntensity : 1;
            materialData.metalness = (('metalness' in map)) ? map.metalness : 1;
            materialData.aoMapIntensity = (('aoMapIntensity' in map)) ? map.aoMapIntensity : 1;
            materialData.transparent = ('transparent' in map) && map.transparent;
            materialData.skinning = true;

            switch(map.type){
                case 'pbr':
                    material.push(new THREE.MeshPhysicalMaterial(materialData));
                    break;
                case 'std':
                    material.push(new  THREE.MeshStandardMaterial(materialData));
                    break;
                case 'basic':
                    material.push(new  THREE.MeshBasicMaterial(materialData));
                    break;
            }
        })
    }
    return material;
}
function getMouseDegrees(x, y, degreeLimit) {
    let dx = 0,
        dy = 0,
        xdiff,
        xPercentage,
        ydiff,
        yPercentage;

    //x -= 400;
    //y -= 300;

    let w = { x: window.innerWidth, y: window.innerHeight };

    // Left (Rotates neck left between 0 and -degreeLimit)

    // 1. If cursor is in the left half of screen
    if (x <= w.x / 2) {
        // 2. Get the difference between middle of screen and cursor position
        xdiff = w.x / 2 - x;
        // 3. Find the percentage of that difference (percentage toward edge of screen)
        xPercentage = (xdiff / (w.x  / 2)) * 100;
        // 4. Convert that to a percentage of the maximum rotation we allow for the neck
        dx = ((degreeLimit * xPercentage) / 100) * -1; }
// Right (Rotates neck right between 0 and degreeLimit)
    if (x >= w.x  / 2) {
        xdiff = x - w.x / 2;
        xPercentage = (xdiff / (w.x / 2)) * 100;
        dx = (degreeLimit * xPercentage) / 100;
    }
    // Up (Rotates neck up between 0 and -degreeLimit)
    if (y <= w.y / 2) {
        ydiff = w.y / 2 - y;
        yPercentage = (ydiff / (w.y / 2)) * 100;
        // Note that I cut degreeLimit in half when she looks up
        dy = (((degreeLimit * 0.5) * yPercentage) / 100) * -1;
    }

    // Down (Rotates neck down between 0 and degreeLimit)
    if (y >= w.y / 2) {
        ydiff = y - w.y/ 2;
        yPercentage = (ydiff / (w.y / 2)) * 100;
        dy = (degreeLimit * yPercentage) / 100;
    }
    return { x: dx, y: dy };
}

export {loadCharacter, instanceCharacter, loadAnimation, setMouseFollower, getAnimation, moveHead}