/*

What are the states of the cards?
* back up clickable
* back up not-clickable
* face up matched
* face up not-matched
* rotating clockwise
* rotating counter-clockwise

-- static --
uuid
url
description
*/

var timer = 0;

var Game = function() {
  this.cards = {};
  this.correctStack = [];
}

Game.prototype.setCard = function( uuid, url, description ) {
  this.cards[ uuid ] = {
    uuid: uuid,
    url: url,
    description: description,
    faceUp: false,
    canRotate: false,
    matched: false,
    rotation: {
      rotating: false,
      direction: null,
      target: null,
      cb: null
    }
  }
}

Game.prototype.getCard = function( uuid ) {
  return this.cards[ uuid ];
}

Game.prototype.canRotateAll = function() {
  Object.keys( this.cards ).forEach( function( key ) {
    var card = this.cards[ key ];
    if (!card.matched) {
      card.canRotate = true;
    }
  }.bind(this));
}

Game.prototype.cannotRotateAny = function() {
  Object.keys( this.cards ).forEach( function( key ) {
    this.cards[ key ].canRotate = false;
  }.bind(this));
}

Game.prototype.setCanRotate = function( uuid, value ) {
  this.cards[ uuid ].canRotate = value;
}

Game.prototype.setRotation = function( uuid, rotating, direction, target, cb ) {
  this.cards[ uuid ].rotation = {
    rotating: rotating,
    direction: direction,
    target: target,
    cb: cb
  }
}

Game.prototype.getRotation = function( uuid ) {
  return this.cards[ uuid ].rotation;
}

Game.prototype.firstLook = function() {
  var target;
  Object.keys( this.cards ).forEach( function( key ) {
    target = getCardById( key ).rotation.clone().x + toRadians(180);

    this.setRotation( key, true, 'counter', target, function() {

      target = getCardById( key ).rotation.clone().x - toRadians(180);
      setTimeout( function() {
        var date = new Date();
        this.setRotation( key, true, 'clockwise', target, function() {
          this.setCanRotate( key, true );
        }.bind(this));
      }.bind(this), 5000);
    }.bind(this));
  }.bind(this));
}

Game.prototype.runRotation = function( cards ) {
  cards.forEach( function( card ) {

    var rotation = this.getRotation( card.uuid );
    if ( rotation.rotating ) {
      if ( rotation.direction === 'counter' ) {
        if ( card.rotation.x < rotation.target ) {
          card.rotation.x += toRadians( 5 );
        } else {
          card.rotation.x = rotation.target;
          this.setRotation( card.uuid, false, null, null, null );
          if ( rotation.cb ) rotation.cb();
        }
      } else {
        if ( card.rotation.x > rotation.target ) {
          card.rotation.x -= toRadians( 5 );
        } else {
          card.rotation.x = rotation.target;
          this.setRotation( card.uuid, false, null, null, null );
          if ( rotation.cb ) rotation.cb();
        }
      }
    }
  }.bind(this));
}

/* GLOBALS */

var container, camera, scene, renderer, raycaster, game, cards = [];
var mouse = new THREE.Vector2();
var target = new THREE.Vector3(-100, 0, 0);

window.onload = function() {
  init();
  animate();
}

function init() {

  var light, object1, object2, map1, map2, card;


  /*  GAME */
  game = new Game();


  /*  SCENE */
  scene = new THREE.Scene();


  /*  CAMERA */
  camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 2000 );
  camera.position.y = 600;
  camera.position.x = -500;


  /*  LIGHT */
  scene.add( new THREE.AmbientLight( 0x404040 ) );

  light = new THREE.DirectionalLight( 0xffffff );
  light.position.set( 0, 1, 0 );
  scene.add( light );


  /*  BACK OF CARD TEXTURE MAP */
  var map1 = new THREE.TextureLoader().load( '/static/images/MG_back_pearl_net.jpg' );
  map1.wrapS = map1.wrapT = THREE.reapeatWrapping;
  map1.anisotropy = 16;

  /*  Each card object consists of two children: front and back of the card.
      We iterate through the urls to create the texture map for each unique card.
      We also set card specific information on the game object */

  var map2;
  var images = shuffleImages();

  for ( var i = 0; i < 20; i++) {

    /*  FRONT OF CARD TEXTURE MAP */
    map2 = new THREE.TextureLoader().load( '/static/images/' + images[ i ].url );
    map2.wrapS = map2.wrapT = THREE.reapeatWrapping;
    map2.anisotropy = 16;

    /*  CARD OBJECT INSTANTIATION */
    card = new THREE.Object3D();
    scene.add( card );
    cards.push( card );

    /*  TELLS GAME ABOUT CARD */
    game.setCard( card.uuid, images[ i ].url, images[ i ].description );


    /*  SIDE OBJECT INSTANTIATION */
    var material1 = new THREE.MeshLambertMaterial( { map: map1, side: THREE.DoubleSide } );
    var material2 = new THREE.MeshLambertMaterial( { map: map2, side: THREE.DoubleSide } );

    object1 = new THREE.Mesh( new THREE.PlaneGeometry( 100, 160, 4, 4 ), material1 );

    object2 = new THREE.Mesh( new THREE.PlaneGeometry( 100, 160, 4, 4 ), material2 );
    object2.position.set( 0, 0, 1 ); // object2 is below object1

    card.add( object1 );
    card.add( object2 );

    /*  CARD POSITION AND ROTATION */
    var x = ((i%4) * 200) - 300;
    var z = ((Math.floor(i/4)) * 160) - 340;

    card.position.set( x, 0, z );
    card.rotation.set( toRadians(90), 0, toRadians(270) );
  }

  /*  RENDERER */
  renderer = new THREE.WebGLRenderer( { antialias: true } );
  renderer.setPixelRatio( window.devicePixelRatio );
  renderer.setSize( window.innerWidth, window.innerHeight );

  /*  RAYCASTER */
  raycaster = new THREE.Raycaster();

  /*  DOM */
  container = document.createElement( 'div' );
  document.body.appendChild( container );
  container.appendChild( renderer.domElement );

  window.addEventListener( 'resize', onWindowResize, false );
  document.addEventListener( 'mousemove', onMouseMove, false );
  document.addEventListener( 'mousedown', onMouseDown, false );

  setTimeout(function() { game.firstLook() }, 1000)
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize( window.innerWidth, window.innerHeight );
}

function shuffleImages() {
  var images = [
    { url: "MG_a_nose_as_fine_as_an_unsheathed_sword.jpg", description: "pistachios" },
    { url: "MG_a_squall_aloft.jpg", description: "broadLeaves" },
    { url: "MG_and_I_a_late_shell-held_oyster.jpg", description: "oysters" },
    { url: "MG_carcasses_studded_with_stones.jpg", description: "jewels" },
    { url: "MG_cinematic_pyramids.jpg", description: "pyramids" },
    { url: "MG_crawling_through_the_ossuary.jpg", description: "shells" },
    { url: "MG_dystopian_lava_flow.jpg", description: "fruit" },
    { url: "MG_flesh_boulders.jpg", description: "jewels" },
    { url: "MG_interview_the_island.jpg", description: "bee" },
    { url: "MG_lazy_galaxies.jpg", description: "beetles" },
    { url: "MG_Sindibad_becalmed.jpg", description: "shells" },
    { url: "MG_mollusc_problems.jpg", description: "oysters" },
    { url: "MG_percussive_soft_tissue.jpg", description: "fruit" },
    { url: "MG_plucked_from_the_genius_farm.jpg", description: "pistachios" },
    { url: "MG_populist_riffs_on_paradise.jpg", description: "pyramids" },
    { url: "MG_self-sacrifice_in_the_underwater_palace.jpg", description: "snake" },
    { url: "MG_sullen_dawn_dispersal.jpg", description: "bee" },
    { url: "MG_the_island_subsides.jpg", description: "beetles" },
    { url: "MG_the_pearl_perturbs.jpg", description: "snake" },
    { url: "MG_woe.jpg", description: "broadLeaves" }
  ];

  for ( var i = images.length-1; i >= 0; i--) {
    var rand = Math.floor(Math.random() * i);
    if (rand === i) {
      break;
    } else {
      var swap = images[rand];
      images[rand] = images[i];
      images[i] = swap;
    }
  }

  return images;
}

function onMouseMove( event ) {
  event.preventDefault();

  mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
  mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
}

function onMouseDown( event ) {
  event.preventDefault();

  var parent, intersects, target;

  raycaster.setFromCamera( mouse, camera );
  intersects = raycaster.intersectObjects( cards, true );

  if ( intersects.length ) {
    parent = intersects[ 0 ].object.parent;

    if ( game.getCard( parent.uuid ).canRotate ) {
      target = parent.rotation.clone().x + toRadians(180);
      game.setRotation( parent.uuid, true, 'counter', target, null );
      game.setCanRotate( parent.uuid, false );
      game.correctStack.push( game.getCard( parent.uuid ) );

      if ( game.correctStack.length % 2 === 0 )
        checkForMatch();
    }
  }
}

function checkForMatch() {
  var lastTwo = game.correctStack.slice( game.correctStack.length - 2 );

  if ( lastTwo[0].description !== lastTwo[1].description ) {
    game.cannotRotateAny();

    setTimeout( function() {
      var uuid1 = game.correctStack.pop().uuid;
      var uuid2 = game.correctStack.pop().uuid;

      var target1 = getCardById( uuid1 ).rotation.clone().x -= toRadians(180);
      var target2 = getCardById( uuid2 ).rotation.clone().x -= toRadians(180);
      game.setRotation( uuid1, true, 'clockwise', target1, null );
      game.setRotation( uuid2, true, 'clockwise', target2, game.canRotateAll.bind(game) );
    }, 2000 );

  } else {
    lastTwo[ 0 ].matched = true;
    lastTwo[ 1 ].matched = true;
  }
}

// function onMouseDown( event ) {
//   event.preventDefault();
//
//   raycaster.setFromCamera( mouse, camera );
//   var intersects = raycaster.intersectObjects( cards, true );
//
//
//
//   if (intersects.length) {
//     var parent = intersects[ 0 ].object.parent;
//
//     if (game.getCard( parent.uuid ).canRotate) {
//
//       isRotating.push( {
//         object: intersects[ 0 ].object.parent,
//         target: intersects[ 0 ].object.parent.rotation.clone().x += toRadians(180)
//       } );
//
//       game.setRotate( parent.uuid, false );
//       game.correctStack.push( game.getCard( parent.uuid ) );
//
//
//       if ( game.correctStack.length && game.correctStack.length % 2 === 0 ) {
//         var lastTwo = game.correctStack.slice(game.correctStack.length -2);
//
//         if ( lastTwo[ 0 ].description !== lastTwo[ 1 ].description ) {
//           game.cannotRotateAny();
//           setTimeout(function() {
//             var uuid1 = game.correctStack.pop().uuid;
//             var uuid2 = game.correctStack.pop().uuid;
//             var card1 = game.getThreeCard( scene.children, uuid1 );
//             var card2 = game.getThreeCard( scene.children, uuid2 );
//             isRotating.push( {
//               object: card1,
//               target: card1.rotation.clone().x += toRadians(180)
//             } );
//             isRotating.push( {
//               object: card2,
//               target: card2.rotation.clone().x += toRadians(180)
//             } );
//
//             setTimeout(function() {
//               game.canRotateAll();
//             }, 1000);
//           }, 2000);
//         }
//       }
//     }
//   }
// }

function getCardById( uuid ) {
  for ( var i = 0; i < cards.length; i++ ) {
    if ( cards[ i ].uuid === uuid ) {
      return cards[ i ];
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

  game.runRotation( cards );

  renderer.render( scene, camera );
}
