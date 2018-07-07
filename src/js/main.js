import isWebglEnabled from 'detector-webgl'

import Camera from './io/camera'
import GUI from './io/gui'
import Renderer from './io/renderer'
import Scene from './objects/scene'
import Particles from './objects/particles'

document.addEventListener('DOMContentLoaded', () => {
  if (isWebglEnabled) {
    const container = document.getElementById('stars-simulation-container')
    const renderer = new Renderer({ container })
    const scene = new Scene()
    const particles = new Particles({
      scene,
      renderer,
      numParticles: window.matchMedia('(max-width: 480px)').matches ? 4000 : 100000,
      radius: 3,
      minSize: 0.015,
      maxSize: 0.03,
      sizeRange: 0.003,
      sizeInc: 0.00005,
      skew: 35,
      brightness: 0.9,
      opacity: 1
    })
    const camera = new Camera({
      particles,
      position: {
        x: 0,
        y: 0.001,
        z: -3.5
      }
    })

    const gui = new GUI({ particles }) // eslint-disable-line

    const animate = () => {
      requestAnimationFrame(animate) // eslint-disable-line
      render()
    }

    const render = () => {
      particles.update()

      renderer.render({
        scene: scene.get(),
        camera: camera.get()
      })
    }

    // init()
    animate()
  } else {
    const info = document.getElementById('info')
    info.innerHTML = 'Your browser is not supported. Please use the latest version of Firefox or Chrome.'
  }
})
