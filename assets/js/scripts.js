/*************************************
* Navigation / Dropdowns Accordians
*************************************/
// Large Main Dropdown Navigation Menu
(function($) { 
	$('#main-nav li.no-click>a').click(function(event){ // this simply disables the clicking on the headings we don't want to function as links    
    	event.preventDefault()
 	});

	$('#main-nav ul.menu > li').on('click', function (e) {
		e.stopPropagation();		
		if ( $(this).hasClass('open') ) { 
			$(this).removeClass('open');
		} else { 
			$('#main-nav .open').removeClass('open'); 
			$(this).addClass('open'); 
		}
	});		
	// closes menu when you click outside
	$(document).on('click', function () {
		$('#main-nav .open').removeClass('open');
	});
	
	$('#main-nav .sub-menu').on('click', function(e){
		e.stopPropagation();
	});	
})(jQuery);


jQuery(document).ready(function($){
	// basic show hide of info 
	$('.show-it').on('click', function(e){
		$(this).closest('li').find('.show-me').slideToggle('fast');
		checkSize(); //lets run the check size since new elements / heights hve opened
		e.preventDefault()
	});		
	// better way to handle responsive js.. instead of checking unreliable window size, let's check for a class change on element
    checkSize();
    $(window).resize(checkSize);

    //Function to the css rule
	function checkSize(){
	    if ($(".summary-wrap").css("position") == "absolute" ){ // lets only run this stuff if it's desktop, once smaller, we change position to static so this returns false and doesn't run
	        var length = $('.summary-wrap').height() - $('.cart-summary').height() + $('.summary-wrap').offset().top;
			    $(window).scroll(function () {
			        var scroll = $(this).scrollTop();
			        var height = $('.cart-summary').height() + 'px';
			        if (scroll < $('.summary-wrap').offset().top) {
			            $('.cart-summary').css({
			                'position': 'absolute',
			                'top': '0'
			            });
			        } else if (scroll > length) {
			            $('.cart-summary').css({
			                'position': 'absolute',
			                'bottom': '0',
			                'top': 'auto'
			            });
			        } else {
			            $('.cart-summary').css({
			                'position': 'fixed',
			                'top': '0',
			                'height': height
			            });
			        }
			    });
	    }
	}
	
});

$(document).foundation({
  abide : {
    validators: {
        checkbox_limit: function(el, required, parent) {
            var group = parent.closest('.checkbox-group');
            var min = group.attr('data-abide-validator-min');
            var checked = group.find(':checked').length;
            if (checked >= min) {
                group.find('small.error').hide();
                group.find('label.error').removeClass('error');
                group.find('.columns').removeClass('error');
                return true;
            } else {
                group.find('small.error').css({
                    display: 'block'
                });
                return false;
            }
        }
    }
  }
});