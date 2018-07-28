var threadWidth = 15;
var threadSpacing = 2;


// we are using http://svgjs.com/
SVG.on(document, 'DOMContentLoaded', function() {
	threading = SVG('threading');
	tieup = SVG('tieup');
	drawdown = SVG('drawdown');
	treadling = SVG('treadling');
	renderNewDraft();
});

var done = false;
function testSave () {
	if (!done) {
		done=true;
		saveWif(draft, "saved.wif");
	}
}

function renderNewDraft() {
	// threading width is number of warps * thread width
	// threading height is number of frames * thread width
	threading.size(draft.WARP.Threads * threadWidth, draft.WEAVING.Shafts * threadWidth);
	// threading.rect(draft.WARP.Threads * threadWidth, draft.WEAVING.Shafts * threadWidth).fill('#f06');
	for (var i=0; i<draft.WARP.Threads; i++) {
		var thisWarp = threading.group();
		for (var j=0; j<draft.WEAVING.Shafts; j++) {
			var heddle = threading.rect(threadWidth, threadWidth).move(i*threadWidth, j*threadWidth);
			heddle.addTo(thisWarp);
			heddle.warpNumber = i+1;
			heddle.pos = j+1;
			if (heddle.pos == parseInt(draft.THREADING[heddle.warpNumber])) heddle.fill('#f06');
			else heddle.fill("#fff");
			heddle.click(function () {
				var sibs = this.siblings();
				this.fill("#0ff");
				for (var h=0; h<sibs.length; h++) {
					if (sibs[h]!=this) {
						sibs[h].fill("#fff");
					}
				}
				// then update the draft
				draft.THREADING[this.warpNumber] = this.pos;
				// console.log(draft.THREADING);
			});
			heddle.mouseover(function () {
				this.stroke({color:'#000', width:1});
			});
			heddle.mouseout(function () {
				this.attr('stroke', null);
			})
		}
	}

	tieup.size(draft.WEAVING.Treadles * threadWidth, draft.WEAVING.Shafts * threadWidth);
	tieup.rect(draft.WEAVING.Treadles * threadWidth, draft.WEAVING.Shafts * threadWidth).fill('#06f');

	drawdown.size(draft.WARP.Threads * threadWidth, draft.WEFT.Threads * threadWidth);
	drawdown.rect(draft.WARP.Threads * threadWidth, draft.WEFT.Threads * threadWidth).fill('#60f');

	treadling.size(draft.WEAVING.Treadles * threadWidth, draft.WEFT.Threads * threadWidth);
	treadling.rect(draft.WEAVING.Treadles * threadWidth, draft.WEFT.Threads * threadWidth).fill('#6f0');

	for (var i=0; i<draft.WEFT.Threads; i++) {
		var thisPick = parseInt(draft.TREADLING[i+1]) - 1; //warps and frames are 1-indexed
		treadling.rect(threadWidth, threadWidth).move(thisPick * threadWidth, i * threadWidth).fill('#000');
	}
}

// function updateDraft () {
// 	for (var i=0; i<draft.WARP.Threads; i++) {
// 		renderWarpDrawdown(drawdown.warps[i]);
// 	}
// }

// function togglePosition () {
// 	// clear the other frames for this warp
// 	// update the draft
// 	// re-render this warp
// }

// function renderWarpThreading () {
// 	// move the box to the right position
// }

// function renderWarpDrawdown () {
// 	// iterate over picks
// }

// ------- File saving / loading ----------
// (mostly copied from earlier projects...)

function saveSvg(data, name) {
	var svgBlob = new Blob([data], {type:"image/svg+xml;charset=utf-8"});
	var svgUrl = URL.createObjectURL(svgBlob);
	var downloadLink = document.createElement("a");
	downloadLink.href = svgUrl;
	downloadLink.download = name;
	document.body.appendChild(downloadLink);
	downloadLink.click();
	document.body.removeChild(downloadLink);
}

function saveWif (data, name) {
	console.log("downloading WIF");
	var wif = encodeINI(data);
	console.log(wif);
	var wifBlob = new Blob([wif], {type:"text/plain;charset=utf-8"});
	var wifUrl = URL.createObjectURL(wifBlob);
	var downloadLink = document.createElement("a");
	downloadLink.href = wifUrl;
	downloadLink.download = name;
	document.body.appendChild(downloadLink);
	downloadLink.click();
	// document.body.removeChild(downloadLink);
}

function loadWif (text) {
	var data = decodeINI(text);
	if (data.WIF) {
		draft = data;
		// console.log(JSON.stringify(data, null, 4));
		console.log(data);
		renderNewDraft();
	}
	else {
		console.log("not a WIF?");
		console.log(text);		
	}
}

function processFile (file) {
	reader = new FileReader();
	reader.readAsText(file);
	reader.onload = function (e) {
		var result = e.target.result;
		loadWif(result);
	};
}



// drop handling from https://developer.mozilla.org/en-US/docs/Web/API/HTML_Drag_and_Drop_API/File_drag_and_drop
function dropHandler(ev) {
	// Prevent default behavior (Prevent file from being opened)
	ev.preventDefault();

	if (ev.dataTransfer.items) {
		// Use DataTransferItemList interface to access the file(s)
		for (var i = 0; i < ev.dataTransfer.items.length; i++) {
			// If dropped items aren't files, reject them
			if (ev.dataTransfer.items[i].kind === 'file') {
				var file = ev.dataTransfer.items[i].getAsFile();
				console.log('... file[' + i + '].name = ' + file.name);
				processFile(ev.dataTransfer.items[i].getAsFile());
			}
		}
	} else {
		// Use DataTransfer interface to access the file(s)
		for (var i = 0; i < ev.dataTransfer.files.length; i++) {
			console.log('... file[' + i + '].name = ' + ev.dataTransfer.files[i].name);
			processFile(ev.dataTransfer.files[i].getAsFile());
		}
	}
	// Pass event to removeDragData for cleanup
	removeDragData(ev)
}

function dragOverHandler(ev) {
	// console.log('File(s) in drop zone'); 
	// Prevent default behavior (Prevent file from being opened)
	ev.preventDefault();
}

function removeDragData(ev) {
	// console.log('Removing drag data')
	if (ev.dataTransfer.items) {
		// Use DataTransferItemList interface to remove the drag data
		ev.dataTransfer.items.clear();
	} else {
		// Use DataTransfer interface to remove the drag data
		ev.dataTransfer.clearData();
	}
}