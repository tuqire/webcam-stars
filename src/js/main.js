import isWebglEnabled from 'detector-webgl'
import Stats from 'stats.js'
import Camera from './io/camera'
import Controls from './io/controls'
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
      minSize: 0.013,
      maxSize: 0.04,
      sizeRange: 0.003,
      sizeInc: 0.00005,
      skew: 75,
      brightness: 0.9,
      opacity: 1,
      webcamOutlineStrength: 70,
      webcamThreshold: 0.2,
      webcamStarInc: 0.0001,
      webcamStarSize: 0.01,
      webcamStarMultiplier: 5000,
      webcamStarDecSpeed: 5.5
    })
    const camera = new Camera({
      aspectRatio: 1.0,
      particles,
      position: {
        x: 0,
        y: 0.001,
        z: -3.9
      }
    })
    const fpsStats = new Stats()

    const init = () => {
      new Controls({ particles }) // eslint-disable-line

      fpsStats.showPanel(0)
      document.body.appendChild(fpsStats.dom)
    }

    const animate = () => {
      requestAnimationFrame(animate) // eslint-disable-line
      render()
    }

    const render = () => {
      fpsStats.begin()

      particles.update()

      renderer.render({
        scene: scene.get(),
        camera: camera.get()
      })

      fpsStats.end()
    }

    init()
    animate()
  } else {
    const info = document.getElementById('info')
    info.innerHTML = 'Your browser is not supported. Please use the latest version of Firefox or Chrome.'
  }
})
