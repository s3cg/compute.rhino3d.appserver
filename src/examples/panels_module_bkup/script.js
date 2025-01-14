import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.126.0/build/three.module.js'
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.126.0/examples/jsm/controls/OrbitControls.js'
import { Rhino3dmLoader } from 'https://cdn.jsdelivr.net/npm/three@0.126.0/examples/jsm/loaders/3DMLoader.js'
import rhino3dm from 'https://cdn.jsdelivr.net/npm/rhino3dm@0.15.0-beta/rhino3dm.module.js'
//import { GLTFLoader } from "https://cdn.jsdelivr.net/npm/three@0.126.0/examples/jsm/loaders/GLTFLoader.js";
// set up loader for converting the results to threejs
const loader = new Rhino3dmLoader()
loader.setLibraryPath( 'https://cdn.jsdelivr.net/npm/rhino3dm@0.15.0-beta/' )
// initialise 'data' object that will be used by compute()
const data = {
  definition: 'k_means_module_02.gh',
  inputs: getInputs()
}
// globals
let rhino, doc
rhino3dm().then(async m => {
    rhino = m
    init()
    compute()
})
const downloadButton = document.getElementById("downloadButton")
downloadButton.onclick = download
var b = 0;
downloadButton.onclick = function() {
  //console.log(++b)
  b += 1;
  document.getElementById("clicks_02").innerHTML = b
  
}
const styles = {
  border: 'none',
  color: 'rgb(255, 255, 255)',
  background: '#000000',
  padding: '15px 32px',
  borderRadius: '30px',
  textAlign: 'center',
  textDdecoration: 'none',
  display: 'inline-block',
  fontSize: '16px',
  margin: '4px 2px',
  cursor: 'pointer',
}
Object.assign(downloadButton.style, styles);
  /////////////////////////////////////////////////////////////////////////////
 //                            HELPER  FUNCTIONS                            //
/////////////////////////////////////////////////////////////////////////////
/**
 * Gets <input> elements from html and sets handlers
 * (html is generated from the grasshopper definition)
 */
function getInputs() {
  const inputs = {}
  for (const input of document.getElementsByTagName('input')) {
    switch (input.type) {
      case 'number':
        inputs[input.id] = input.valueAsNumber
        input.onchange = onSliderChange
        break
      case 'range':
        inputs[input.id] = input.valueAsNumber
        input.onmouseup = onSliderChange
        input.ontouchend = onSliderChange
        break
      case 'checkbox':
        inputs[input.id] = input.checked
        input.onclick = onSliderChange
        break
      default:
        break
    }
    
  }
  return inputs
}
// more globals
let scene, camera, renderer, controls, raycaster, kmeans_data, panels_length, cluster_length, arr_a, myArray
/**
 * Sets up the scene, camera, renderer, lights and controls and starts the animation
 */
function init() {
    // Rhino models are z-up, so set this as the default
    THREE.Object3D.DefaultUp = new THREE.Vector3( 0, 0, 1 );
    // create a scene and a camera
    scene = new THREE.Scene()
    scene.background = new THREE.Color(1, 1, 1)
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 1000)
    camera.position.set(1, -1, 1) // like perspective view
    // very light grey for background, like rhino
    scene.background = new THREE.Color(0, 0, 0);
    
    //0xFFFFFF
    //0xFF0000
    //0x000000
    const color = 0x000000; 
    const near = 7; 
    const far = 50;
    scene.fog = new THREE.Fog(color, near, far);
    // create the renderer and add it to the html
    renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setPixelRatio( window.devicePixelRatio )
    renderer.setSize(window.innerWidth, window.innerHeight)
    document.body.appendChild(renderer.domElement)
    // add some controls to orbit the camera
    controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    
    
    // add a directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff);
    directionalLight.position.set( 20, 0, 100 )
    directionalLight.castShadow = true
    directionalLight.intensity = 0.95;
    scene.add(directionalLight);
    const directionalLight_b = new THREE.DirectionalLight(0x990000);
    directionalLight_b.position.set( 40, 0, 100 )
    directionalLight_b.castShadow = true
    directionalLight_b.intensity = 0.99;
    scene.add(directionalLight_b);
    //const ambientLight = new THREE.AmbientLight();
    //scene.add(ambientLight);
    const hemisphereLight = new THREE.HemisphereLight(0x000000, 0xFFFFFF, 0.55)
    scene.add(hemisphereLight)
    
    raycaster = new THREE.Raycaster()
    // handle changes in the window size
    window.addEventListener( 'resize', onWindowResize, false )
    
    animate()
}
/**
 * Call appserver
 */
async function compute() {
  // construct url for GET /solve/definition.gh?name=value(&...)
  const url = new URL('/solve/' + data.definition, window.location.origin)
  Object.keys(data.inputs).forEach(key => url.searchParams.append(key, data.inputs[key]))
  console.log(url.toString())
  
  try {
    const response = await fetch(url)
  
    if(!response.ok) {
      // TODO: check for errors in response json
      throw new Error(response.statusText)
    }
    const responseJson = await response.json()
    collectResults(responseJson)
  } catch(error) {
    console.error(error)
  }
}
/**
 * Parse response
 */
function collectResults(responseJson) {
    const values = responseJson.values
    var arr_a = []
    // clear doc
    if( doc !== undefined)
        doc.delete()
    doc = new rhino.File3dm()
    
    // for each output (RH_OUT:*)...
    for ( let i = 0; i < values.length; i ++ ) {
      // ...iterate through data tree structure...
      for (const path in values[i].InnerTree) {
        const branch = values[i].InnerTree[path]
        //console.log(branch)
        // ...and for each branch...
        for( let j = 0; j < branch.length; j ++) {
          // ...load rhino geometry into doc
          const rhinoObject = decodeItem(branch[j])
          if (rhinoObject !== null) {
            doc.objects().add(rhinoObject, null)
          }
          if (values[i].ParamName == "RH_OUT:kmeans_data"){
            kmeans_data = branch[j].data
            }
          
          if (values[i].ParamName == "RH_OUT:panels_length"){
            panels_length = branch[j].data
            
          }
          if (values[i].ParamName == "RH_OUT:int_cluster_lengths"){
            cluster_length = branch[j].data
            arr_a.push(cluster_length);
            //console.log(typeof(cluster_length))
            //console.log(cluster_length)
            //a = new Array(cluster_length)
            //a = document.createElement('li')
            //console.log(a)
          }
          
        }
      
      }
    }
    //console.log(arr_a)
    //console.log(typeof(arr_a))
    const myArray = arr_a
    //console.log(arr_a)

    
    
    //Get Values
    document.getElementById('kmeans_data').innerText = "Kmeans_data = " + kmeans_data + " m2"
    document.getElementById('panels_length').innerText = "Panels_length = " + panels_length + " total_panels"
    
    let testArray = [[1, 34], [3.8, 43], [5, 31] , [10, 43], [13, 33], [15, 43], [18, 33] , [20, 52]]
    let dataToInject = "[[" + testArray.join("],[") + "]]"
    document.getElementById('chart').innerText = 
    `
    //this content is injected in js
    <script>
    const element = document.getElementsByClassName("data_test")
    
  var options = {
    chart: {
      height: 170,
      width: 600,
      type: "line"
      },
    colors: ["FFFFFF"],
    stroke: {
    width: 1},
  series: [
    {
      name: "Series 1",
      data: ${dataToInject}
    }
    ],
  xaxis: {
    type: 'numeric'
          },
  tooltip: {
      x: {
      formatter: function(val) {
      return val.toFixed(1);
    }
  }
}
};
var chart = new ApexCharts(document.querySelector("#chart"), options);
chart.render();
</script>
`


console.log(arr_a)

//console.log(document.getElementById('chart').innerText )
chart.updateSeries([{
  data: [[1,34],[3.8,43],[5,31],[10,43],[13,33],[15,43],[18,33],[20,52]]
}])


    
    
    if (doc.objects().count < 1) {
      console.error('No rhino objects to load!')
      showSpinner(false)
      return
    }
    // load rhino doc into three.js scene
    const buffer = new Uint8Array(doc.toByteArray()).buffer
    loader.parse( buffer, function ( object ) 
    {
        // debug 
        /*
        object.traverse(child => {
          if (child.material !== undefined)
            child.material = new THREE.MeshNormalMaterial()
        }, false)
        */
        object.traverse((child)=>
        {
          if(child.isMesh){
            //console.log('ok')
            if (child.userData.attributes.geometry.userStringCount > 0){
              //console.log('ok')
              const col = child.userData.attributes.geometry.userStrings[0][1];
              const threeColor = new THREE.Color("rgb(" + col + ")");
              //console.log(threeColor);
              let sphere_Material = new THREE.MeshPhysicalMaterial({color: "black",  clearcoat: 1.0,
                clearcoatRoughness:0.1,
                metalness: 0.5,
                roughness:0.5,  ior: 2.5,  transparent: true, opacity: 0.95,});
                child.material = sphere_Material;
                //console.log(child)
                //let mat = new THREE.MeshStandardMaterial({color: "red", emissive: "black", emissiveIntensity: 5.0, roughness: 0.50, metalness: 0.40})
                //child.material = mat;
            
            }
          }
        })
        // clear objects from scene. do this here to avoid blink
        scene.traverse(child => {
            if (!child.isLight) {
                scene.remove(child)
            }
        })
        
        // add object graph from rhino model to three.js scene
        scene.add( object )
        
        
        
        // hide spinner and enable download button
        showSpinner(false)
        downloadButton.disabled = false
        // zoom to extents
        zoomCameraToSelection(camera, controls, scene.children)
    })
}
/**
 * Attempt to decode data tree item to rhino geometry
 */
function decodeItem(item) {
  const data = JSON.parse(item.data)
  if (item.type === 'System.String') {
    // hack for draco meshes
    try {
        return rhino.DracoCompression.decompressBase64String(data)
    } catch {} // ignore errors (maybe the string was just a string...)
  } else if (typeof data === 'object') {
    return rhino.CommonObject.decode(data)
  }
  return null
}
/**
 * Called when a slider value changes in the UI. Collect all of the
 * slider values and call compute to solve for a new scene
 */
function onSliderChange () {
  showSpinner(true)
  // get slider values
  let inputs = {}
  for (const input of document.getElementsByTagName('input')) {
    switch (input.type) {
    case 'number':
      inputs[input.id] = input.valueAsNumber
      break
    case 'range':
      inputs[input.id] = input.valueAsNumber
      break
    case 'checkbox':
      inputs[input.id] = input.checked
      break
    }
  }
  
  data.inputs = inputs
  compute()
}
// let arraytest2 = document.getElementsByClassName('data_test') 
// console.log(arraytest2)
/**
 * The animation loop!
 */
function animate() {
  requestAnimationFrame( animate )
  controls.update()
  renderer.render(scene, camera)
}
/**
 * Helper function for window resizes (resets the camera pov and renderer size)
  */
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize( window.innerWidth, window.innerHeight )
  animate()
}
/**
 * Helper function that behaves like rhino's "zoom to selection", but for three.js!
 */
function zoomCameraToSelection( camera, controls, selection, fitOffset = 1.2 ) {
  
  const box = new THREE.Box3();
  
  for( const object of selection ) {
    if (object.isLight) continue
    box.expandByObject( object );
  }
  
  const size = box.getSize( new THREE.Vector3() );
  const center = box.getCenter( new THREE.Vector3() );
  
  const maxSize = Math.max( size.x, size.y, size.z );
  const fitHeightDistance = maxSize / ( 2 * Math.atan( Math.PI * camera.fov / 360 ) );
  const fitWidthDistance = fitHeightDistance / camera.aspect;
  const distance = fitOffset * Math.max( fitHeightDistance, fitWidthDistance );
  
  const direction = controls.target.clone()
    .sub( camera.position )
    .normalize()
    .multiplyScalar( distance );
  controls.maxDistance = distance * 10;
  controls.target.copy( center );
  
  camera.near = distance / 100;
  camera.far = distance * 100;
  camera.updateProjectionMatrix();
  camera.position.copy( controls.target ).sub(direction);
  
  controls.update();
  
}
/**
 * This function is called when the download button is clicked
 */
function download () {
    // write rhino doc to "blob"
    const bytes = doc.toByteArray()
    const blob = new Blob([bytes], {type: "application/octect-stream"})
    // use "hidden link" trick to get the browser to download the blob
    const filename = data.definition.replace(/\.gh$/, '') + '.3dm'
    const link = document.createElement('a')
    link.href = window.URL.createObjectURL(blob)
    link.download = filename
    link.click()
}
/**
 * Shows or hides the loading spinner
 */
function showSpinner(enable) {
  if (enable)
    document.getElementById('loader').style.display = 'block'
  else
    document.getElementById('loader').style.display = 'none'
}