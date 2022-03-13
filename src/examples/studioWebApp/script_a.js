// Import libraries
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.126.0/build/three.module.js";
import { OrbitControls } from "https://cdn.jsdelivr.net/npm/three@0.126.0/examples/jsm/controls/OrbitControls.js";
import rhino3dm from "https://cdn.jsdelivr.net/npm/rhino3dm@7.11.1/rhino3dm.module.js";
import { RhinoCompute } from "https://cdn.jsdelivr.net/npm/compute-rhino3d@0.13.0-beta/compute.rhino3d.module.js";
import { Rhino3dmLoader } from "https://cdn.jsdelivr.net/npm/three@0.124.0/examples/jsm/loaders/3DMLoader.js";

import {GUI} from 'https://cdn.jsdelivr.net/npm/three@0.124.0/examples/jsm/libs/dat.gui.module.js'


var TxtRotate = function(el, toRotate, period) {
  this.toRotate = toRotate;
  this.el = el;
  this.loopNum = 0;
  this.period = parseInt(period, 10) || 2000;
  this.txt = '';
  this.tick();
  this.isDeleting = false;
};

TxtRotate.prototype.tick = function() {
  var i = this.loopNum % this.toRotate.length;
  var fullTxt = this.toRotate[i];

  if (this.isDeleting) {
    this.txt = fullTxt.substring(0, this.txt.length - 1);
  } else {
    this.txt = fullTxt.substring(0, this.txt.length + 1);
  }

  this.el.innerHTML = '<span class="wrap">'+this.txt+'</span>';

  var that = this;
  var delta = 100 - Math.random() * 100;

  if (this.isDeleting) { delta /= 2; }

  if (!this.isDeleting && this.txt === fullTxt) {
    delta = this.period;
    this.isDeleting = true;
  } else if (this.isDeleting && this.txt === '') {
    this.isDeleting = false;
    this.loopNum++;
    delta = 500;
  }


  

  setTimeout(function() {
    that.tick();
  }, delta);
};

window.onload = function() {
  var elements = document.getElementsByClassName('txt-rotate');
  for (var i=0; i<elements.length; i++) {
    var toRotate = elements[i].getAttribute('data-rotate');
    var period = elements[i].getAttribute('data-period');
    if (toRotate) {
      new TxtRotate(elements[i], JSON.parse(toRotate), period);
    }
  }
  // INJECT CSS
  var css = document.createElement("style");
  css.type = "text/css";
  css.innerHTML = ".txt-rotate > .wrap { border-right: 0.08em solid #666 }";
  document.body.appendChild(css);
};




const definitionName = "module_02.gh";

// Set up sliders
const radius_slider = document.getElementById("floor");
radius_slider.addEventListener("mouseup", onSliderChange, false);
radius_slider.addEventListener("touchend", onSliderChange, false);

const count_slider = document.getElementById("roof");
count_slider.addEventListener("mouseup", onSliderChange, false);
count_slider.addEventListener("touchend", onSliderChange, false);

const loader = new Rhino3dmLoader();
loader.setLibraryPath("https://cdn.jsdelivr.net/npm/rhino3dm@0.15.0-beta/");

let rhino, definition, doc;
rhino3dm().then(async (m) => {
  console.log("Loaded rhino3dm.");
  rhino = m; // global

  //RhinoCompute.url = getAuth( 'RHINO_COMPUTE_URL' ) // RhinoCompute server url. Use http://localhost:8081 if debugging locally.
  //RhinoCompute.apiKey = getAuth( 'RHINO_COMPUTE_KEY' )  // RhinoCompute server api key. Leave blank if debugging locally.

  RhinoCompute.url = "http://localhost:8081/"; //if debugging locally.

  // load a grasshopper file!

  const url = definitionName;
  const res = await fetch(url);
  const buffer = await res.arrayBuffer();
  const arr = new Uint8Array(buffer);
  definition = arr;




  init();
  compute();
});

async function compute() {
  const param1 = new RhinoCompute.Grasshopper.DataTree("Floor");
  param1.append([0], [radius_slider.valueAsNumber]);

  const param2 = new RhinoCompute.Grasshopper.DataTree("Roof");
  param2.append([0], [count_slider.valueAsNumber]);

  // clear values
  const trees = [];
  trees.push(param1);
  trees.push(param2);

  const res = await RhinoCompute.Grasshopper.evaluateDefinition(
    definition,
    trees
  );


  //console.log(res);

  doc = new rhino.File3dm();

  // hide spinner
  document.getElementById("loader").style.display = "none";

  //decode grasshopper objects and put them into a rhino document
  for (let i = 0; i < res.values.length; i++) {
    for (const [key, value] of Object.entries(res.values[i].InnerTree)) {
      for (const d of value) {
        const data = JSON.parse(d.data);
        const rhinoObject = rhino.CommonObject.decode(data);
        doc.objects().add(rhinoObject, null);
      }
    }
  }



  // go through the objects in the Rhino document

  let objects = doc.objects();
  for ( let i = 0; i < objects.count; i++ ) {
  
    const rhinoObject = objects.get( i );


     // asign geometry userstrings to object attributes
    if ( rhinoObject.geometry().userStringCount > 0 ) {
      const g_userStrings = rhinoObject.geometry().getUserStrings()
      //console.log(g_userStrings)
      rhinoObject.attributes().setUserString(g_userStrings[0][0], g_userStrings[0][1])
      
    }
  }


  // clear objects from scene
  scene.traverse((child) => {
    if (!child.isLight) {
      scene.remove(child);
    }

  
  });

  const buffer = new Uint8Array(doc.toByteArray()).buffer;
  loader.parse(buffer, function (object) {

    // go through all objects, check for userstrings and assing colors

    object.traverse((child) => {
      if (child.isMesh) {
        const mat = new THREE.MeshStandardMaterial( {color: '0x999999',roughness: 0.10 ,transparent: true, opacity: 0.97 } )
        child.material = mat;

        //0x999999
        //if (child.userData.attributes.geometry.userStringCount > 0) {
          
          //get color from userStrings
          //const colorData = child.userData.attributes.userStrings[0]
          //const col = colorData[1];

          //convert color from userstring to THREE color and assign it
          //const threeColor = new THREE.Color("rgb(" + col + ")");
          //const mat = new THREE.LineBasicMaterial({ color: threeColor });
          //child.material = mat;
        //}
      }
    });

    ///////////////////////////////////////////////////////////////////////
    // add object graph from rhino model to three.js scene
    scene.add(object);

  });
}

function onSliderChange() {
  // show spinner
  document.getElementById("loader").style.display = "block";
  compute();
}


// THREE BOILERPLATE //
let scene, camera, raycaster, renderer, controls, container;

const mouse = new THREE.Vector2()


function init() {
  // create a scene and a camera

  THREE.Object3D.DefaultUp = new THREE.Vector3(0, 0, 1)


  scene = new THREE.Scene();
  scene.background = new THREE.Color(1, 1, 1);

  const color = 0xFFFFFF;  // white
  const near = 7;
  const far = 55;
  scene.fog = new THREE.Fog(color, near, far);



  camera = new THREE.PerspectiveCamera(
    50,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );


  camera.position.set(-1, -0, 20);
  camera.lookAt( scene.position)
  
  //camera.position.z = -30;

  container = document.getElementById('main_Container')
  var contWidth = container.offsetWidth;
  var contHeight = container.offsetHeight

  // create the renderer and add it to the html
  renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  container.appendChild(renderer.domElement);

  // add some controls to orbit the camera
  controls = new OrbitControls(camera, renderer.domElement);

  // add a directional light
  const directionalLight = new THREE.DirectionalLight(0xffffff);
  directionalLight.position.set( 20, 0, 100 )
  directionalLight.castShadow = true
  directionalLight.intensity = 0.95;
  scene.add(directionalLight);

  //const ambientLight = new THREE.AmbientLight();
  //scene.add(ambientLight);

  const hemisphereLight = new THREE.HemisphereLight(0x000000, 0xFFFFFF, 0.55)
  scene.add(hemisphereLight)

  raycaster = new THREE.Raycaster()


  animate();
}

let container_att; 

function onClick( event ) {

  console.log( `click! (${event.clientX}, ${event.clientY})`)


// calculate mouse position in normalized device coordinates
  // (-1 to +1) for both components

  mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1
  mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1
  
  raycaster.setFromCamera( mouse, camera )

// calculate objects intersecting the picking ray
  const intersects = raycaster.intersectObjects( scene.children, true )

  let container_clck = document.getElementById( 'container_clck' )
  if (container_clck) container_clck.remove()

  // reset object colours
  scene.traverse((child, i) => {
      if (child.userData.hasOwnProperty( 'material' )) {
          child.material = child.userData.material
          child.material = selectedMaterial_b
      }
  })

  if (intersects.length > 0) {

      // get closest object
      const object = intersects[0].object
      console.log(object) // debug

      object.traverse( (child) => {
          if (child.parent.userData.objectType === 'Brep') {
              child.parent.traverse( (c) => {
                  if (c.userData.hasOwnProperty( 'material' )) {
                      c.material = selectedMaterial
                  }
              })
          } else {
              if (child.userData.hasOwnProperty( 'material' )) {
                  child.material = selectedMaterial
              }
          
          
          }
      })

      // get user strings
      let data, count
      if (object.userData.attributes !== undefined) {
          data = object.userData.attributes.userStrings
      } else {
          // breps store user strings differently...
          data = object.parent.userData.attributes.userStrings
      }

      // do nothing if no user strings
      if ( data === undefined ) return

      console.log( data[0] )
      
      // create container div with table inside
      container_clck = document.createElement( 'div' )
      container_clck.id = 'container_clck'

      
      const table = document.createElement( 'table' )
      container_clck.appendChild( table )



      for ( let i = 0; i < data.length; i ++ ) {

          const row = document.createElement( 'tr' )
          row.style.backgroundColor = 'white'
          row.innerHTML = `<td>${data[ i ][ 0 ]}</td><td>${data[ i ][ 1 ]}</td>`
          table.appendChild( row )
      }

      container_att = document.getElementById('sidebar')
      container_att.appendChild( container_clck )


  }


}

window.addEventListener('click', onClick, false)

function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  animate();
}

function meshToThreejs(mesh, material) {
  const loader = new THREE.BufferGeometryLoader();
  const geometry = loader.parse(mesh.toThreejsJSON());
  return new THREE.Mesh(geometry, material);
}

