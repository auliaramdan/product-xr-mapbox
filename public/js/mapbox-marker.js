import"mapbox-gl/dist/mapbox-gl.css"

import * as THREE from "three"
import {OrbitControls} from "three/addons"
import "../css/index.css"

import mapboxgl from "mapbox-gl"
import geoJson from './pkg.json'

const mapCenter = [112.63693, -7.92734]

let scene, camera, renderer, element, mapElement, material
let lat = 0, lng = 0
let pointerDownPointer, pointerDownLngLat

mapboxgl.accessToken = "pk.eyJ1IjoiYXVsaWFyYW1kYW4iLCJhIjoiY2xzam9rYTl6MXRxdDJpcXBiZmM1d3R5ZSJ9.-IX9NkKaMd9ozRDHOEXOig"
const map = new mapboxgl.Map({
    container: "map",
    style: "mapbox://styles/mapbox/streets-v12",
    center: mapCenter,
    zoom: 18,
    pitch: 20,
    antialias: true
})

map.on('load', () => {
    map.addSource('places', {
        type: 'geojson',
        /*data: {
            'type': 'Feature',
            "properties": {
                "description": "Markas Besar PKG 2",
                "time": 18032024,
                "image": "/image/LT1-PCK25-2.jpg"
            },
            'geometry': {
                'type': 'Point',
                'coordinates': [112.63693, -7.92734]
            }
        }*/
        data: geoJson
    })

    map.addLayer({
        'id': 'places',
        'type': 'circle',
        'source': 'places',
        'paint': {
            'circle-radius': 10,
            'circle-color': '#4264fb'
        }
    })

    map.on('click', 'places', (e) => {
        const coordinates = e.features[0].geometry.coordinates.slice()
        const properties = e.features[0].properties

        while(Math.abs(e.lngLat.lng - coordinates[0]) > 180)
        {
            coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360
        }

        let popup = new mapboxgl.Popup()
            .setLngLat(coordinates)
            .setHTML(`<strong>${properties.description}</strong> <p>${new Date(properties.time * 1000)}</p> <button id="open"">Open Photo</button>`)
            .addTo(map)
        document.getElementById('open').onclick = () => {
            popup.remove()
            openPhoto(properties.image)
        }
    })

    map.on('mouseenter', 'places', () => {
        map.getCanvas().style.cursor = 'pointer'
    })

    map.on('mouseleave', 'places', () => {
        map.getCanvas().style.cursor = ''
    })
})

init()
animate()

function init()
{
    scene = new THREE.Scene()
    camera = new THREE.PerspectiveCamera(70, window.innerWidth/window.innerHeight)

    renderer = new THREE.WebGLRenderer({
        antialias: true,
    })

    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.setSize(window.innerWidth, window.innerHeight)
    window.addEventListener('resize', () => {
        renderer.setSize(window.innerWidth, window.innerHeight)
        camera.aspect = window.innerWidth / window.innerHeight
        camera.updateProjectionMatrix()
    })

    mapElement = document.getElementById('map')
    element = document.getElementById('photo')
    element.getElementsByTagName('button')[0].addEventListener('click', () => closePhoto())
    element.appendChild(renderer.domElement)

    material = new THREE.MeshBasicMaterial({map: new THREE.Texture(), side: THREE.BackSide})
    const sphere = new THREE.Mesh(new THREE.SphereGeometry(500, 60, 40), material)
    scene.add(sphere)
}

function animate()
{
    renderer.setAnimationLoop(render)
}

function render()
{
    if(element.style.display === 'none') {
        return
    }

    lat = Math.max(-85, Math.min(85, lat))

    const phi = THREE.MathUtils.degToRad(90 - lat)
    const theta = THREE.MathUtils.degToRad(lng)

    camera.position.set(
        100 * Math.sin(phi) * Math.cos(theta),
        100 * Math.cos(phi),
        100 * Math.sin(phi) * Math.sin(theta)
    )
    camera.lookAt(scene.position)

    renderer.render(scene, camera)
}

function openPhoto(image)
{
    let loader = new THREE.TextureLoader()
    loader.load(image,
        (result) => {
            material.map = result
            material.needsUpdate = true
        },
        null,
        (e) => {
            console.log(e)
        })

    element.style.display = 'block'
    mapElement.style.display = 'none'

    map.boxZoom.disable()
    map.scrollZoom.disable()
    map.dragPan.disable()
    map.dragRotate.disable()
    map.keyboard.disable()
    map.doubleClickZoom.disable()
    map.touchZoomRotate.disable()

    element.addEventListener('mousedown', onWindowMouseDown, false)
}

function closePhoto()
{
    element.style.display = 'none'
    mapElement.style.display = 'block'

    map.boxZoom.enable()
    map.scrollZoom.enable({around: 'center'})
    map.dragPan.enable()
    map.dragRotate.enable()
    map.keyboard.enable()
    map.doubleClickZoom.enable()
    map.touchZoomRotate.enable({around: 'center'})

    element.removeEventListener('mousedown', onWindowMouseDown, false)
}

function onWindowMouseDown(event)
{
    event.preventDefault()

    console.log('Panning')

    pointerDownPointer = new THREE.Vector2(event.clientX, event.clientY)
    pointerDownLngLat = new THREE.Vector2(lng, lat)

    element.addEventListener('mousemove', onWindowMouseMove, false)
    element.addEventListener('mouseup', onWindowMouseUp, false)

    /*element.addEventListener('pointermove', onWindowMouseMove, false)
    element.addEventListener('pointerout', onWindowMouseUp, false)*/
}

function onWindowMouseMove(event)
{
    lng = (event.clientX - pointerDownPointer.x) * -0.175 + pointerDownLngLat.x
    lat = (event.clientY - pointerDownPointer.y) * -0.175 + pointerDownLngLat.y
}

function onWindowMouseUp(event)
{
    element.removeEventListener('mousemove', onWindowMouseMove, false)
    element.removeEventListener('mouseup', onWindowMouseUp, false)
    /*
        element.addEventListener('pointermove', onWindowMouseMove, false)
        element.addEventListener('pointerout', onWindowMouseUp, false)*/
}