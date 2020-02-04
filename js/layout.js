$(document).ready(function(){
    let headlineHeight = $('.home-headline').height() + 50;
    $('.home-headline').css({top: window.innerHeight - headlineHeight});
});

window.onresize = function(event) {
    let headlineHeight = $('.home-headline').height() + 50;
    $('.home-headline').css({top: window.innerHeight - headlineHeight});
};