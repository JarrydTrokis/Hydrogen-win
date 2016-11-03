var $ = require("jquery");
var ipcRenderer = require("electron").ipcRenderer;
var original_opacity = 1;

ipcRenderer.on('opacity', (event, arg) => {
		var opacity = parseFloat($("body").css("opacity"));

		if (arg == '-') {
			opacity -= 0.1;
			original_opacity = opacity;
		}
		else if (arg == '+') {
			opacity += 0.1;
			original_opacity = opacity;
		}
		else if (arg == 'r') {
			opacity = original_opacity;
		}
		else {
			if (arg < original_opacity) {
				opacity = arg;
			}
		}

		if (opacity < 0) {
			opacity = 0;
		}
		else if (opacity > 1) {
			opacity = 1;
		}

		$("body").css("opacity", opacity);
	});
	ipcRenderer.on('draggable', (event, arg) => {
			return;
			if (arg == true) {
				$("html,.navBar").css("-webkit-app-region", "drag");
				$("html,.navBar").css('cursor', 'move');
			}
			else {
				$("html,.navBar").css("-webkit-app-region", "no-drag");
				$("html,.navBar").css('cursor', 'auto');
			}
	});
	ipcRenderer.on('navbar', (event, arg) => {
		return;
			if (arg == 'hide') {
				$(".navBar").hide();
			}
			else {
				$(".navBar").show();
			}
	});

$(document).ready(function() {
	var resize = function() {
		$(".navBar").width($(window).width()-10);
		$("webview").width($(window).width());
		$("webview").height($(window).height());
	};

	var start = function(url) {
		$("#content").remove();
		$("body").removeClass("opaque");
		$("#innerPage").show();
		var wvhtml = $("<webview id='wv' src='"+url+"' autosize='on'></webview>");
		wvhtml[0].addEventListener('did-stop-loading', function(e) {
			$(".current-page").val($("webview")[0].getURL());
		});
		$("#innerPage").append(wvhtml);

		ipcRenderer.send("resize", "big");
		resize();
	}

	$(".start").click(function() {
		start($(this).attr("data-link"));
	});

	$(".history-back").click(function() {
		$("webview")[0].goBack();
	})

	$(".history-forward").click(function() {
		$("webview")[0].goForward();
	})

	$(".current-page").keypress(function(e) {
		if (e.keyCode == 13) {
			var page = $(".current-page").val();
			if (page.trim == "") return;
			if (!page.startsWith("http")) {
				page = "http://"+page;
			}

			$("webview")[0].loadURL(page);
		}
	})

	$(window).resize(function() {
		resize();
	});
});
