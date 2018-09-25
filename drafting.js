var threadWidth = 10;
var threadSpacing = 2;

var maxWefts = 64;
var maxWarps = 64;

// var warpColor = '#f06';
// var weftColor = '#6f0';
var warpColor = '#000';
var weftColor = '#01eaea';
var tieupColor = "#06f";

var drawdownArray = [null];
// init to null so we can 1-index the drawdown

// we are using http://svgjs.com/
SVG.on(document, 'DOMContentLoaded', function() {
	threading = SVG('threading');
	tieup = SVG('tieup');
	drawdown = SVG('drawdown');
	treadling = SVG('treadling');
	frames = SVG('frames');

	renderNewDraft();
});

function testSave () {
	saveWif(draft, "saved.wif");
}
function trompAsWrit () {
	if (draft.WARP.Threads == draft.WEFT.Threads) {
		draft.TREADLING = draft.THREADING;	
		renderNewDraft();
	}
}

// ------- Draft display and manipulation ----------

// drawdownArray is a list of lists, each one containing an SVG group with a warp and a weft in it
// the group can receive a warpUp or warpDown event, which shuffles the svg order of the rects

function renderNewDraft() {
	threading.clear();
	tieup.clear();
	drawdown.clear();
	treadling.clear();
	drawdownArray = [null];

	// threading width is number of warps * thread width
	// threading height is number of frames * thread width
	threading.size(draft.WARP.Threads * threadWidth, draft.WEAVING.Shafts * threadWidth);
	for (var i=0; i<draft.WARP.Threads; i++) {
		var thisWarp = threading.group();
		for (var j=0; j<draft.WEAVING.Shafts; j++) {
			var heddle = threading.rect(threadWidth, threadWidth).move(i*threadWidth, j*threadWidth);
			heddle.addTo(thisWarp);
			heddle.warpNumber = i+1;
			heddle.pos = j+1;
			if (heddle.pos == parseInt(draft.THREADING[heddle.warpNumber])) heddle.fill(warpColor);
			else heddle.fill("#fff");
			heddle.click(function () {
				var sibs = this.siblings();
				this.fill(warpColor);
				for (var h=0; h<sibs.length; h++) {
					if (sibs[h]!=this) {
						sibs[h].fill("#fff");
					}
				}
				// then update the draft
				draft.THREADING[this.warpNumber] = this.pos;
				updateDraft();

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

	treadling.size(draft.WEAVING.Treadles * threadWidth, draft.WEFT.Threads * threadWidth);
	for (var j=0; j<draft.WEFT.Threads; j++) {
		var thisPick = treadling.group();
		for (var i=0; i<draft.WEAVING.Treadles; i++) {
			var treadle = treadling.rect(threadWidth, threadWidth).move(i*threadWidth, j*threadWidth);
			treadle.addTo(thisPick);
			treadle.pickNumber = j+1;
			treadle.treadleNumber = i+1;
			treadle.fill("#fff");
			treadle.active = false;

			// coerce the treadling to a string in case we copied it from the threading
			var thisPickDraft = (draft.TREADLING[treadle.pickNumber]+"").split(",");
			for (var t=0; t<thisPickDraft.length; t++) {
				if (parseInt(thisPickDraft[t]) == treadle.treadleNumber) {
					treadle.active = true;
					treadle.fill({color: weftColor});
				}
			}
			treadle.click(function () {
				if (this.active) {
					this.active = false;
					this.fill("#fff");
					draft.TREADLING[this.pickNumber] = csvRemove(draft.TREADLING[this.pickNumber], this.treadleNumber);
				}
				else {
					this.active = true;
					this.fill(weftColor);
					draft.TREADLING[this.pickNumber] = csvAdd(draft.TREADLING[this.pickNumber], this.treadleNumber);
				}
				// console.log(draft.TREADLING);
				updateDraft();

			});
			treadle.mouseover(function () {
				this.stroke({color:'#000', width:1});
			});
			treadle.mouseout(function () {
				this.attr('stroke', null);
			})
		}
	}


	tieup.size(draft.WEAVING.Treadles * threadWidth, draft.WEAVING.Shafts * threadWidth);
	// this is an exact duplicate of the treadle logic, and very similar to the threading logic -- 
	// it would make a lot of sense to generalize...
	tieup.size(draft.WEAVING.Treadles * threadWidth, draft.WEAVING.Shafts * threadWidth);
	for (var j=0; j<draft.WEAVING.Shafts; j++) {
		var thisPick = tieup.group();
		for (var i=0; i<draft.WEAVING.Treadles; i++) {
			var tie = tieup.rect(threadWidth, threadWidth).move(i*threadWidth, j*threadWidth);
			tie.addTo(thisPick);
			tie.frameNumber = j+1;
			tie.treadleNumber = i+1;
			tie.fill("#fff");
			tie.active = false;

			var thisTiedTreadle = draft.TIEUP[tie.treadleNumber].split(",");
			for (var t=0; t<thisTiedTreadle.length; t++) {
				if (parseInt(thisTiedTreadle[t]) == tie.frameNumber) {
					tie.active = true;
					tie.fill({color: tieupColor});
				}
			}
			tie.click(function () {
				if (this.active) {
					this.active = false;
					this.fill("#fff");
					draft.TIEUP[this.treadleNumber] = csvRemove(draft.TIEUP[this.treadleNumber], this.frameNumber);
				}
				else {
					this.active = true;
					this.fill(tieupColor);
					draft.TIEUP[this.treadleNumber] = csvAdd(draft.TIEUP[this.treadleNumber], this.frameNumber);
				}
				updateDraft();

				// console.log(draft.TIEUP);
			});
			tie.mouseover(function () {
				this.stroke({color:'#000', width:1});
			});
			tie.mouseout(function () {
				this.attr('stroke', null);
			})
		}
	}


	drawdown.size(draft.WARP.Threads * threadWidth, draft.WEFT.Threads * threadWidth);
	// drawdown.rect(draft.WARP.Threads * threadWidth, draft.WEFT.Threads * threadWidth).fill('#60f');
	for (var i=0; i<draft.WEFT.Threads; i++) {
		var lineArray = [null];
		for (var j=0; j<draft.WARP.Threads; j++) {
			var interlacement = drawdown.group();
			var warp = drawdown.rect(threadWidth - threadSpacing, threadWidth).move((i*threadWidth)+threadSpacing/2, j*threadWidth).fill(warpColor);
			var weft = drawdown.rect(threadWidth, threadWidth - threadSpacing).move(i*threadWidth, (j*threadWidth)+threadSpacing/2).fill(weftColor);
			warp.addTo(interlacement);
			weft.addTo(interlacement);
			interlacement.warp = warp;
			interlacement.warpUp = false;
			lineArray.push(interlacement);
			// drawdownArray[i][j] = interlacement;
			interlacement.on('warpUp', function () {
				if (!this.warpUp) {
					this.warp.front();
					this.warpUp = true;
				}
			});
			interlacement.on('warpDown', function () {
				if (this.warpUp) {
					this.warp.back();
					this.warpUp = false;
				}
			});
		}
		drawdownArray.push(lineArray);
	}
	// console.log(drawdownArray);

	updateDraft();
}

function csvAdd (csv, thingToAdd) {
	var list = (csv+"").split(",");
	list.push(thingToAdd);
	return list.join(",");
}

function csvRemove (csv, thingToRemove) {
	var list = (csv+"").split(",");

	var newList = [];
	for (var i=0; i<list.length; i++) {
		if (list[i] != thingToRemove && parseInt(list[i]) != thingToRemove) {
			newList.push(list[i]);
		}
	}
	return newList.join(",");
}

function tieupToMatrix () {
	var mat = [];
	var padding = [];
	for (var shaft=1; shaft<=draft.WEAVING.Shafts; shaft++) {
		padding.push(null);
	}
	mat.push(padding);
	for (i in draft.TIEUP) {
		var treadle = [null];
		var thisTiedTreadle = draft.TIEUP[i].split(",");
		for (var shaft=1; shaft<=draft.WEAVING.Shafts; shaft++) {
			if (thisTiedTreadle.includes(shaft) || thisTiedTreadle.includes(shaft+"")) treadle.push(1);
			else treadle.push(0);
		}	
		mat.push(treadle);
	}
	// console.log(JSON.stringify(mat, null, 2));
	// console.log(mat);
	return mat;
}

function updateDraft () {
	var tieupMatrix = tieupToMatrix();
	for (var i=1; i<=parseInt(draft.WARP.Threads); i++) {
		renderWarpDrawdown(i, tieupMatrix);
	}
}
function renderWarpDrawdown (i, tieupMatrix) {
	// var activeTreadles = 
	for (var j = 1; j<=parseInt(draft.WEFT.Threads); j++) {
		var warpUp = false;
		var heddle = draft.THREADING[i];
		var pick = (draft.TREADLING[j]+"").split(',');
		for (var t = 0; t<pick.length; t++) {
			// "When the string is empty, split() returns an array containing one empty string, 
			// rather than an empty array. If the string and separator are both empty strings, 
			// an empty array is returned." 
			// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/split
			if (pick[t] != "") {
				if (tieupMatrix[parseInt(pick[t])][parseInt(heddle)] == 1) {
					warpUp = true;
				}
			}
		}
		if (warpUp) {
			drawdownArray[i][j].fire("warpUp");
		}
		else {
			drawdownArray[i][j].fire("warpDown");
		}
	}
}

// ----- Cut-pattern rendering -------------

function renderAllFrames () {
	var frameWidth = (parseInt(draft.WARP.Threads) + 2)*heddleWidth;
	frames.clear();
	frames.size(frameWidth, frameHeight*draft.WEAVING.Shafts);
	for (var h = 1; h<=draft.WEAVING.Shafts; h++) {
		renderHeddleFrame(h, frames, frameWidth);
	}
}

function downloadFrames () {
	renderAllFrames();
	saveSvg(frames.svg(), "cut-pattern.svg");
}

function renderHeddleFrame (whichFrame, frames, frameWidth) {
	var tieupMatrix = tieupToMatrix();

	frame = frames.group();
	frame.size = (frameWidth, frameHeight);
	// frame.rect((parseInt(draft.WARP.Threads) + 2)*heddleWidth, frameHeight).fill("#ff0");
	var boundsL = frame.symbol().attr("fill", "none").stroke("#000").svg(frameBoundsLSVG);
	var boundsR = frame.symbol().attr("fill", "none").stroke("#000").svg(frameBoundsRSVG);
	frame.use(boundsL);
	frame.use(boundsR).move(frameWidth - (2*heddleWidth), 0);

	// var boundsL = frame.symbol().attr("fill", "none").stroke("#000").svg(frameBoundsLSVG);
	// var boundsR = frame.symbol().attr("fill", "none").stroke("#000").svg(frameBoundsRSVG);
	// frame.svg(frameBoundsLSVG);
	// frame.svg(frameBoundsRSVG).move(frameWidth - (2*heddleWidth), 0);


	var heddleHole = frame.symbol().attr("fill", "none").stroke("#f06");
	heddleHole.svg(heddleSVG);
	// var heddleSlot = frame.symbol().attr("fill", "none").stroke("#06f");
	var heddleSlot = frame.symbol().attr("stroke", "none").fill("#999");
	heddleSlot.svg(heddleSlotSVG);

	var tieupHole = frame.symbol().attr("fill", "none").stroke("#f06");
	tieupHole.svg(tieupHoleSVG);
	var tieupSlot = frame.symbol().attr("fill", "none").stroke("#06f");
	tieupSlot.svg(tieupSlotSVG);
	var tieupGroup = frame.group();

	var totalTieupWidth = (draft.WEAVING.Treadles*tieupWidth);
	for (var i=1; i<=draft.WARP.Threads; i++) {
		if (parseInt(draft.THREADING[i]) == parseInt(whichFrame)) {
			frame.use(heddleHole).move((i)*heddleWidth, 72);
		}
		else {
			frame.use(heddleSlot).move((i)*heddleWidth, 72);
		}
	}
	for (var i=1; i<=draft.WEAVING.Treadles; i++) {
		if (tieupMatrix[i][whichFrame] == 1) {
			frame.use(tieupHole).move((i-1)*tieupWidth, 0).addTo(tieupGroup);
		}
		else {
			frame.use(tieupSlot).move((i-1)*tieupWidth, 0).addTo(tieupGroup);
		}
	}
	tieupGroup.move((frameWidth - totalTieupWidth)/2, 0);
	frame.line((2*heddleWidth), frameHeight, frameWidth-(2*heddleWidth), frameHeight).stroke("#06f");
	frame.line((2*heddleWidth), 0, frameWidth-(2*heddleWidth), 0).stroke("#06f");

	frame.move(0, (whichFrame-1)*frameHeight);
}


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
		// console.log(data);
		if (parseInt(draft.WARP.Threads) > maxWarps) {
			draft.WARP.Threads = maxWarps;
		}
		if (parseInt(draft.WEFT.Threads) > maxWefts) {
			draft.WEFT.Threads = maxWefts;
		}

		threading.clear();
		tieup.clear();
		drawdown.clear();
		treadling.clear();
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