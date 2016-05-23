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

    setVisible( key, 'front', true );

    target = getCardById( key ).rotation.clone().x + toRadians(180);
    this.setRotation( key, true, 'counter', target, function() {
      setVisible( key, 'back', false );

      target = getCardById( key ).rotation.clone().x - toRadians(180);
      setTimeout( function() {
        setVisible( key, 'back', true );
        this.setRotation( key, true, 'clockwise', target, function() {
          setVisible( key, 'front', false );
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
        if ( card.rotation.x <= rotation.target ) {
          card.rotation.x += toRadians( 5 );
        } else {
          card.rotation.x = rotation.target;
          this.setRotation( card.uuid, false, null, null, null );
          if ( rotation.cb ) rotation.cb();
        }
      } else {
        if ( card.rotation.x >= rotation.target ) {
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

var container, camera, scene, renderer, raycaster, game, waterGeometry, waterMesh, cards = [];
var worldWidth = 128, worldDepth = 128;
var mouse = new THREE.Vector2();
var target = new THREE.Vector3(-100, 0, 0);
var clock = new THREE.Clock();
var victory = false, ctr = 0;

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
  scene.fog = new THREE.FogExp2( 0xb09780, 0.0007 );
  // 0xffda93
  // 0xaaccff

  /*  CAMERA */
  camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 2000 );
  camera.position.y = 650;
  camera.position.x = -600;


  /*  LIGHT */
  scene.add( new THREE.AmbientLight( 0x404040 ) );

  light = new THREE.DirectionalLight( 0xffffff );
  light.position.set( 0, 1, 0 );
  scene.add( light );


  /*  WATER GEOMETRY */

  waterGeometry = new THREE.PlaneGeometry( 4000, 4000, worldWidth - 1, worldDepth - 1 );
  waterGeometry.rotateX( toRadians(90) );

  for ( var i = 0, l = waterGeometry.vertices.length; i < l; i++ ) {
    waterGeometry.vertices[ i ].y = 35 * Math.sin( i / 2 );
  }

  var texture = new THREE.TextureLoader().load( '/static/images/water.jpg' );
  texture.wrapS = texture.wrapT = THREE.repeatWrapping;
  texture.repeat.set( 5, 5 );

  var material = new THREE.MeshBasicMaterial( { color: 0x2faa7b, map: texture } );
  // 0x2faa7b

  waterMesh = new THREE.Mesh( waterGeometry, material );
  waterMesh.rotation.set( toRadians(180), 0, 0 );
  waterMesh.position.set( 0, -40, 0 );
	scene.add( waterMesh );


  /*  BACK OF CARD TEXTURE MAP */
  var map1 = new THREE.TextureLoader().load( '/static/images/MG_back_pearl_net.jpg' );
  map1.wrapS = map1.wrapT = THREE.repeatWrapping;
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

    object1 = new THREE.Mesh( new THREE.PlaneGeometry( 100, 166, 4, 4 ), material1 );
    object1.name = "back";

    object2 = new THREE.Mesh( new THREE.PlaneGeometry( 100, 166, 4, 4 ), material2 );
    object2.name = "front";
    object2.position.set( 0, 0, 1 ); // object2 is below object1

    card.add( object1 );
    card.add( object2 );

    /*  CARD POSITION AND ROTATION */
    var x = ((i%4) * 200) - 300;
    var z = ((Math.floor(i/4)) * 160) - 340;

    card.position.set( x, 0, z );
    card.rotation.set( toRadians(90), 0, toRadians(270) );

    /*  CARD SIDE VISIBILITY */
    setVisible( card.uuid, 'front', false );
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

  setTimeout(function() { game.firstLook() }, 1000);
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

  if (victory && ctr === 260) {
    readNextCard();
  }
  var parent, intersects, target;

  raycaster.setFromCamera( mouse, camera );
  intersects = raycaster.intersectObjects( cards, true );

  if ( intersects.length ) {
    parent = intersects[ 0 ].object.parent;

    if ( game.getCard( parent.uuid ).canRotate ) {
      setVisible( parent.uuid, 'front', true );
      target = parent.rotation.clone().x + toRadians(180);
      game.setRotation( parent.uuid, true, 'counter', target, function() {
        setVisible( parent.uuid, 'back', false );
      } );
      game.setCanRotate( parent.uuid, false );
      game.correctStack.push( game.getCard( parent.uuid ) );

      if ( game.correctStack.length === 20 )
        setTimeout( function() { win() }, 1000);
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

      setVisible( uuid1, 'back', true );
      setVisible( uuid2, 'back', true );

      var target1 = getCardById( uuid1 ).rotation.clone().x -= toRadians(180);
      var target2 = getCardById( uuid2 ).rotation.clone().x -= toRadians(180);
      game.setRotation( uuid1, true, 'clockwise', target1, function() {
        setVisible( uuid1, 'front', false );
      } );
      game.setRotation( uuid2, true, 'clockwise', target2, function() {
        setVisible( uuid2, 'front', false );
        game.canRotateAll();
      } );
    }, 2000 );

  } else {
    lastTwo[ 0 ].matched = true;
    lastTwo[ 1 ].matched = true;
  }
}

function win() {
  victory = true;
  var uuid, card;
  for ( var i = 0, l = game.correctStack.length; i < l; i++ ) {
    uuid = game.correctStack[ i ].uuid;
    card = getCardById( uuid );
    game.correctStack[ i ].deltas = {
      positionX: -460 - card.position.x + i,
      positionY: 470 - card.position.y,
      positionZ: 0 - card.position.z,
      offset: i * 10
    }
  }
}

function readNextCard() {
  if (!game.correctStack.length) return;
  var cardMeta = game.correctStack.shift();
  game.cards[ cardMeta.uuid ].fallingCtr = 0;
}

function dropCards() {
  for ( var key in game.cards ) {
    if (game.cards[ key ].fallingCtr >= 0) {
      var card = getCardById( key );
      card.rotation.z -= toRadians(2);
      card.position.y -= 3;
      card.position.x -= 7;
      game.cards[ key ].fallingCtr++;
      if ( game.cards[ key ].fallingCtr > 60 ) game.cards[ key ].fallingCtr = null;
    }
  }
}

function stackCards() {
  var uuid, card, deltas;
  for (var i = 0, l = game.correctStack.length; i < l; i++) {
    uuid = game.correctStack[ i ].uuid;
    card = getCardById( uuid );
    deltas = game.correctStack[ i ].deltas;
    if (deltas.offset < ctr && (ctr - deltas.offset) <= 60) {

      card.position.x += ( deltas.positionX / 60 );
      card.position.y += ( deltas.positionY / 60 );
      card.position.z += ( deltas.positionZ / 60 );
      card.rotation.y -= ( toRadians(33) / 60 );
    }
  }
  ctr++;
}

function getCardById( uuid ) {
  for ( var i = 0; i < cards.length; i++ ) {
    if ( cards[ i ].uuid === uuid ) {
      return cards[ i ];
    }
  }
}

function setVisible( uuid, name, value ) {
  var card = getCardById( uuid );
  var side = card.getObjectByName( name );
  side.visible = value;
}


function animate() {
  requestAnimationFrame( animate );
  render();
}

function toRadians(degrees) {
  return degrees * (Math.PI / 180)
}

// function testEnding() {
//   /*  REMOVE FOR PRODUCTION */
//   var keys = Object.keys( game.cards );
//
//   for ( var i = 0, l = keys.length; i < l; i++) {
//     setVisible( keys[ i ], 'front', true );
//
//     var target = getCardById( keys[ i ] ).rotation.clone().x + toRadians(180);
//     game.setRotation( keys[ i ], true, 'counter', target, (i === l-1) ? win : null );
//   }
// }

function render() {

  camera.lookAt( target );
  camera.updateMatrixWorld();

  if (victory && ctr < 260) {
    stackCards();
  } else if (victory && ctr === 260) {
    dropCards();
  } else {
    game.runRotation( cards );
  }

  var time = clock.getElapsedTime() * 10;

  for ( var i = 0, l = waterGeometry.vertices.length; i < l; i++ ) {
    waterGeometry.vertices[ i ].y = 35 * Math.sin( i / 5 + ( time + i ) / 7 );
  }

  waterMesh.geometry.verticesNeedUpdate = true;

  renderer.render( scene, camera );
}
