'use strict';

(function ($) {

    /*------------------
    Preloader
--------------------*/
$(window).on('load', function () {
        $(".loader").fadeOut();
        $("#preloder").delay(200).fadeOut("slow");
    });
    $(document).ready(function () {

        console.log("JS chạy");

        $(".humberger__open").click(function () {
            $(".humberger__menu__wrapper").addClass("show__humberger__menu__wrapper");
            $(".humberger__menu__overlay").addClass("active");
            $("body").addClass("over_hid");
        });

        $(".humberger__menu__overlay").click(function () {
            $(".humberger__menu__wrapper").removeClass("show__humberger__menu__wrapper");
            $(".humberger__menu__overlay").removeClass("active");
            $("body").removeClass("over_hid");
        });

        $('.hero__categories__all').click(function () {
            $('.hero__categories ul').slideToggle(400);
        });

        $('.set-bg').each(function () {
            var bg = $(this).data('setbg');
            $(this).css('background-image', 'url(' + bg + ')');
        });
// Thêm hiệu ứng click đổ xuống cho menu con trên mobile
$(".humberger__menu__nav ul li").on('click', function () {
    $(this).find('.header__menu__dropdown').slideToggle(400);
});
    });
    
})(jQuery);