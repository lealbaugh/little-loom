var threadWidth = 15;
var threadSpacing = 2;

var warpColor = '#f06';
var weftColor = '#6f0';
var tieupColor = "#06f";

var drawdownArray = [null];
// init to null so we can 1-index the drawdown

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
function trompAsWrit () {
	if (draft.WARP.Threads == draft.WEFT.Threads) {
		draft.TREADLING = draft.THREADING;	
		renderNewDraft();
	}
}

// drawdownArray is a list of lists, each one containing an SVG group with a warp and a weft in it
// the group can receive a warpUp or warpDown event, which shuffles the svg order of the rects

function renderNewDraft() {
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
			lineArray.push(interlacement);
			// drawdownArray[i][j] = interlacement;
			interlacement.on('warpUp', function () {
				console.log(i,j);
				this.warp.front();
			});
			interlacement.on('warpDown', function () {
				this.warp.back();
			});
		}
		drawdownArray.push(lineArray);
	}
	// console.log(drawdownArray);

	updateDraft();
}

function csvAdd (csv, thingToAdd) {
	var list = csv.split(",");
	list.push(thingToAdd);
	return list.join(",");
}

function csvRemove (csv, thingToRemove) {
	var list = csv.split(",");

	var newList = [];
	for (var i=0; i<list.length; i++) {
		if (list[i] != thingToRemove && parseInt(list[i]) != thingToRemove) {
			newList.push(list[i]);
		}
	}
	return newList.join(",");
}

function updateDraft () {
	for (var i=1; i<=parseInt(draft.WARP.Threads); i++) {
		renderWarpDrawdown(i);
	}
}
function renderWarpDrawdown (i) {
	for (var j = 1; j<=parseInt(draft.WEFT.Threads); j++) {
		if (Math.random() < 0.5) {
			drawdownArray[i][j].fire("warpUp");
		}
	}
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