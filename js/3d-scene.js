import * as THREE from '../js/three.module.js';
import { TWEEN } from '../js/jsm/libs/tween.module.min.js';
import { FBXLoader } from '../js/jsm/loaders/FBXLoader.js';
import { EffectComposer } from '../js/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from '../js/jsm/postprocessing/RenderPass.js';
import { THREEx } from '../js/threex.afxlab.module.js';
import * as CharacterInstancer from '../js/characters.afxlab.module.js';

let container;
let loadingManager_r1, loadingManager_r2;
let camera, scene, renderer, ambientLight, pointLight, pointLight2, pointLight3, composer, room_02_Light;
let mX, mY;
let mixer_room_01, mixer_b;
let mouseX = 0;
let mouseY = 0;
let windowHalfX = window.innerWidth / 2;
let windowHalfY = window.innerHeight / 2;
let targetX = 0;
let targetY = 0;
let lookAtInit = { x: 0, y:110, z:85 };
let mainEnv;
let tweenPos, tweenRot;
let lastScrollTop = 0;
let actualPos = 0;
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
let neck, waist, neck_r2, waist_r2;
let head_room_01_bone;
let rendering = true;

const webSectionsPlates = {
    "plate-L-01": "PHP",
    "plate-L-02": "CSS",
    "plate-L-03": "SYNPHONY",
    "plate-L-04": "SEO",
    "plate-R-01": "JAVASCRIPT",
    "plate-R-02": "NODE.JS",
    "plate-R-03": "WORDPRESS",
    "plate-R-04": "ELECTRON"
};

let room_01_character;
let sceneCastShadows = true;

setNav();

// LAYOUT >/////////////////////////////////////////////////////////////////////////////////////////////////////////////
let f = new FontFace('Anton', 'url(./fonts/Anton-Regular.ttf)');
f.load().then(function(loaded_face) {
    document.fonts.add(loaded_face);
    init();
});

let clickAnimate = false;
function setNav(){
    $('.navbar-nav a').each(function () {
        //$(this).removeClass('active');
        $(this).click(function() {
            let target = $(this).data('href');
            navClickAction(target, this);
        })
    })
}

function navClickAction(target, btn){
    clickAnimate = true;
    $('html, body').animate({
        scrollTop: $(target).offset().top
    },2000, function(){
        // complete
        clickAnimate = false;
    });

    $('.navbar-nav a').each(function () {
        $(this).removeClass('active');
    });
    $(btn).addClass('active');
}

$("#web-overlay-btn").click(function(){
    rendering = false;
    setOverlay('web');
    return false;
});

function setOverlay(cat){
    //$('.overlay').css("top", 0);
    $("canvas").addClass('d-none');
    $("#sections-container").addClass('d-none');
    $('.overlay').addClass('overlay-animating');
    $('.overlay').removeClass('overlay-animating-out');
    $("#main-menu").fadeOut();
    //$('.navbar-toggler').hide();
    window.location.hash = '';

    $('.overlay-container').load('web-dev.html');
}

$('.overlay a').click(function(){
    $('.overlay-content').fadeOut(function() {
        $('.overlay-content').remove();
        closeOverlay();
    });

    return false
});

document.addEventListener('keydown', (e) => {
    if(e.key === "²"){
        $("#sections-container").removeClass('d-none');
        window.location.hash = 'web-service';
        $("canvas").removeClass('d-none');
    }
    if(e.key === "0"){
        $('.overlay').addClass('overlay-animating');
        $('.overlay').removeClass('overlay-animating-out');
    }

    if(e.key === "Escape"){
        $('.overlay-content').fadeOut(function() {
            $('.overlay-content').remove();
            closeOverlay();
        });
    }

});

function closeOverlay(){
    $("#sections-container").removeClass('d-none');
    $("canvas").removeClass('d-none');
    window.location.hash = 'web-service';
    $('.overlay').removeClass('overlay-animating');
    $('.overlay').addClass('overlay-animating-out');
    $("#main-menu").fadeIn();
    rendering = true;
    animate();
    //$('.navbar-toggler').show();
}
// LAYOUT </////////////////////////////////////////////////////////////////////////////////////////////////////////////

function init() {
    setRoom_01Loader();
    container = document.createElement( 'div' );
    document.body.appendChild( container );

    camera = new THREE.PerspectiveCamera( 34, window.innerWidth / window.innerHeight, 1, 10000 );
    camera.position.set( camPositions[0].x, camPositions[0].y, camPositions[0].z);
    camera.lookAt( lookAtInit.x, lookAtInit.y, lookAtInit.z );

    scene = new THREE.Scene();
    scene.background = new THREE.Color( 0x221e22 );

    /*ambientLight = new THREE.AmbientLight( 0xffffff );
    ambientLight.intensity = 0.7;
    scene.add( ambientLight );*/

    let light = new THREE.HemisphereLight( 0xffffff, 0xee83e5, 1 );
    scene.add( light );

    pointLight = new THREE.PointLight( 0xffffff, 50, 5000 );
    pointLight.position.set( 200, 350, 200 );
    scene.add( pointLight );

    pointLight2 = new THREE.PointLight( 0xffffff, 20, 500 );
    pointLight2.position.set( -275, 100, -390 );
    scene.add( pointLight2 );

    pointLight3 = new THREE.PointLight( 0xffffff, 20, 350 );
    pointLight3.position.set( -275, 50, 235 );
    scene.add( pointLight3 );

    room_02_Light = new THREE.PointLight( 0xee83e5, 20, 5000 );
    room_02_Light.position.set( -200, -300, -50 );
    scene.add( room_02_Light );

    // main materials
    let mainLoaderEnv = new THREE.CubeTextureLoader();
    mainLoaderEnv.setPath(assetsRoot);
    mainEnv = mainLoaderEnv.load([
        'px.png', 'nx.png',
        'py.png', 'ny.png',
        'pz.png', 'nz.png'
    ]);
    mainEnv.encoding = THREE.sRGBEncoding;

    setRoom_1();

    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.physicallyCorrectLights = true;

    renderer.outputEncoding = THREE.sRGBEncoding;

    //renderer.gammaInput = true;
    //renderer.gammaOutput = true;
    //renderer.shadowMap.enabled = true;
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
            //updateCamera('down');
        } else {
            //updateCamera('up');
        }
        lastScrollTop = st;

        $('.navbar-nav a').each(function () {
            const currLink = $(this);
            let refElement = $(currLink.data("href"));
            const isSm = $(currLink).data('sm');
            if(isSm) refElement = $(currLink.data("href")).parent();
            if (refElement.position().top <= st && refElement.position().top + refElement.height() > st) {
                currLink.addClass("active");
            }
            else{
                currLink.removeClass("active");
            }
        });
    });

    document.addEventListener('keydown', (e) => {
        if(!inTransition){
            if(e.key === "f") transitionCam();
        }
    });

    composer = new EffectComposer(renderer);
    const renderPass = new RenderPass( scene, camera );
    composer.addPass(renderPass);

    /*var sphereSize = 10;
    var pointLightHelper = new THREE.PointLightHelper( pointLight2, sphereSize );
    scene.add( pointLightHelper );*/
}

function setRoom_1(){
    // model room main
    let textureLoader = new THREE.TextureLoader(loadingManager_r1);
    let aoMap = textureLoader.load( assetsRoot + 'room-main-ao.jpg' );

    let concreteRough = textureLoader.load( assetsRoot + 'concrete.jpg', (texture) =>{texture.anisotropy = renderer.capabilities.getMaxAnisotropy()} );
    concreteRough.wrapS = concreteRough.wrapT = THREE.RepeatWrapping;
    concreteRough.offset.set( 0, 0 );
    let concreteNormal = textureLoader.load( assetsRoot + 'concrete_normal.jpg',(texture) =>{texture.anisotropy = renderer.capabilities.getMaxAnisotropy()} );
    concreteNormal.wrapS = concreteNormal.wrapT = THREE.RepeatWrapping;
    concreteNormal.offset.set( 0, 0 );

    let wallNormal = textureLoader.load( assetsRoot + 'wall-03-normal.jpg' );
    wallNormal.wrapS = wallNormal.wrapT = THREE.RepeatWrapping;
    wallNormal.offset.set( 0, 0 );

    let wallRoughness = textureLoader.load( assetsRoot + 'roughness-wall.jpg' );
    wallRoughness.wrapS = wallRoughness.wrapT = THREE.RepeatWrapping;
    wallRoughness.offset.set( 0, 0 );

    let wallMaterial = new THREE.MeshStandardMaterial( {
        color: 0x19021c,
        aoMap: aoMap,
        aoIntensity: 10,
        lightMap: aoMap,
        lightMapIntensity: 20,
        envMap: mainEnv,
        envMapIntensity: 1,
        roughnessMap: wallRoughness,
        roughness: 1,
        normalMap: wallNormal,
        normalScale: new THREE.Vector3( 0.2, 0.2 )
        //map: diffuseMap
    } );

    let floorMaterial = new THREE.MeshStandardMaterial( {
        color: 0x19021c,
        roughnessMap: concreteRough,
        envMap: mainEnv,
        envMapIntensity: 1,
        normalMap: concreteNormal,
        aoMap: aoMap,
        aoIntensity: 10,
        lightMap: aoMap,
        lightMapIntensity: 20,
        //map: diffuseMap
    } );

    let socleMaterial = new THREE.MeshStandardMaterial( {
        color: 0x000000,
        roughnessMap: concreteRough,
        envMap: mainEnv,
        envMapIntensity: 1,
        normalMap: concreteNormal,
        aoMap: aoMap,
        aoIntensity: 10,
        lightMap: aoMap,
        lightMapIntensity: 20,
        //map: diffuseMap
    } );

    let archesMaterial = new THREE.MeshStandardMaterial( {
        color: 0x0b010c,
        roughnessMap: concreteRough,
        envMap: mainEnv,
        envMapIntensity: 0.2,
        normalMap: concreteNormal,
        aoMap: aoMap,
        aoIntensity: 10,
        lightMap: aoMap,
        lightMapIntensity: 20,
        //map: diffuseMap
    } );

    let lightMaterial = new THREE.MeshStandardMaterial( {
        color: 0xffffff,
        aoMap: aoMap,
        lightMap: aoMap,
        emissive: 0xffffff,
        emissiveIntensity: 1,
        //map: diffuseMap
    } );

    let fbxLoader = new FBXLoader(loadingManager_r1);
    fbxLoader.load( assetsRoot + 'room-01-main.fbx', function ( object ) {

        object.traverse( function ( child ) {
            if ( child.isMesh ) {
                if(child.name === 'room-01') child.material = wallMaterial;
                if(child.name === 'room-01-floor') child.material = floorMaterial;
                if(child.name === 'room-01-lights') child.material = lightMaterial;
                if(child.name === 'room-01-socle') child.material = socleMaterial;
                if(child.name === 'room-01-arches') child.material = archesMaterial;
                child.receiveShadow = true;
            }
        } );
        console.log(object)
        scene.add( object );

    } );

    // model character
    let mainCharSetup = {
        castShadow: false,
        receiveShadow: false,
        name: 'bruce',
        root: assetsRoot,
        envMap: mainEnv,
        CC_Base_Teeth:{
            type: 'std',
            metalness: 0,
        },
        CC_Base_Body:[
            {
                type: 'std',
                color: 0xad847a,
                metalness: 0,
                roughnessIntensity: 1,
                envMapIntensity: 1,
                suffix: '_Head'
            },{
                type: 'std',
                color: 0xad847a,
                metalness: 0,
                roughnessIntensity: 1,
                envMapIntensity: 1,
                suffix: '_Body'
            },{
                type: 'std',
                color: 0xad847a,
                metalness: 0,
                roughnessIntensity: 1,
                envMapIntensity: 1,
                suffix: '_Arm'
            },{
                type: 'std',
                color: 0x5a5652,
                suffix: '_Leg'
            },{
                type: 'std',
                suffix: '_Nails'
            },{
                type: 'std',
                suffix: '_Eyelash',
                normalMap: false,
                transparent: true
            },
        ],
        CC_Base_Eye:{
            type: 'std',
            envMapIntensity: 0,
            normalMap: false,
            metalness: 0,
        },
        Biker_Jeans: {
            type: 'std',
            color: 0x4b4b4b
        },
        Loose_Biker_Boots:{
            type: 'std',
            color: 0x000000
        },
        Shirt:{
            type: 'std',
            metalness: 0,
        }
    };

    new CharacterInstancer.loadCharacter( mainCharSetup, loadingManager_r1);
    new CharacterInstancer.loadAnimation('bruce', 'room-01-pose', loadingManager_r1);

    let rocketBase = textureLoader.load( assetsRoot + 'rocket_BaseColor.jpg' );
    rocketBase.encoding = THREE.sRGBEncoding;

    let rocketPbr  = textureLoader.load(assetsRoot + 'rocket_pbr.jpg');
    rocketPbr.encoding = THREE.sRGBEncoding;

    let rocketNormal = textureLoader.load(assetsRoot + 'rocket_Normal.jpg');
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

    fbxLoader.load(assetsRoot + 'rocket.fbx', function(object){
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

    fbxLoader.load(assetsRoot + 'wires.fbx', function(object){
        object.traverse( function ( child ) {

            if ( child.isMesh ) {
                child.material = wireMaterial;
            }
        } );
        scene.add( object );
    });

    let tubesBase = textureLoader.load(assetsRoot + 'tubes.jpg');
    tubesBase.encoding = THREE.sRGBEncoding;

    let tubesMaterial = new THREE.MeshPhongMaterial( {
        map: tubesBase
    } );

    fbxLoader.load(assetsRoot + 'tubes.fbx', function(object){
        object.traverse( function ( child ) {

            if ( child.isMesh ) {
                child.material = tubesMaterial;
            }
        } );
        scene.add( object );
    });

    let elcBoxBase = textureLoader.load(assetsRoot + 'electrical_box_BaseColor.png');
    elcBoxBase.encoding = THREE.sRGBEncoding;

    let elcBoxPbr = textureLoader.load(assetsRoot + 'electrical_box_pbr.png');
    elcBoxPbr.encoding = THREE.sRGBEncoding;

    let elcBoxNormal = textureLoader.load(assetsRoot + 'electrical_box_Normal.png');
    elcBoxNormal.encoding = THREE.sRGBEncoding;

    let elcBoxEmi = textureLoader.load(assetsRoot + 'electrical_box_Emissive.png');
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

    fbxLoader.load(assetsRoot + 'electrical_box.fbx', function(object){
        object.traverse( function ( child ) {

            if ( child.isMesh ) {
                child.material = elecBoxMaterial;
            }
        } );
        scene.add( object );
    });

    let serverBase = textureLoader.load(assetsRoot + 'sever_BaseColor.png');
    serverBase.encoding = THREE.sRGBEncoding;

    let serverPbr = textureLoader.load(assetsRoot + 'server_pbr.png');
    serverPbr.encoding = THREE.sRGBEncoding;

    let serverEmi = textureLoader.load(assetsRoot + 'sever_Emissive.png');
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

    fbxLoader.load(assetsRoot + 'server.fbx', function(object){
        object.traverse( function ( child ) {

            if ( child.isMesh ) {
                child.material = serverMaterial;
            }
        } );
        scene.add( object );
    });
}

function setRoom_2(){
    let textureLoader = new THREE.TextureLoader(loadingManager_r2);
    let fbxLoader = new FBXLoader(loadingManager_r2);
    let diffuseMap;

    diffuseMap = textureLoader.load( assetsRoot + 'concrete.jpg' );
    diffuseMap.wrapS = diffuseMap.wrapT = THREE.RepeatWrapping;
    diffuseMap.offset.set( 0, 0 );
    let lightMap = textureLoader.load( assetsRoot + 'room-02_lm.jpg', (texture) =>{texture.anisotropy = renderer.capabilities.getMaxAnisotropy()} );
    let concreteRough = textureLoader.load( assetsRoot + 'concrete.jpg' );
    concreteRough.wrapS = concreteRough.wrapT = THREE.RepeatWrapping;
    concreteRough.offset.set( 0, 0 );
    let concreteNormal = textureLoader.load( assetsRoot + 'concrete_normal.jpg' );
    concreteNormal.wrapS = concreteNormal.wrapT = THREE.RepeatWrapping;
    concreteNormal.offset.set( 0, 0 );

    let room_02_floor = new THREE.MeshStandardMaterial( {
        color: 0x740900,
        //map: diffuseMap,
        lightMap: lightMap,
        aoMap: lightMap,
        lightMapIntensity: 1,
        roughness: 0.9,
        roughnessMap: concreteRough,
        envMap: mainEnv,
        envMapIntensity: 1,
        normalMap: concreteNormal
    } );

    let room_02_walls = new THREE.MeshStandardMaterial( {
        color: 0x1c1c1c,
        lightMap: lightMap,
        aoMap: lightMap,
        lightMapIntensity: 1,
        roughness: 0.9,
        roughnessMap: concreteRough,
        envMap: mainEnv,
        envMapIntensity: 0.5,
        normalMap: concreteNormal
    } );

    let room_02_doors = new THREE.MeshStandardMaterial( {
        //color: 0xff6f17,
        lightMap: lightMap,
        aoMap: lightMap,
        lightMapIntensity: 1,
        roughness: 0.3,
    } );

    let room_02_frames = new THREE.MeshStandardMaterial( {
        color: 0x474747,
        lightMap: lightMap,
        aoMap: lightMap,
        lightMapIntensity: 1,
        roughness: 0.9,
        roughnessMap: concreteRough,
        envMap: mainEnv,
        envMapIntensity: 1,
        normalMap: concreteNormal,
        metalnessMap: concreteRough
    } );

    let room_02_baseboard = new THREE.MeshStandardMaterial( {
        color: 0x616161,
        lightMap: lightMap,
        aoMap: lightMap,
        lightMapIntensity: 1,
        roughness: 0.9,
        roughnessMap: concreteRough,
        envMap: mainEnv,
        envMapIntensity: 1,
        normalMap: concreteNormal,
    } );

    let room_02_ceil = new THREE.MeshStandardMaterial( {
        color: 0x616161,
        lightMap: lightMap,
        aoMap: lightMap,
        lightMapIntensity: 1
    } );

    let room_02_light = new THREE.MeshBasicMaterial( {
        //color: 0x616161,
        lightMap: lightMap,
        aoMap: lightMap,
        aoMapIntensity: 0.5,
        lightMapIntensity: 0.5,
        emissive: 0xffffff,
        emissiveIntensity: 10
    } );


    fbxLoader.load( assetsRoot + 'room-02.fbx', function ( object ) {

        object.traverse( function ( child ) {

            if ( child.isMesh ) {
                //console.log(child);
                if(child.name === "floor")child.material = room_02_floor;
                //if(child.name === "cover")child.material = room_02_floor;
                if(child.name === "wall_debris" || child.name === "cover")child.material = room_02_walls;
                if(child.name === "doors_code")child.material = room_02_doors;
                if(child.name === "frames")child.material = room_02_frames;
                if(child.name === "baseboard")child.material = room_02_baseboard;
                if(child.name === "ceil")child.material = room_02_ceil;
                if(child.name === "lights")child.material = room_02_light;

                //child.receiveShadow = true;
            }

        } );

        scene.add( object );

    } );

    lightMap = textureLoader.load( assetsRoot + 'room-02_assets_lm.jpg' );
    let illuMap = textureLoader.load( assetsRoot + 'room-02_assets_illu.jpg' );
    diffuseMap = textureLoader.load( assetsRoot + 'room-02_assets_diff.jpg' );
    let assetsPBRMap = textureLoader.load( assetsRoot + 'room-02_assets_pbr.png' );

    let room_02_assets = new THREE.MeshStandardMaterial( {
        //color: 0x1a1515,
        map: diffuseMap,
        lightMap: lightMap,
        aoMap: lightMap,
        //roughnessMap: assetsPBRMap,
        roughness: 1,
        //metalnessMap: assetsPBRMap,
        //metalness: 1,
        aoMapIntensity: 1,
        lightMapIntensity: 1,
        //emissiveIntensity: 10,
        //emissiveMap: illuMap,
        //emissive: 0xffffff,
        //envMap: mainEnv,
        envMapIntensity: 0,
    } );

    fbxLoader.load( assetsRoot + 'room-02-assets.fbx', function ( object ) {

        object.traverse( function ( child ) {

            if ( child.isMesh ) {
                if(child.name === "rooms-02-assets"){
                    child.material = room_02_assets;
                }else{
                    child.material = setPlateMaterial(lightMap, child.name);
                }
            }

        } );

        scene.add( object );

    } );

    let idleAnim;

    let body_lm = textureLoader.load( assetsRoot + 'char-02-lm.jpg' );
    let body_char_02 = new THREE.MeshPhongMaterial({
            map: body_lm
        }

    );
    body_char_02.skinning = true;
    fbxLoader.load( assetsRoot + 'sit.fbx', function ( object ) {

        object.traverse( function ( child ) {

            if ( child.isMesh ) {
                if(child.name === 'Body') {
                    child.material = body_char_02;
                }
            }
            if (child.isBone) {
                if (child.name === 'mixamorig_Head') {
                    neck_r2 = child;
                }
                if (child.name === 'mixamorigSpine') {
                    waist_r2 = child;
                }
            }

        } );

        mixer_b = new THREE.AnimationMixer( object );

        idleAnim = object.animations[ 0 ];
        idleAnim.tracks.splice(30, 3);
        //idleAnim.tracks.splice(4, 1);
        let action = mixer_b.clipAction(idleAnim);
        //console.log(idleAnim);
        action.play();;
        scene.add( object );
        //scene.add( room_2_char );
    } );

    diffuseMap = textureLoader.load( assetsRoot + 'plant_diff.png' );
    assetsPBRMap = textureLoader.load( assetsRoot + 'plant_pbr.png' );
    //let normalMap = textureLoader.load( assetsRoot + 'plant_norm.png' );

    let plant_mat = new THREE.MeshStandardMaterial( {
        //color: 0x616161,
        map: diffuseMap,
        lightMap: assetsPBRMap,
        roughnessMap: assetsPBRMap,
        aoMap: assetsPBRMap,
        aoMapIntensity: 1,
        lightMapIntensity: 1,
        //normalMap: normalMap,
        envMap: mainEnv,
        envMapIntensity: 1,
    } );
    plant_mat.transparent = true;
    plant_mat.side = THREE.DoubleSide;
    plant_mat.alphaTest = 0.5;
    fbxLoader.load( assetsRoot + 'plant.fbx', function ( object ) {

        object.traverse( function ( child ) {

            if ( child.isMesh ) {
                child.material = plant_mat;
            }

        } );
        //object.position.x += 400;
        scene.add( object );

    } );

}

// PRELOADERS
function setRoom_01Loader(){
    loadingManager_r1 = new THREE.LoadingManager();

    loadingManager_r1.onStart = (url, itemsLoaded, itemsTotal) =>{
        //console.log( 'Started loading file: ' + url + '.\nLoaded ' + itemsLoaded + ' of ' + itemsTotal + ' files.' );
    };

    loadingManager_r1.onProgress = function ( url, itemsLoaded, itemsTotal ) {

        //console.log( 'Loading file: ' + url + '.\nLoaded ' + itemsLoaded + ' of ' + itemsTotal + ' files.' );

    };

    loadingManager_r1.onLoad =  () => {
        room_01_character = CharacterInstancer.instanceCharacter('bruce');
        let room_01_animation = CharacterInstancer.getAnimation('room-01-pose');
        mixer_room_01 = new THREE.AnimationMixer( room_01_character );
        let action = mixer_room_01.clipAction(room_01_animation);
        action.play();

        scene.add( room_01_character );
        room_01_character.position.z = 118.113;
        room_01_character.position.x = 9;
        room_01_character.rotation.y = 2.356;

        head_room_01_bone = CharacterInstancer.setMouseFollower(room_01_character, 'CC_Base_Head', 'room-01');

        console.log('Loading room 01 completed');
        const loadingScreen = document.getElementById( 'loading-screen' );
        loadingScreen.classList.add( 'fade-out' );
        loadingScreen.addEventListener( 'transitionend', onTransitionEnd );
        $('.navbar').removeClass('invisible');
        $('#home-btn').removeClass('invisible');
        $('#about-btn').removeClass('invisible');
        animate();
        setRoom_02Loader();
    } ;
}

function setRoom_02Loader(){
    loadingManager_r2 = new THREE.LoadingManager();
    setRoom_2();

    loadingManager_r2.onStart = (url, itemsLoaded, itemsTotal) =>{
        //console.log( 'Started loading file: ' + url + '.\nLoaded ' + itemsLoaded + ' of ' + itemsTotal + ' files.' );
    };

    loadingManager_r2.onProgress = function ( url, itemsLoaded, itemsTotal ) {

        //console.log( 'Loading file: ' + url + '.\nLoaded ' + itemsLoaded + ' of ' + itemsTotal + ' files.' );

    };

    loadingManager_r2.onLoad =  () => {
        console.log('Loading room 02 completed');
        $('#web-btn').removeClass('invisible');
        $('#web-service').removeClass('d-none');
    } ;
}
//--> PRELOADERS

function setPlateMaterial(lightMap, name){

    let dynamicTexture = new THREEx.DynamicTexture(256, 256);
    dynamicTexture.context.font	= "bolder 50px Anton";
    dynamicTexture.texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
    dynamicTexture.clear('#090909').drawText(webSectionsPlates[name], undefined, 150, '#b01c1c');

    let plateMaterial = new THREE.MeshStandardMaterial( {
        //color: 0x1a1515,
        map: dynamicTexture.texture,
        lightMap: lightMap,
        aoMap: lightMap,
        roughness: 1,
        aoMapIntensity: 1,
        lightMapIntensity: 1,
        envMapIntensity: 0,
    } );
    return plateMaterial;
}

function onDocumentMouseMove( event ) {

    mouseX = ( event.clientX - windowHalfX )/5;
    mouseY = ( event.clientY - windowHalfY )/5;
    mX = event.clientX;
    mY = event.clientY;

    CharacterInstancer.moveHead('CC_Base_Head','room-01', 30, mX-400, mY-300);
    //if ( neck ) moveJoint(neck, 30, -400, -300);
    //if ( neck_r2 ) moveJoint(neck_r2, 60, -200, -300);
}

function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );

}

let a_distance = {x:0 , y:-100, z: -200};
let a_LA_Distance = {x:0 , y:0, z: 50};

let b_distance = {x:200 , y:-250, z: -75};
let b_LA_Distance = {x:0 , y:-300, z: -135};

function updateCamera(move){
    //console.log(move);
    let maxYScrollScene_a = window.innerHeight / 2;

    let scopeB_pos = {x: camPositions[0].x, y: camPositions[0].y + a_distance.y, z: camPositions[0].z + a_distance.z};
    let startYScrollScene_b = $("#launch").height() + $("#about").parent().height();
    let maxYScrollScene_b = startYScrollScene_b + $("#web-service").height();
    let b_scrollPix = $("#web-service").height();

    let newPosX;
    let newPosY;
    let newPosZ;
    let newLookAtX;
    let newLookAtY;
    let newLookAtZ;

    //if(move === "up" && window.scrollY === 0){
        // hack jquery
    //}else{
        if(window.scrollY < maxYScrollScene_a){
            //console.log("A scope");
            newPosZ = camPositions[0].z + (window.scrollY * a_distance.z)/maxYScrollScene_a;
            newPosY = camPositions[0].y + (window.scrollY * a_distance.y)/maxYScrollScene_a;
            newLookAtZ = lookAtInit.z + (window.scrollY * a_LA_Distance.z)/maxYScrollScene_a;

            camera.position.z = newPosZ;
            camera.position.y = newPosY;
            camera.lookAt( lookAtInit.x, lookAtInit.y, newLookAtZ );
            //console.log("launch - About");
        }
        if(window.scrollY > startYScrollScene_b && window.scrollY < maxYScrollScene_b + 100){
            //console.log("B scope");
            //console.log(window.scrollY - startYScrollScene_b);
            newPosX = camPositions[0].x + ((window.scrollY - startYScrollScene_b) * b_distance.x)/b_scrollPix;
            newPosZ = scopeB_pos.z + ((window.scrollY - startYScrollScene_b) * b_distance.z)/b_scrollPix;
            newPosY = scopeB_pos.y + ((window.scrollY - startYScrollScene_b) * b_distance.y)/b_scrollPix;
            newLookAtX = (lookAtInit.x + a_LA_Distance.x)+ ((window.scrollY - startYScrollScene_b) * b_LA_Distance.x)/b_scrollPix;
            newLookAtY = (lookAtInit.y + a_LA_Distance.y)+ ((window.scrollY - startYScrollScene_b) * b_LA_Distance.y)/b_scrollPix;
            newLookAtZ = (lookAtInit.z + a_LA_Distance.z) + ((window.scrollY - startYScrollScene_b) * b_LA_Distance.z)/b_scrollPix;
            camera.lookAt( newLookAtX, newLookAtY, newLookAtZ );

            camera.position.x = newPosX;
            camera.position.y = newPosY;
            camera.position.z = newPosZ;
            console.log("web");
        }
    //}



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
        if ( mixer_room_01 ) mixer_room_01.update( delta );
        if ( mixer_b ) mixer_b.update( delta );

        scene.rotation.y += idleSensibility * ( targetX - scene.rotation.y );
        scene.rotation.x += idleSensibility * ( targetY - scene.rotation.x );
        //console.log(camera.position.z);

    }
    TWEEN.update();
    if(clickAnimate){
        if(window.scrollY > 0){
            //console.log('anim click = true');
            updateCamera();
        }
    }else{
        //console.log('anim click = false');
        updateCamera();
    }

    //camera.position.set( 0, camY, 150);
    //console.log(camera.rotation.z);
    //renderer.render( scene, camera );
    composer.render();
    if(rendering) requestAnimationFrame( animate );
}

function transitionCam(){
    rendering = false;
    //console.log('tween');
    /*if(actualPos === 0){
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
    tweenPos.onComplete(tweenCompleted);*/

}

function tweenCompleted(){
    //console.log('tween completed');
    TWEEN.removeAll();
    inTransition = false;
}

function onTransitionEnd( event ) {
    $('#sections-container').fadeIn();
    setHtmlDisplay();
    event.target.remove();
}

function stopRendering(){
    rendering = false;
}