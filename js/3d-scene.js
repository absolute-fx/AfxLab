import * as THREE from '../js/three.module.js';
import { TWEEN } from '../js/jsm/libs/tween.module.min.js';
import { FBXLoader } from '../js/jsm/loaders/FBXLoader.js';
import { EffectComposer } from '../js/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from '../js/jsm/postprocessing/RenderPass.js';
import {FilmPass} from "../three.js-master/examples/jsm/postprocessing/FilmPass.js";
import {EffectPass} from "./jsm/postprocessing/postprocessing.esm";

let container;
let camera, scene, renderer, ambientLight, pointLight, composer;
let mX, mY;
let mixer;
let mouseX = 0;
let mouseY = 0;
let windowHalfX = window.innerWidth / 2;
let windowHalfY = window.innerHeight / 2;
let targetX = 0;
let targetY = 0;
let tweenPos, tweenRot;
let lastScrollTop = 0;
let actualPos = 0;
let lookAt = { x: 0, y:110, z:85 };
const duration = 2000;
const camPositions = [
    {x:450 , y:150,  z:209},
    {x:0 , y:50,  z:300}
];
let inTransition = false;
let clock = new THREE.Clock();

const assetsRoot = './assets/';
const idleRadius = 300;
const idleSpeed = 0.003;
const idleSensibility = 0.025;
let idleStore = 0;
let neck, waist;
init();


function init() {

    const loadingManager = new THREE.LoadingManager( () => {

        const loadingScreen = document.getElementById( 'loading-screen' );
        $('#sections-container').show();
        loadingScreen.classList.add( 'fade-out' );
        loadingScreen.addEventListener( 'transitionend', onTransitionEnd );

    } );

    container = document.createElement( 'div' );
    document.body.appendChild( container );

    camera = new THREE.PerspectiveCamera( 34, window.innerWidth / window.innerHeight, 1, 10000 );
    camera.position.set( camPositions[0].x, camPositions[0].y, camPositions[0].z);
    camera.lookAt( lookAt.x, lookAt.y, lookAt.z );

    scene = new THREE.Scene();
    scene.background = new THREE.Color( 0x000000 );

    ambientLight = new THREE.AmbientLight( 0xffffff );
    ambientLight.intensity = 0.7;
    scene.add( ambientLight );

    pointLight = new THREE.PointLight( 0xffffff, 20, 5000 );
    pointLight.position.set( 200, 200, 200 );
    scene.add( pointLight );

    // main materials
    let mainLoaderEnv = new THREE.CubeTextureLoader();
    mainLoaderEnv.setPath(assetsRoot);
    let mainEnv = mainLoaderEnv.load([
        'px.png', 'nx.png',
        'py.png', 'ny.png',
        'pz.png', 'nz.png'
    ]);
    mainEnv.encoding = THREE.sRGBEncoding;

    // model room main
    let textureLoader = new THREE.TextureLoader();
    let diffuseMap = textureLoader.load( assetsRoot + 'room-main-diffuse.jpg' );
    diffuseMap.encoding = THREE.sRGBEncoding;

    let material = new THREE.MeshStandardMaterial( {
        color: 0xffffff,
        map: diffuseMap
    } );

    let loader = new FBXLoader();
    loader.load( assetsRoot + 'room-01-main.fbx', function ( object ) {

        object.traverse( function ( child ) {

            if ( child.isMesh ) {
                child.material = material;
                child.receiveShadow = true;
            }

        } );

        scene.add( object );

    } );

    // model character
    let bodyCharLoaderDi = new THREE.TextureLoader();
    let bodyCharBase = bodyCharLoaderDi.load(assetsRoot + 'perso_Body_diffuse.png');
    bodyCharBase.encoding = THREE.sRGBEncoding;

    let bodyCharLoaderRough = new THREE.TextureLoader();
    let bodyCharRough = bodyCharLoaderRough.load(assetsRoot + 'perso_Body_gloss.png');
    bodyCharRough.encoding = THREE.sRGBEncoding;


    let bodyCharLoaderNormal = new THREE.TextureLoader();
    let bodyCharNormal = bodyCharLoaderNormal.load(assetsRoot + 'perso_Body_normal.png');
    bodyCharNormal.encoding = THREE.sRGBEncoding;

    let characterBodyMat = new THREE.MeshPhysicalMaterial( {
        color: 0xbb9166,
        map: bodyCharBase,
        roughness: 1,
        roughnessMap: bodyCharRough,
        envMap: mainEnv,
        envMapIntensity: 1,
        normalMap: bodyCharNormal,
        transparent: true
    } );
    characterBodyMat.skinning = true;

    let topCharLoaderDi = new THREE.TextureLoader();
    let topCharBase = topCharLoaderDi.load(assetsRoot + 'perso_Top_diffuse.png');
    topCharBase.encoding = THREE.sRGBEncoding;

    let topCharLoaderRough = new THREE.TextureLoader();
    let topCharRough = topCharLoaderRough.load(assetsRoot + 'perso_Top_gloss.png');
    topCharRough.encoding = THREE.sRGBEncoding;

    let topCharLoaderNormal = new THREE.TextureLoader();
    let topCharNormal = topCharLoaderNormal.load(assetsRoot + 'perso_Top_normal.png');
    topCharNormal.encoding = THREE.sRGBEncoding;

    let characterTopMat = new THREE.MeshStandardMaterial( {
        color: 0xbb9166,
        map: topCharBase,
        roughness: 1,
        roughnessMap: topCharRough,
        envMap: mainEnv,
        envMapIntensity: 1,
        normalMap: topCharNormal
    } );
    characterTopMat.skinning = true;

    let bottomCharLoaderDi = new THREE.TextureLoader();
    let bottomCharBase = bottomCharLoaderDi.load(assetsRoot + 'perso_Bottom_diffuse.png');
    bottomCharBase.encoding = THREE.sRGBEncoding;

    let bottomCharLoaderRough = new THREE.TextureLoader();
    let bottomCharRough = bottomCharLoaderRough.load(assetsRoot + 'perso_Bottom_gloss.png');
    bottomCharRough.encoding = THREE.sRGBEncoding;

    let bottomCharLoaderNormal = new THREE.TextureLoader();
    let bottomCharNormal = bottomCharLoaderNormal.load(assetsRoot + 'perso_Bottom_normal.png');
    bottomCharNormal.encoding = THREE.sRGBEncoding;

    let characterBottomMat = new THREE.MeshStandardMaterial( {
        color: 0xbb9166,
        map: bottomCharBase,
        roughness: 1,
        roughnessMap: bottomCharRough,
        envMap: mainEnv,
        envMapIntensity: 1,
        normalMap: bottomCharNormal
    } );
    characterBottomMat.skinning = true;

    let shoesCharLoaderDi = new THREE.TextureLoader();
    let shoesCharBase = shoesCharLoaderDi.load(assetsRoot + 'perso_Shoes_diffuse.png');
    shoesCharBase.encoding = THREE.sRGBEncoding;

    let shoesMat = new THREE.MeshStandardMaterial( {
        color: 0xbb9166,
        map: shoesCharBase,
    } );
    shoesMat.skinning = true;

    let idleAnim;
    let loaderCharacter = new FBXLoader(loadingManager);

    loaderCharacter.load( assetsRoot + 'character.fbx', function ( object ) {

        object.traverse( function ( child ) {

            if ( child.isMesh ) {
                //console.log(child.name);
                //child.castShadow = true;
                child.receiveShadow = true;
                if(child.name === 'Body' || child.name === 'Eyes' || child.name === 'Eyelashes') {
                    child.material = characterBodyMat;
                }

                if(child.name === 'Tops') child.material = characterTopMat;
                if(child.name === 'Bottoms') child.material = characterBottomMat;
                if(child.name === 'Shoes') child.material = shoesMat;
            }
            if (child.isBone) {
                //console.log(child.name);
                if (child.name === 'mixamorig_Head') {
                    neck = child;
                }
                if (child.name === 'mixamorigSpine') {
                    waist = child;
                }
            }

        } );

        //object.rotation.y = 90;
        object.position.z = 118.113;
        object.position.x = 19.428;
        mixer = new THREE.AnimationMixer( object );
        //object.animations[0].duration = 15;

        idleAnim = object.animations[ 0 ];
        idleAnim.tracks.splice(30, 3);
        //idleAnim.tracks.splice(4, 1);
        let action = mixer.clipAction(idleAnim);
        //console.log(idleAnim);
        action.play();

        scene.add( object );
    } );

    let rocketLoaderDi = new THREE.TextureLoader();
    let rocketBase = rocketLoaderDi.load( assetsRoot + 'rocket_BaseColor.jpg' );
    rocketBase.encoding = THREE.sRGBEncoding;

    let rocketLoaderPbr = new THREE.TextureLoader();
    let rocketPbr  = rocketLoaderPbr.load(assetsRoot + 'rocket_pbr.jpg');
    rocketPbr.encoding = THREE.sRGBEncoding;

    let rocketLoaderNormal = new THREE.TextureLoader();
    let rocketNormal = rocketLoaderNormal.load(assetsRoot + 'rocket_Normal.jpg');
    rocketNormal.encoding = THREE.sRGBEncoding;

    let rocketMaterial = new THREE.MeshPhysicalMaterial( {
        map: rocketBase,
        roughness: 0.5,
        roughnessMap: rocketPbr,
        metalness:0.9,
        metalnessMap: rocketPbr,
        envMap: mainEnv,
        envMapIntensity: 0.5,
        normalMap: rocketNormal
    } );


    let loaderRocket = new FBXLoader();
    loaderRocket.load(assetsRoot + 'rocket.fbx', function(object){
        object.traverse( function ( child ) {

            if ( child.isMesh ) {
                child.material = rocketMaterial;
            }
        } );
        scene.add( object );
    });

    let wireMaterial = new THREE.MeshPhongMaterial({
        color: 0x000000,
        shininess:100
    });

    let loaderWires = new FBXLoader();
    loaderWires.load(assetsRoot + 'wires.fbx', function(object){
        object.traverse( function ( child ) {

            if ( child.isMesh ) {
                child.material = wireMaterial;
            }
        } );
        scene.add( object );
    });

    let tubesLoaderBase = new THREE.TextureLoader();
    let tubesBase = tubesLoaderBase.load(assetsRoot + 'tubes.jpg');
    tubesBase.encoding = THREE.sRGBEncoding;

    let tubesMaterial = new THREE.MeshPhongMaterial( {
        map: tubesBase
    } );


    let loaderTubes = new FBXLoader();
    loaderTubes.load(assetsRoot + 'tubes.fbx', function(object){
        object.traverse( function ( child ) {

            if ( child.isMesh ) {
                child.material = tubesMaterial;
            }
        } );
        scene.add( object );
    });


    let loaderElecBoxDif = new THREE.TextureLoader();
    let elcBoxBase = loaderElecBoxDif.load(assetsRoot + 'electrical_box_BaseColor.png');
    elcBoxBase.encoding = THREE.sRGBEncoding;

    let loaderElecBoxPbr = new THREE.TextureLoader();
    let elcBoxPbr = loaderElecBoxPbr.load(assetsRoot + 'electrical_box_pbr.png');
    elcBoxPbr.encoding = THREE.sRGBEncoding;

    let loaderElecBoxNormal = new THREE.TextureLoader();
    let elcBoxNormal = loaderElecBoxNormal.load(assetsRoot + 'electrical_box_Normal.png');
    elcBoxNormal.encoding = THREE.sRGBEncoding;

    let loaderElecBoxEmi = new THREE.TextureLoader();
    let elcBoxEmi = loaderElecBoxEmi.load(assetsRoot + 'electrical_box_Emissive.png');
    elcBoxEmi.encoding = THREE.sRGBEncoding;

    let elecBoxMaterial = new THREE.MeshPhysicalMaterial( {
        color: 0x171819,
        map: elcBoxBase,
        roughness: 0.5,
        roughnessMap: elcBoxPbr,
        metalness:0.9,
        metalnessMap: elcBoxPbr,
        envMap: mainEnv,
        envMapIntensity: 0.5,
        normalMap: elcBoxNormal,
        emissiveMap: elcBoxEmi,
        emissive: 0xffffff
    } );

    let loaderElecBox = new FBXLoader();
    loaderElecBox.load(assetsRoot + 'electrical_box.fbx', function(object){
        object.traverse( function ( child ) {

            if ( child.isMesh ) {
                child.material = elecBoxMaterial;
            }
        } );
        scene.add( object );
    });

    let loaderServerBase = new THREE.TextureLoader();
    let serverBase = loaderServerBase.load(assetsRoot + 'sever_BaseColor.png');
    serverBase.encoding = THREE.sRGBEncoding;

    let loaderServerPbr = new THREE.TextureLoader();
    let serverPbr = loaderServerPbr.load(assetsRoot + 'server_pbr.png');
    serverPbr.encoding = THREE.sRGBEncoding;

    let loaderServerEmi = new THREE.TextureLoader();
    let serverEmi = loaderServerEmi.load(assetsRoot + 'sever_Emissive.png');
    serverEmi.encoding = THREE.sRGBEncoding;

    let serverMaterial = new THREE.MeshPhysicalMaterial({
        color: 0x171819,
        map: serverBase,
        roughness: 0.5,
        roughnessMap: serverPbr,
        envMap: mainEnv,
        envMapIntensity: 0.5,
        emissiveMap: serverEmi,
        emissive: 0xffffff
    });

    let loaderServer = new FBXLoader();
    loaderServer.load(assetsRoot + 'server.fbx', function(object){
        object.traverse( function ( child ) {

            if ( child.isMesh ) {
                child.material = serverMaterial;
            }
        } );
        scene.add( object );
    });




    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.physicallyCorrectLights = true;
    renderer.gammaInput = true;
    renderer.gammaOutput = true;
    renderer.shadowMap.enabled = true;
    //renderer.shadowMap.bias = 0.0001;
    //renderer.shadowMap.type = THREE.PCFShadowMap;
    container.appendChild( renderer.domElement );

    window.addEventListener( 'resize', onWindowResize, false );
    document.addEventListener( 'mousemove', onDocumentMouseMove, false );
    //document.addEventListener("scroll", updateCamera);

    $(window).scroll(function(event){
        let st = $(this).scrollTop();
        if (st > lastScrollTop){
            // downscroll code
            updateCamera('down');
        } else {
            updateCamera('up');
        }
        lastScrollTop = st;
    });

    document.addEventListener('keydown', (e) => {
        if(!inTransition){
            if(e.key === "f") transitionCam();
        }
    });

    composer = new EffectComposer(renderer);
    const renderPass = new RenderPass( scene, camera );
    const effectPass = new EffectPass();
    const filmPass = new FilmPass(
        0.35,   // noise intensity
        0.025,  // scanline intensity
        648,    // scanline count
        false,  // grayscale
    );


    composer.addPass(renderPass);
    composer.addPass(renderPass);

    animate();
}

function onDocumentMouseMove( event ) {

    mouseX = ( event.clientX - windowHalfX )/5;
    mouseY = ( event.clientY - windowHalfY )/5;
    mX = event.clientX;
    mY = event.clientY;

    if ( neck ) moveJoint(neck, 30);
}

function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );

}

let initMoveZDistance = 200;
let initMoveYDistance = 100;
let initLookAtZDistance = 50;
function updateCamera(move){
    //console.log(move);
    let maxYScrollScene_a = window.innerHeight / 2;
    let newPosZ;
    let newPosY;
    let newLookAtZ;
    //console.log(window.scrollY);

    if(move === "up" && window.scrollY === 0){
        // hack jquery
    }else{
        if(window.scrollY < maxYScrollScene_a){
            newPosZ = camPositions[0].z - (window.scrollY * initMoveZDistance)/maxYScrollScene_a;
            newPosY = camPositions[0].y - (window.scrollY * initMoveYDistance)/maxYScrollScene_a;
            newLookAtZ = lookAt.z + (window.scrollY * initLookAtZDistance)/maxYScrollScene_a;

            camera.position.z = newPosZ;
            camera.position.y = newPosY;
            camera.lookAt( lookAt.x, lookAt.y, newLookAtZ );
        }
    }



    /*
    if(e.deltaY === -100){
        camY += 1;
    }else{
        camY -= 1;
    }
    */
}

function animate() {
    if ( scene ) {
        if(idleStore <= 360){
            idleStore += idleSpeed;
        }else{
            idleStore = 0;
        }
        let x, y;

        if(isNaN(mX)){
            x = windowHalfX + Math.cos(idleStore) * idleRadius;
            y = windowHalfY + Math.sin(idleStore) * idleRadius;
        }else{
            x = mX + Math.cos(idleStore) * idleRadius;
            y = mY + Math.sin(idleStore) * idleRadius;
        }

        mouseX = ( x - windowHalfX )/5;
        mouseY = ( y - windowHalfY )/5;

        targetX = mouseX * .001;
        targetY = mouseY * .001;

        let delta = clock.getDelta();
        if ( mixer ) mixer.update( delta );

        scene.rotation.y += idleSensibility * ( targetX - scene.rotation.y );
        scene.rotation.x += idleSensibility * ( targetY - scene.rotation.x );

    }
    TWEEN.update();
    //camera.position.set( 0, camY, 150);
    //console.log(camera.rotation.z);
    //renderer.render( scene, camera );
    composer.render();
    requestAnimationFrame( animate );
}

function transitionCam(){
    //console.log('tween');
    if(actualPos === 0){
        tweenPos = new TWEEN.Tween( camera.position )
            .to( { x: camPositions[1].x, y: camPositions[1].y, z: camPositions[1].z }, duration )
            .easing( TWEEN.Easing.Exponential.InOut )
            .start();
        tweenRot = new TWEEN.Tween( camera.rotation )
            .to( { x: camera.rotation.x, y: camera.rotation.y , z: 6.28 },duration )
            .easing( TWEEN.Easing.Exponential.InOut )
            .start();

        actualPos = 1;
    }else{
        tweenPos = new TWEEN.Tween( camera.position )
            .to( { x: camPositions[0].x, y: camPositions[0].y, z: camPositions[0].z }, duration )
            .easing( TWEEN.Easing.Exponential.InOut )
            .start();
        tweenRot = new TWEEN.Tween( camera.rotation )
            .to( { x: camera.rotation.x, y: camera.rotation.y , z: 0 },duration )
            .easing( TWEEN.Easing.Exponential.InOut )
            .start();

        actualPos = 0;
    }
    inTransition = true;
    tweenPos.onComplete(tweenCompleted);
}

function tweenCompleted(){
    //console.log('tween completed');
    TWEEN.removeAll();
    inTransition = false;
}

function onTransitionEnd( event ) {
    event.target.remove();
}

function moveJoint(joint, degreeLimit) {
    let degrees = getMouseDegrees(mX, mY, degreeLimit);
    joint.rotation.y = THREE.Math.degToRad(degrees.x);
    joint.rotation.x = THREE.Math.degToRad(degrees.y);
}

function getMouseDegrees(x, y, degreeLimit) {
    let dx = 0,
        dy = 0,
        xdiff,
        xPercentage,
        ydiff,
        yPercentage;

    x -= 400;
    y -= 300;

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