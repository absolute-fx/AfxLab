$(document).ready(function(){
    setNav();
    let headlineHeight = $('.home-headline').height() + 50;
    $('.home-headline').css({top: window.innerHeight - headlineHeight});
    //$('#loading-screen').height($(document).height());
    //$("#about").css({marginTop: window.innerHeight});
    setheadlineAnim();
    setAboutAnim();
});


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
    $('html, body').animate({
        scrollTop: $(target).offset().top
    },2000);

    $('.navbar-nav a').each(function () {
        $(this).removeClass('active');
    });
    $(btn).addClass('active');
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
        .setTween("#about-description", {left: -30})
        .setTween("#about-hdl-01", {opacity: 1})
        .setPin("#about")
        //.addIndicators({name: "1 (duration: 500)"}) // add indicators (requires plugin)
        .addTo(controller);
}