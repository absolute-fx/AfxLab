$(document).ready(function(){

    //if($('#about').height() > window.innerHeight) $('#about').parent().height($('#about').height());
});

function setHtmlDisplay(){
    let headlineHeight = $('.home-headline').height() + 50;
    $('.home-headline').css({top: window.innerHeight - headlineHeight});
    setheadlineAnim();
    setAboutAnim();
    setWebDevAnim();
}



window.onresize = function(event) {
    let headlineHeight = $('.home-headline').height() + 50;
    $('.home-headline').css({top: window.innerHeight - headlineHeight});
    //$("#about").css({marginTop: window.innerHeight});
};


let controller = new ScrollMagic.Controller();

function setheadlineAnim(){
    let headlineWidth = $('.home-headline').width();
    let scene = new ScrollMagic.Scene({
        triggerElement: "#about", duration: 100, triggerHook: 0.5
    })
        //.setPin(".home-headline")
        .setTween(".home-headline", {left: -400, opacity: 0}) // trigger a TweenMax.to tween
        //.addIndicators({name: "1 (duration: 150)"}) // add indicators (requires plugin)
        .addTo(controller);
}

function setAboutAnim(){
    new ScrollMagic.Scene({triggerElement: "#about", duration: 800, triggerHook: 0})
        //.setTween("#about-description", {left: -30})
        .setTween("#about-hdl-01", {opacity: 1})
        .setPin("#about")
        //.addIndicators({name: "1 (duration: 500)"}) // add indicators (requires plugin)
        .addTo(controller);
}

function setWebDevAnim(){
    new ScrollMagic.Scene({triggerElement: "#web-service", duration: 1000, triggerHook: 0})
        //.setTween("#about-description", {left: -30})
        .setTween("#web-hdl", {opacity: 1})
        .setPin("#web-service")
        //.addIndicators({name: "1 (duration: 500)"}) // add indicators (requires plugin)
        .addTo(controller);
}

