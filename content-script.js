function main () {

	if ( 'THREE' in window === false || 'VRControls' in THREE === false ) return;

	if ( 'ViveController' in THREE ) {

		var controller1Available = 'controller1' in window && controller1 instanceof THREE.ViveController;
		var controller2Available = 'controller2' in window && controller2 instanceof THREE.ViveController;

	}

	//

	function parseGamepad( gamepad ) {

		if ( gamepad === null ) return null;

		var buttons = gamepad.buttons;

		return {
			axes: gamepad.axes,
			buttons: [
				{ pressed: buttons[ 0 ].pressed, touched: buttons[ 0 ].touched, value: buttons[ 0 ].value },
				{ pressed: buttons[ 1 ].pressed, touched: buttons[ 1 ].touched, value: buttons[ 1 ].value },
				{ pressed: buttons[ 2 ].pressed, touched: buttons[ 2 ].touched, value: buttons[ 2 ].value },
				{ pressed: buttons[ 3 ].pressed, touched: buttons[ 3 ].touched, value: buttons[ 3 ].value }
			],
			pose: {
				position: Array.from( gamepad.pose.position ),
				orientation: Array.from( gamepad.pose.orientation )
			}
		};

	}

	function FakeGamepad() {

		return {
			axes: [ 0, 0 ],
			buttons: [
				{ pressed: false, touched: false, value: 0 },
				{ pressed: false, touched: false, value: 0 },
				{ pressed: false, touched: false, value: 0 },
				{ pressed: false, touched: false, value: 0 }
			],
			id: "OpenVR Gamepad",
			pose: { position: null, orientation: null }
		}

	}

	var gamepads = { 0: new FakeGamepad(), 1: new FakeGamepad(), 2: null, 3: null };

	var fakeGetGamepads = function () { return gamepads };
	var realGetGamepads = navigator.getGamepads;

	//

	var frames = [];
	var currentFrame = 0;

	var isPlaying = false;
	var isRecording = false;

	function play() {

		if ( isPlaying === false || frames.length === 0 ) return;

		var frame = frames[ currentFrame ];

		camera.matrix.fromArray( frame[ 0 ] );

		if ( controller1Available ) controller1.standingMatrix.fromArray( frame[ 1 ] );
		if ( controller2Available ) controller2.standingMatrix.fromArray( frame[ 1 ] );

		if ( frame[ 2 ] ) Object.assign( navigator.getGamepads()[ 0 ], frame[ 2 ] );
		if ( frame[ 3 ] ) Object.assign( navigator.getGamepads()[ 1 ], frame[ 3 ] );

		updateFramesText();

		currentFrame ++;

		if ( currentFrame >= frames.length ) currentFrame = 0;

		requestAnimationFrame( play );

	}

	function record() {

		if ( isRecording === false ) return;

		frames.push( [
			camera.matrix.toArray(),
			controls.getStandingMatrix().toArray(),
			parseGamepad( navigator.getGamepads()[ 0 ] ),
			parseGamepad( navigator.getGamepads()[ 1 ] )
		] );

		updateFramesText();

		requestAnimationFrame( record )

	}

	function updateFramesText() {

		framesText.textContent = currentFrame + '/' + frames.length;

	}

	//

	var panel = document.createElement( 'div' );
	panel.style.position = 'fixed';
	panel.style.top = '0px';
	panel.style.left = '0px';
	panel.style.padding = '8px';
	panel.style.color = 'black';
	panel.style.backgroundColor = 'white';
	panel.innerHTML = '<strong>VR PLAYER</strong> - ';
	document.body.appendChild( panel );

	var framesText = document.createTextNode( '0/0' );
	panel.appendChild( framesText )

	var hr = document.createElement( 'hr' );
	hr.style.cssText = "border: 0px;height: 1px;background-color: #ddd;";
	panel.appendChild( hr );

	// LOAD

	var fileInput = document.createElement( 'input' );
	fileInput.type = 'file';
	fileInput.addEventListener( 'change', function ( event ) {

		var reader = new FileReader();
		reader.addEventListener( 'load', function ( event ) {

			var contents = event.target.result;
			frames = JSON.parse( contents );

			updateFramesText();

		}, false );
		reader.readAsText( fileInput.files[ 0 ] );

	} );

	var loadButton = document.createElement( 'button' );
	loadButton.textContent = 'LOAD';
	loadButton.addEventListener( 'click', function () {

		fileInput.click();

	} );
	panel.appendChild( loadButton );

	// SAVE

	var link = document.createElement( 'a' );
	link.style.display = 'none';
	document.body.appendChild( link ); // Firefox workaround, see #6594

	var saveButton = document.createElement( 'button' );
	saveButton.textContent = 'SAVE';
	saveButton.addEventListener( 'click', function () {

		var text = JSON.stringify( frames );

		var blob = new Blob( [ text ], { type: 'text/plain' } );
		link.href = URL.createObjectURL( blob );
		link.download = 'vr-' + Date.now() + '.json';
		link.click();

	} );
	panel.appendChild( saveButton );

	// CLEAR

	var clearButton = document.createElement( 'button' );
	clearButton.textContent = 'CLEAR';
	clearButton.addEventListener( 'click', function () {

		frames = [];
		currentFrame = 0;
		updateFramesText();

	} );
	panel.appendChild( clearButton );

	//

	var hr = document.createElement( 'hr' );
	hr.style.cssText = "border: 0px;height: 1px;background-color: #ddd;";
	panel.appendChild( hr );

	// PLAY

	var controlsUpdate = controls.update;

	var playButton = document.createElement( 'button' );
	playButton.textContent = 'PLAY';
	playButton.addEventListener( 'click', function () {

		if ( isPlaying === false ) {

			camera.matrixAutoUpdate = false;

			navigator.getGamepads = fakeGetGamepads;
			controls.update = function () {};

			playButton.textContent = 'STOP';

			isPlaying = true;
			requestAnimationFrame( play );

		} else {

			camera.matrixAutoUpdate = true;

			navigator.getGamepads = realGetGamepads;
			controls.update = controlsUpdate;

			playButton.textContent = 'PLAY';

			isPlaying = false;

		}

	} );
	panel.appendChild( playButton );

	// RECORD

	var recordButton = document.createElement( 'button' );
	recordButton.textContent = 'RECORD';
	recordButton.addEventListener( 'click', function () {

		if ( isRecording === false ) {

			recordButton.textContent = 'STOP';

			isRecording = true;
			requestAnimationFrame( record );

		} else {

			recordButton.textContent = 'RECORD';

			isRecording = false;

		}

	} );
	panel.appendChild( recordButton );

}

var script = document.createElement('script');
script.appendChild(document.createTextNode('('+ main +')();'));
(document.body || document.head || document.documentElement).appendChild(script);
