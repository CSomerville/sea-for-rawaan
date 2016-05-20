var container, camera, scene, renderer, raycaster, game, cards = [], isRotating = [];
var mouse = new THREE.Vector2();
var target = new THREE.Vector3(-100, 0, 0);
var intersection = null;

window.onload = function() {
  init();
  animate();
}

var Game = function() {
  this.cards = {};
  this.correctStack = [];
}

Game.prototype.setCard = function(uuid, description) {
  this.cards[ uuid ] = {
    uuid: uuid,
    description: description,
    canRotate: false
  }
}

Game.prototype.getCard = function(uuid) {
  return this.cards[ uuid ];
}

Game.prototype.canRotateAll = function() {
  Object.keys( this.cards ).forEach( function(key) {

    var inCorrectStack = this.correctStack.filter( function( el ) {
      return key === el.uuid
    });

    if (!inCorrectStack.length) {
      this.cards[ key ].canRotate = true;
    }
  }.bind(this));
}

Game.prototype.cannotRotateAny = function() {
  Object.keys( this.cards ).forEach( function( key ) {
    this.cards[ key ].canRotate = false;
  }.bind(this));
}

Game.prototype.setRotate = function( uuid, value ) {
  this.cards[ uuid ].canRotate = value;
}

Game.prototype.getThreeCard = function( sceneChildren, uuid ) {
  for ( var i = 0; i < sceneChildren.length; i++ ) {
    if ( sceneChildren[ i ].uuid === uuid ) {
      return sceneChildren[ i ];
    }
  }
}

function init() {

  container = document.createElement( 'div' );
  document.body.appendChild( container );

  camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 2000 );
  camera.position.y = 700;
  camera.position.x = -600;

  game = new Game();

  scene = new THREE.Scene();

  var light, object1, object2, card;

  scene.add( new THREE.AmbientLight( 0x404040 ) );

  light = new THREE.DirectionalLight( 0xffffff );
  light.position.set( 0, 1, 0 );
  scene.add( light );

  var map1 = new THREE.TextureLoader().load( '/static/images/businesscard_back_babasouk.jpg' );
  map1.wrapS = map1.wrapT = THREE.reapeatWrapping;
  map1.anisotropy = 16;

  var map2;
  var urls = shuffleImages();

  for ( var i = 0; i < 20; i++) {

    map2 = new THREE.TextureLoader().load( '/static/images/' + urls[ i ] );
    map2.wrapS = map2.wrapT = THREE.reapeatWrapping;
    map2.anisotropy = 16;

    card = new THREE.Object3D();
    scene.add( card );
    cards.push( card );

    game.setCard( card.uuid, urls[ i ] );

    var material1 = new THREE.MeshLambertMaterial( { map: map1, side: THREE.DoubleSide } );
    var material2 = new THREE.MeshLambertMaterial( { map: map2, side: THREE.DoubleSide } );
    var x = ((i%4) * 200) - 300;
    var z = ((Math.floor(i/4)) * 160) - 340;


    object1 = new THREE.Mesh( new THREE.PlaneGeometry( 100, 160, 4, 4 ), material1 );

    object2 = new THREE.Mesh( new THREE.PlaneGeometry( 100, 160, 4, 4 ), material2 );
    object2.position.set( 0, 0, 1 );

    card.position.set( x, 0, z );
    card.rotation.set( toRadians(90), 0, toRadians(270) );
    card.add( object1 );
    card.add( object2 );
  }


  renderer = new THREE.WebGLRenderer( { antialias: true } );
  renderer.setPixelRatio( window.devicePixelRatio );
  renderer.setSize( window.innerWidth, window.innerHeight );

  raycaster = new THREE.Raycaster();

  container.appendChild( renderer.domElement );

  window.addEventListener( 'resize', onWindowResize, false );
  document.addEventListener( 'mousemove', onMouseMove, false );
  document.addEventListener( 'mousedown', onMouseDown, false );

  game.canRotateAll();
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize( window.innerWidth, window.innerHeight );
}

function shuffleImages() {
  var urls = [
    "businesscard_back_babasouk.jpg",
    "businesscard_birdie.jpg",
    "businesscard_blue_dino_luxe.jpg",
    "businesscard_camel.jpg",
    "businesscard_cheetah.jpg",
    "businesscard_deep_tiger.jpg",
    "businesscard_fox.jpg",
    "businesscard_pale_marmoset.jpg",
    "businesscard_peach_kangaroo.jpg",
    "businesscard_pink_giraffe.jpg"
  ];

  urls = urls.concat(urls);

  for ( var i = urls.length-1; i >= 0; i--) {
    var rand = Math.floor(Math.random() * i);
    if (rand === i) {
      break;
    } else {
      var swap = urls[rand];
      urls[rand] = urls[i];
      urls[i] = swap;
    }
  }

  return urls;
}

function onMouseMove( event ) {
  event.preventDefault();

  mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
  mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
}

function onMouseDown( event ) {
  event.preventDefault();

  raycaster.setFromCamera( mouse, camera );
  var intersects = raycaster.intersectObjects( cards, true );



  if (intersects.length) {
    var parent = intersects[ 0 ].object.parent;

    if (game.getCard( parent.uuid ).canRotate) {

      isRotating.push( {
        object: intersects[ 0 ].object.parent,
        target: intersects[ 0 ].object.parent.rotation.clone().x += toRadians(180)
      } );

      game.setRotate( parent.uuid, false );
      game.correctStack.push( game.getCard( parent.uuid ) );


      if ( game.correctStack.length && game.correctStack.length % 2 === 0 ) {
        var lastTwo = game.correctStack.slice(game.correctStack.length -2);

        if ( lastTwo[ 0 ].description !== lastTwo[ 1 ].description ) {
          game.cannotRotateAny();
          setTimeout(function() {
            var uuid1 = game.correctStack.pop().uuid;
            var uuid2 = game.correctStack.pop().uuid;
            var card1 = game.getThreeCard( scene.children, uuid1 );
            var card2 = game.getThreeCard( scene.children, uuid2 );
            isRotating.push( {
              object: card1,
              target: card1.rotation.clone().x += toRadians(180)
            } );
            isRotating.push( {
              object: card2,
              target: card2.rotation.clone().x += toRadians(180)
            } );

            setTimeout(function() {
              game.canRotateAll();
            }, 1000);
          }, 2000);
        }
      }
    }

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

  camera.lookAt( target );
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
