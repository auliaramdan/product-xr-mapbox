import"mapbox-gl/dist/mapbox-gl.css"

import * as THREE from "three"
import "../css/index.css"

import mapboxgl from "mapbox-gl"
import {Potree} from "potree-core"

const mapCenter = [112.63693, -7.92734]

let potree, pointClouds = []

mapboxgl.accessToken = "pk.eyJ1IjoiYXVsaWFyYW1kYW4iLCJhIjoiY2xzam9rYTl6MXRxdDJpcXBiZmM1d3R5ZSJ9.-IX9NkKaMd9ozRDHOEXOig"
const map = new mapboxgl.Map({
    container: "map",
    style: "mapbox://styles/mapbox/standard",
    center: mapCenter,
    zoom: 18,
    pitch: 20,
    antialias: true
})

const modelOrigin = mapCenter
const modelAltitude = 0
const modelRotate = [Math.PI/2, 0, 0]

const modelAsMercatorCoordinate = mapboxgl.MercatorCoordinate.fromLngLat(modelOrigin, modelAltitude)

const modelTransform = {
    translateX: modelAsMercatorCoordinate.x,
    translateY: modelAsMercatorCoordinate.y,
    translateZ: modelAsMercatorCoordinate.z,
    rotateX: modelRotate[0],
    rotateY: modelRotate[1],
    rotateZ: modelRotate[2],
    scale: modelAsMercatorCoordinate.meterInMercatorCoordinateUnits()
}

const modelLayer = {
    id: "model",
    type: "custom",
    renderingMode: "3d",
    onAdd: init,
    render: render
}

function init(map, gl)
{
    this.camera = new THREE.Camera()
    this.scene = new THREE.Scene()

    const directionalLight = new THREE.DirectionalLight(0xffffff)
    directionalLight.position.set(0, -70, 100).normalize()
    this.scene.add(directionalLight)

    const directionalLight2 = new THREE.DirectionalLight(0xffffff)
    directionalLight2.position.set(0, 70, 100).normalize()
    this.scene.add(directionalLight2)

    this.renderer  = new THREE.WebGLRenderer({
        canvas: map.getCanvas(),
        context: gl,
        antialias: true
    })

    /*const loader = new PLYLoader()
    loader.load('/Lucy100k.ply',
        (geometry) => {

            geometry.computeVertexNormals()

            const material = new THREE.MeshStandardMaterial({color: 0x009cff, flatShading: true})
            const mesh = new THREE.Mesh(geometry, material)

            this.scene.add(mesh)
        }, null,
        (e) => {
            console.log(e)
        })*/

    /*const loader = new FBXLoader()
    loader.load("./model/maket.fbx", (model) => {
        model.traverse( function ( child ) {

            if ( child.isMesh ) {
                child.castShadow = true
                child.receiveShadow = true

                child.material.forEach(mat => {
                    mat.side = THREE.DoubleSide
                })
            }
        })

        model.scale.set(0.01, 0.01, 0.01)
        this.scene.add(model)
    })*/

    potree = new Potree();
    potree.pointBudget = 2000_000;

    const folderName = "resources/pointclouds/spartan_recap2"

    potree
        .loadPointCloud(
            "cloud.js",
            url => {
                console.log("URL: " + `${folderName}/${url}`);
                return `../${folderName}/${url}`;
            }
        )
        .then(pco => {

            pco.scale.set(3, 3, 3);
            pointClouds.push(pco);
            console.log(pco)

            // The point cloud comes with a material which can be customized directly.
            // Here we just set the size of the points.
            pco.material.size = 0.1;

            //model = tb.Object3D({obj: pco, units: "meters"})
            //tb.add(model)

            this.scene.add(pco)

        })
        .catch(err => console.log(err));

    this.map = map

    this.renderer.autoClear = false
}

function render(gl, matrix)
{
    potree.updatePointClouds(pointClouds, this.camera, this.renderer);

    const rotationX = new THREE.Matrix4().makeRotationAxis(
        new THREE.Vector3(1, 0, 0),
        modelTransform.rotateX
    )
    const rotationY = new THREE.Matrix4().makeRotationAxis(
        new THREE.Vector3(0, 1, 0),
        modelTransform.rotateY
    )
    const rotationZ = new THREE.Matrix4().makeRotationAxis(
        new THREE.Vector3(0, 0, 1),
        modelTransform.rotateZ
    )

    const m = new THREE.Matrix4().fromArray(matrix)
    const l = new THREE.Matrix4()
        .makeTranslation(
            modelTransform.translateX,
            modelTransform.translateY,
            modelTransform.translateZ
        )
        .scale(
            new THREE.Vector3(
                modelTransform.scale,
                -modelTransform.scale,
                modelTransform.scale
            )
        )
        .multiply(rotationX)
        .multiply(rotationY)
        .multiply(rotationZ)

    this.camera.projectionMatrix = m.multiply(l)
    this.renderer.resetState()
    this.renderer.render(this.scene, this.camera)
    this.map.triggerRepaint()

}

map.on('style.load', () => {
    map.addLayer(modelLayer);
});