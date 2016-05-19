var container, camera, scene, renderer;

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

  var material = new THREE.MeshLambertMaterial( { map: map, side: THREE.DoubleSide } );

  for ( var i = 0; i < 20; i++) {
    var x = ((i%4) * 200) - 400;
    var z = ((Math.floor(i/4)) * 200) - 500;


    object = new THREE.Mesh( new THREE.PlaneGeometry( 100, 100, 4, 4 ), material );
    object.position.set( x, 0, z );
    object.rotation.set( toRadians(90), 0, 0 );
    scene.add( object );
  }


  renderer = new THREE.WebGLRenderer( { antialias: true } );
  renderer.setPixelRatio( window.devicePixelRatio );
  renderer.setSize( window.innerWidth, window.innerHeight );

  container.appendChild( renderer.domElement );

  window.addEventListener( 'resize', onWindowResize, false );
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize( window.innerWidth, window.innerHeight );
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

  renderer.render( scene, camera );
}
