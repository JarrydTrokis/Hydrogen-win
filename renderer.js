var $ = require("jquery");
var ipcRenderer = require("electron").ipcRenderer;

ipcRenderer.on('opacity', (event, arg) => {
		var opacity = parseFloat($("body").css("opacity"));

		console.log(opacity);
		if (arg == '-') {
			opacity -= 0.1;
		}
		else {
			opacity += 0.1;
		}
		console.log(opacity);

		if (opacity < 0) {
			opacity = 0;
		}
		else if (opacity > 1) {
			opacity = 1;
		}

		$("body").css("opacity", opacity);
	});
	ipcRenderer.on('draggable', (event, arg) => {
			if (arg == true) {
				$("html,webview").css("-webkit-app-region", "drag");
			}
			else {
				$("html,webview").css("-webkit-app-region", "no-drag");
			}
	});
	ipcRenderer.on('navbar', (event, arg) => {
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
		$("webview").height($(window).height()-45);
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