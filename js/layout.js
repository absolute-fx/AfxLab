$(document).ready(function(){
    setNav();
    //if($('#about').height() > window.innerHeight) $('#about').parent().height($('#about').height());
});

function setHtmlDisplay(){
    let headlineHeight = $('.home-headline').height() + 50;
    $('.home-headline').css({top: window.innerHeight - headlineHeight});
    setheadlineAnim();
    setAboutAnim();
}

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
        //.setTween("#about-description", {left: -30})
        .setTween("#about-hdl-01", {opacity: 1})
        .setPin("#about")
        //.addIndicators({name: "1 (duration: 500)"}) // add indicators (requires plugin)
        .addTo(controller);
}

function setOverlay(cat){
    //$('.overlay').css("top", 0);
    $("canvas").addClass('d-none');
    $("#sections-container").addClass('d-none');
    $('.overlay').addClass('overlay-animating');
    $('.overlay').removeClass('overlay-animating-out');
    $("#main-menu").fadeOut();
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
    window.location.hash = 'web-service';
    $('.overlay').removeClass('overlay-animating');
    $('.overlay').addClass('overlay-animating-out');
    $("canvas").removeClass('d-none');
    $("#main-menu").fadeIn();
}