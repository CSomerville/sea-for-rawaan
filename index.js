var container, camera, scene, renderer, raycaster, cards = [], isRotating = [];
var mouse = new THREE.Vector2();
var intersection = null;

window.onload = function() {
  init();
  animate();
}

function init() {

  container = document.createElement( 'div' );
  document.body.appendChild( container );

  camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 2000 );
  camera.position.y = 400;

  scene = new THREE.Scene();

  var light, object;

  scene.add( new THREE.AmbientLight( 0x404040 ) );

  light = new THREE.DirectionalLight( 0xffffff );
  light.position.set( 0, 1, 0 );
  scene.add( light );

  var map = new THREE.TextureLoader().load( '/static/images/businesscard_back_babasouk.jpg' );
  map.wrapS = map.wrapT = THREE.reapeatWrapping;
  map.anisotropy = 16;


  for ( var i = 0; i < 20; i++) {
    var material = new THREE.MeshLambertMaterial( { map: map, side: THREE.DoubleSide } );
    var x = ((i%4) * 200) - 400;
    var z = ((Math.floor(i/4)) * 200) - 500;


    object = new THREE.Mesh( new THREE.PlaneGeometry( 100, 100, 4, 4 ), material );
    object.position.set( x, 0, z );
    object.rotation.set( toRadians(90), 0, 0 );
    cards.push( object );
    scene.add( object );
  }


  renderer = new THREE.WebGLRenderer( { antialias: true } );
  renderer.setPixelRatio( window.devicePixelRatio );
  renderer.setSize( window.innerWidth, window.innerHeight );

  raycaster = new THREE.Raycaster();

  container.appendChild( renderer.domElement );

  window.addEventListener( 'resize', onWindowResize, false );
  document.addEventListener( 'mousemove', onMouseMove, false );
  document.addEventListener( 'mousedown', onMouseDown, false );
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize( window.innerWidth, window.innerHeight );
}

function onMouseMove( event ) {
  event.preventDefault();

  mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
  mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
}

function onMouseDown( event ) {
  event.preventDefault();

  raycaster.setFromCamera( mouse, camera );
  var intersects = raycaster.intersectObjects( cards );


  if (intersects.length) {
    isRotating.push( {
      object: intersects[ 0 ].object,
      target: intersects[ 0 ].object.rotation.clone().x += toRadians(180)
    } );
    console.log(isRotating[0])
  }
}


function animate() {
  requestAnimationFrame( animate );
  render();
}

function toRadians(degrees) {
  return degrees * (Math.PI / 180)
}

function render() {
  var timer = Date.now() * 0.0001;

  camera.position.x = Math.cos( timer ) * 800;
  camera.position.z = Math.sin( timer ) * 800;
  camera.lookAt( scene.position );
  camera.updateMatrixWorld();

  for ( var i = isRotating.length - 1; i >= 0; i-- ) {
    if ( isRotating[ i ].object.rotation.x < isRotating[ i ].target ) {
      isRotating[ i ].object.rotation.x += toRadians(5);
    } else {
      isRotating[ i ].object.rotation.x = isRotating[ i ].target;
      isRotating.splice(i, 1);
    }
  }


  renderer.render( scene, camera );
}
