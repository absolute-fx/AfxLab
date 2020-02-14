import * as THREE from "../js/three.module.js";
import {CSS3DRenderer, CSS3DObject} from "../js/jsm/renderers/CSS3DRenderer.js";

let THREEx ={};


THREEx.HtmlMixer	= THREEx.HtmlMixer	|| {};

THREEx.HtmlMixer.Context	= function(rendererWebgl, scene, camera){
    // update functions
    let updateFcts	= [];
    this.update	= function(){
        updateFcts.forEach(function(updateFct){
            updateFct()
        })
    };

    // build cssFactor to workaround bug due to no display 
    let cssFactor	= 1000;
    this.cssFactor	= cssFactor;

    //////////////////////////////////////////////////////////////////////////////////
    //		update renderer
    //////////////////////////////////////////////////////////////////////////////////

    let rendererCss	= new CSS3DRenderer();
    this.rendererCss= rendererCss;


    this.rendererWebgl	= rendererWebgl;

    //////////////////////////////////////////////////////////////////////////////////
    //		Handle Camera
    //////////////////////////////////////////////////////////////////////////////////

    let cssCamera	= new THREE.PerspectiveCamera(camera.fov, camera.aspect, camera.near*cssFactor, camera.far*cssFactor);

    updateFcts.push(function(){
        cssCamera.quaternion.copy(camera.quaternion);

        cssCamera.position
            .copy(camera.position)
            .multiplyScalar(cssFactor)
    });

    //////////////////////////////////////////////////////////////////////////////////
    //		Comment								//
    //////////////////////////////////////////////////////////////////////////////////
    // create a new scene to hold CSS
    let cssScene = new THREE.Scene();
    this.cssScene= cssScene;

    //////////////////////////////////////////////////////////////////////////////////
    //		Auto update objects
    //////////////////////////////////////////////////////////////////////////////////

    this.autoUpdateObjects	= true;
    updateFcts.push(function(){
        if( this.autoUpdateObjects !== true )	return;
        cssScene.traverse(function(cssObject){
            if( cssObject instanceof THREE.Scene === true )	return;
            let mixerPlane	= cssObject.userData.mixerPlane;
            if( mixerPlane === undefined )	return;
            mixerPlane.update()
        })
    }.bind(this));

    //////////////////////////////////////////////////////////////////////////////////
    //		Render cssScene
    //////////////////////////////////////////////////////////////////////////////////
    updateFcts.push(function(delta, now){
        rendererCss.render(cssScene, cssCamera)
    })
};

THREEx.HtmlMixer.Plane = function(mixerContext, domElement, opts) {
    opts		= opts	|| {};
    opts.elementW	= opts.elementW	!== undefined	? opts.elementW	: 768;
    opts.planeW	= opts.planeW !== undefined	? opts.planeW	: 1;
    opts.planeH	= opts.planeH !== undefined	? opts.planeH	: 3/4;
    opts.object3d	= opts.object3d !== undefined	? opts.object3d	: null;
    this.domElement	= domElement;

    // update functions
    let updateFcts	= [];
    this.update	= function(){
        updateFcts.forEach(function(updateFct){
            updateFct()
        })
    };

    let planeW	= opts.planeW;
    let planeH	= opts.planeH;
    let object3d;
    if( opts.object3d === null ){
        let planeMaterial   = new THREE.MeshBasicMaterial({
            opacity	: 0,
            color	: new THREE.Color('black'),
            blending: THREE.NoBlending,
            side	: THREE.DoubleSide,
        });
        let geometry	= new THREE.PlaneGeometry( opts.planeW, opts.planeH );
        object3d	= new THREE.Mesh( geometry, planeMaterial )
    }else{
        object3d	= opts.object3d
    }

    this.object3d	= object3d;


    // width of iframe in pixels
    let aspectRatio		= planeH / planeW;
    let elementWidth	= opts.elementW;
    let elementHeight	= elementWidth * aspectRatio;

    this.setDomElement	= function(newDomElement){
        console.log('setDomElement: newDomElement', newDomElement);
        // remove the oldDomElement
        let oldDomElement	= domElement;
        if( oldDomElement.parentNode ){
            oldDomElement.parentNode.removeChild(oldDomElement);
        }
        // update local letiables	
        this.domElement		= domElement	= newDomElement;
        // update cssObject
        cssObject.element	= domElement;
        // reset the size of the domElement
        setDomElementSize()
    };
    function setDomElementSize(){
        domElement.style.width	= elementWidth  + "px";
        domElement.style.height	= elementHeight + "px";
    }
    setDomElementSize();

    // create a CSS3DObject to display element
    let cssObject		= new CSS3DObject( domElement );
    this.cssObject		= cssObject;
    cssObject.scale.set(1,1,1)
        .multiplyScalar(mixerContext.cssFactor/(elementWidth/planeW));

    // hook cssObhect to mixerPlane
    cssObject.userData.mixerPlane	= this;

    //////////////////////////////////////////////////////////////////////////////////
    //		hook event so cssObject is attached to cssScene when object3d is added/removed
    //////////////////////////////////////////////////////////////////////////////////
    object3d.addEventListener('added', function(event){
        mixerContext.cssScene.add(cssObject)
    });
    object3d.addEventListener('removed', function(event){
        mixerContext.cssScene.remove(cssObject)
    });

    //////////////////////////////////////////////////////////////////////////////////
    //		Comment								//
    //////////////////////////////////////////////////////////////////////////////////

    updateFcts.push(function(){
        // get world position
        object3d.updateMatrixWorld();
        let worldMatrix	= object3d.matrixWorld;

        // get position/quaternion/scale of object3d
        let position	= new THREE.Vector3();
        let scale	= new THREE.Vector3();
        let quaternion	= new THREE.Quaternion();
        worldMatrix.decompose(position, quaternion, scale);

        // handle quaternion
        cssObject.quaternion.copy(quaternion);

        // handle position
        cssObject.position
            .copy(position)
            .multiplyScalar(mixerContext.cssFactor);
        // handle scale
        let scaleFactor	= elementWidth/(object3d.geometry.parameters.width*scale.x);
        cssObject.scale.set(1,1,1).multiplyScalar(mixerContext.cssFactor/scaleFactor)
    })
};


THREEx.HtmlMultipleMixer	= {};

THREEx.HtmlMultipleMixer.Context	= function(){
    // store all context
    let contexts	= [];
    this.contexts	= contexts;

    // update all context
    this.update	= function(){
        contexts.forEach(function(context){
            context.update();
        })
    }
};

THREEx.HtmlMultipleMixer.Plane = function(multipleMixerContext, domElement, opts){
    opts		= opts	|| {};
    opts		= JSON.parse(JSON.stringify(opts));

    let contexts	= multipleMixerContext.contexts;
    let planes	= [];
    this.planes	= planes;

    let mixerContext= contexts[0];
    let plane 	= new THREEx.HtmlMixer.Plane(mixerContext, domElement, opts);
    planes.push(plane);
    this.object3d	= plane.object3d;

    opts.object3d	= this.object3d;

    for(let i = 1; i < contexts.length; i++){
        let mixerContext= contexts[i];
        let cloneElement= domElement.cloneNode();
        let plane 	= new THREEx.HtmlMixer.Plane(mixerContext, cloneElement, opts);
        planes.push(plane);
    }

    // update all context
    this.update	= function(){
        planes.forEach(function(plane){
            plane.update();
        })
    }
};

THREEx.DynamicTexture	= function(width, height){

    let canvas	= document.createElement( 'canvas' );
    canvas.width	= width;
    canvas.height	= height;
    this.canvas	= canvas;

    let context	= canvas.getContext( '2d' );
    this.context	= context;

    let texture	= new THREE.Texture(canvas);
    this.texture	= texture
};

THREEx.DynamicTexture.prototype.clear = function(fillStyle){
    // depends on fillStyle
    if( fillStyle !== undefined ){
        this.context.fillStyle	= fillStyle;
        this.context.fillRect(0,0,this.canvas.width, this.canvas.height)
    }else{
        this.context.clearRect(0,0,this.canvas.width, this.canvas.height)
    }
    // make the texture as .needsUpdate
    this.texture.needsUpdate	= true;
    // for chained API
    return this;
};

THREEx.DynamicTexture.prototype.drawText = function(text, x, y, fillStyle, contextFont){
    // set font if needed
    if( contextFont !== undefined )	this.context.font = contextFont;
    // if x isnt provided
    if( x === undefined || x === null ){
        let textSize	= this.context.measureText(text);
        x = (this.canvas.width - textSize.width) / 2;
    }
    // actually draw the text
    this.context.fillStyle = fillStyle;
    this.context.fillText(text, x, y);
    // make the texture as .needsUpdate
    this.texture.needsUpdate	= true;
    // for chained API
    return this;
};

THREEx.DynamicTexture.prototype.drawTextCooked = function(options){
    let context	= this.context;
    let canvas	= this.canvas;
    options		= options	|| {};
    let text	= options.text;
    let params	= {
        margin		: options.margin !== undefined ? options.margin	: 0.1,
        lineHeight	: options.lineHeight !== undefined ? options.lineHeight : 0.1,
        align		: options.align !== undefined ? options.align : 'left',
        fillStyle	: options.fillStyle !== undefined ? options.fillStyle : 'black',
        font		: options.font !== undefined ? options.font : "bold "+(0.2*512)+"px Arial",
    };
    // sanity check
    console.assert(typeof(text) === 'string');

    context.save();
    context.fillStyle	= params.fillStyle;
    context.font		= params.font;

    let y	= (params.lineHeight + params.margin)*canvas.height;
    let x;

    while(text.length > 0 ){
        // compute the text for specifically this line
        let maxText	= computeMaxTextLength(text);
        // update the remaining text
        text	= text.substr(maxText.length);


        // compute x based on params.align
        let textSize	= context.measureText(maxText);
        if( params.align === 'left' ){
            x	= params.margin*canvas.width
        }else if( params.align === 'right' ){
            x	= (1-params.margin)*canvas.width - textSize.width
        }else if( params.align === 'center' ){
            x = (canvas.width - textSize.width) / 2;
        }else	console.assert( false );

        // actually draw the text at the proper position
        this.context.fillText(maxText, x, y);

        // goto the next line
        y	+= params.lineHeight*canvas.height;
    }
    context.restore();

    // make the texture as .needsUpdate
    this.texture.needsUpdate	= true;
    // for chained API
    return this;

    function computeMaxTextLength(text){
        let maxText	= '';
        let maxWidth	= (1-params.margin*2)*canvas.width;
        while( maxText.length !== text.length ){
            let textSize	= context.measureText(maxText);
            if( textSize.width > maxWidth )	break;
            maxText	+= text.substr(maxText.length, 1)
        }
        return maxText
    }
};

THREEx.DynamicTexture.prototype.drawImage	= function(/* same params as context2d.drawImage */){
    // call the drawImage
    this.context.drawImage.apply(this.context, arguments);
    // make the texture as .needsUpdate
    this.texture.needsUpdate	= true;
    // for chained API
    return this;
};

/**
 * create a plane on which we map 2d text
 */
THREEx.DynamicText2DObject	= function(){
    let geometry = new THREE.PlaneGeometry(1,1,1);
    let material = new THREE.MeshPhongMaterial({
        transparent: true
    });

    THREE.Mesh.call( this, geometry, material );

    // create the dynamicTexture
    console.assert(this.dynamicTexture === undefined);
    let dynamicTexture      = new THREEx.DynamicTexture(512,512);

    this.dynamicTexture     = dynamicTexture;
    // same parameters as THREEx.DynamicTexture.drawTextCooked
    // - TODO take it from the default paramters of the functions
    //   - no need to duplicate here
    this.parameters = {
        text            : 'Hello World',
        margin		: 0.1,
        lineHeight	: 0.2,
        align		: 'left',
        fillStyle	: 'blue',
    };

    // set the texture material
    material.map    = this.dynamicTexture.texture;

    this.update()
};

THREEx.DynamicText2DObject.prototype = Object.create( THREE.Mesh.prototype );

THREEx.DynamicText2DObject.prototype.update = function(){
    let dynamicTexture = this.dynamicTexture;
    let parameters = this.parameters;
    let context = dynamicTexture.context;
    // update the text
    dynamicTexture.clear();
    // actually draw the text
    dynamicTexture.drawTextCooked(parameters);
};


export {THREEx}
