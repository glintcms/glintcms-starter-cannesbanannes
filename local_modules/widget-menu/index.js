var debug = require('debug')('widget-menu');
var fs = require('fs');
var dot = require('dot');
var defaults = require('defaults');
var Widget = require('glint-widget');
var isBrowser = require('is-browser');

var c = require('./config');

var template = fs.readFileSync(__dirname + '/index.dot', 'utf-8');
var compiled = dot.template(template);

module.exports = function(o) {

  o = defaults(o, c);

  return  Widget(function(options) {
      return compiled(options);
    }).selector(o.selector).place(o.place);

};

/*
 code executed only once on load
 */
if (isBrowser) {

  jQuery(function($) {


    //Preloader
    var preloader = $('.preloader');
    $(window).load(function() {
      preloader.remove();
      //$('body').scrollTop(0);
    });

    //#main-slider
    var slideHeight = $(window).height();
    $('#home-slider .item').css('height', slideHeight);

    $(window).resize(function() {
      'use strict',
        $('#home-slider .item').css('height', slideHeight);
    });

    //Scroll Menu
    $(window).on('scroll', function() {
      if ($(window).scrollTop() > slideHeight) {
        $('.main-nav').addClass('navbar-fixed-top');
      } else {
        $('.main-nav').removeClass('navbar-fixed-top');
      }
    });

    // Navigation Scroll
    $(window).scroll(function(event) {
      Scroll();
    });


    $('.navbar-collapse ul li.scroll a').on('click', function() {
      var offset = $(this.hash).offset();
      if (offset) {
        $('html, body').animate({scrollTop: offset.top - 5}, 1000);
      }
      return false;
    });

    // User define function
    function Scroll() {
      var contentTop = [];
      var contentBottom = [];
      var winTop = $(window).scrollTop();
      var rangeTop = 200;
      var rangeBottom = 500;
      $('.navbar-collapse').find('.scroll a').each(function() {
        var target = $($(this).attr('href'));
        if (target && target.offset()) {
          contentTop.push(target.offset().top);
          contentBottom.push(target.offset().top + target.height());
        }
      });
      $.each(contentTop, function(i) {
        if (winTop > contentTop[i] - rangeTop) {
          $('.navbar-collapse li.scroll')
            .removeClass('active')
            .eq(i).addClass('active');
        }
      })
    }

    // wow / scroll
    new WOW().init();
    smoothScroll.init({offset: 100});
    $('body').scrollTop(0);

  });


}
