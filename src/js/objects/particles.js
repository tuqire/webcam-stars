import FBO from 'three.js-fbo'
import { createDataTexture } from '../utils'
import { positionSimulationVertexShader, positionSimulationFragmentShader } from '../shaders/positionSimulationShaders'
import { sizeSimulationVertexShader, sizeSimulationFragmentShader } from '../shaders/sizeSimulationShaders'
import { vertexShader, fragmentShader } from '../shaders/shaders'

export default class Particles {
  constructor ({
    scene,
    configUniforms = {
      color: { value: new THREE.Color(0xffffff) },
      sizeMultiplierForScreen: { value: (window.innerHeight * window.devicePixelRatio) / 2 },
      starImg: { value: new THREE.TextureLoader().load('images/star.png') }
    },
    blending = THREE.AdditiveBlending,
    transparent = true,
    depthTest = true,
    depthWrite = false,

    renderer,

    // background colors
    bgColorTop = '#000f23',
    bgColorBottom = '#00071b',

    numParticles = 10000,
    radius = 100, // radius of outer particle

    // used to define and animate sizes
    minSize = 1,
    maxSize = 3,
    sizeRange = 0.5, // the amount the size is allowed to fluxuate in animation
    sizeInc = 0.01, // the amount the size is increased / decreased per frame
    skew = 1,

    // used to define raycasting boundries
    hoverDist = 10,
    hoverSizeInc = 0.05,
    hoverMaxSizeMultiplier = 5,

    // particle colours
    brightness = 1,
    opacity = 1
  }) {
    this.renderer = renderer

    this.bgColorTop = bgColorTop
    this.bgColorBottom = bgColorBottom

    this.numParticles = numParticles
    this.radius = radius

    // used to define star glinting
    this.minSize = minSize
    this.maxSize = maxSize
    this.sizeRange = sizeRange
    this.sizeInc = sizeInc
    this.skew = skew // skews the median size

    // used to define mouse interaction animation
    this.hoverDist = hoverDist
    this.hoverSizeInc = hoverSizeInc
    this.hoverMaxSizeMultiplier = hoverMaxSizeMultiplier

    // use to define particle colours
    this.brightness = brightness
    this.opacity = opacity

    // used to define mouse interaction
    this.windowHalfX = window.innerWidth / 2
    this.windowHalfY = window.innerHeight / 2

    this.video = document.createElement('video')

    const noSupport = document.createElement('h1')
    noSupport.innerHTML = 'Your browser is not supported. Please use Google Chrome (v21 or above).'

    navigator.getUserMedia
      ? navigator.getUserMedia({ video: { width: 1280, height: 720 } }, stream => {
        const video = this.video
        video.src = URL.createObjectURL(stream) // eslint-disable-line
        video.width = 480
        video.height = 480

        this.addStars({
          scene,
          renderer,
          configUniforms,
          blending,
          transparent,
          depthTest,
          depthWrite
        })
      }, () => console.error('video failed to load'))
      : document.getElementsByTagName('body')[0].append(noSupport)

    window.addEventListener('resize', this.onWindowResize.bind(this))
  }

  addStars ({
    scene,
    renderer,
    configUniforms,
    blending,
    transparent,
    depthTest,
    depthWrite
  }) {
    // height and width that set up a texture in memory
    // this texture is used to store particle position values
    const tHeight = this.tHeight = Math.ceil(Math.sqrt(this.numParticles))
    const tWidth = this.tWidth = tHeight
    this.numParticles = tWidth * tHeight

    this.positions = new Float32Array(this.numParticles * 3)

    this.positionFBO = new FBO({
      tWidth,
      tHeight,
      renderer: renderer.get(),
      uniforms: {
        tDefaultPosition: { type: 't', value: 0 }, // default star positions

        topSpeed: { type: 'f', value: this.topSpeed }, // the top speed of stars
        acceleration: { type: 'f', value: this.acceleration } // the star particle acceleration
      },
      simulationVertexShader: positionSimulationVertexShader,
      simulationFragmentShader: positionSimulationFragmentShader
    })

    this.positionFBO.setTextureUniform('tDefaultPosition', this.getPositions())

    const videoImage = this.videoImage = document.createElement('canvas')
    this.videoImageContext = videoImage.getContext('2d')

    const videoTexture = this.videoTexture = new THREE.Texture(videoImage)
    videoTexture.minFilter = videoTexture.magFilter = THREE.NearestFilter
    videoTexture.needsUpdate = true

    const videoDiffImage = this.videoDiffImage = document.createElement('canvas')
    this.videoDiffImageContext = videoDiffImage.getContext('2d')

    const videoDiffTexture = this.videoDiffTexture = new THREE.Texture(videoDiffImage)
    videoDiffTexture.minFilter = videoDiffTexture.magFilter = THREE.NearestFilter
    videoDiffTexture.needsUpdate = true

    document.querySelector('body').appendChild(videoImage)
    document.querySelector('body').appendChild(videoDiffImage)

    this.sizeFBO = new FBO({
      tWidth,
      tHeight,
      renderer: renderer.get(),
      uniforms: {
        tPosition: { type: 't', value: this.positionFBO.simulationShader.uniforms.tDefaultPosition.value },
        tDefaultSize: { type: 't', value: 0 },
        tWebcam: { type: 't', value: videoDiffTexture },

        mouse: { value: new THREE.Vector3(10000, 10000, 10000) },

        sizeRange: { type: 'f', value: this.sizeRange },
        sizeInc: { type: 'f', value: this.sizeInc },

        hoverDist: { type: 'f', value: this.hoverDist },
        hoverSizeInc: { type: 'f', value: this.hoverSizeInc },
        hoverMaxSizeMultiplier: { type: 'f', value: this.hoverMaxSizeMultiplier }
      },
      simulationVertexShader: sizeSimulationVertexShader,
      simulationFragmentShader: sizeSimulationFragmentShader
    })

    this.sizeFBO.setTextureUniform('tDefaultSize', this.getSizes())

    const uniforms = Object.assign({}, configUniforms, {
      tDefaultPosition: { type: 't', value: this.positionFBO.simulationShader.uniforms.tDefaultPosition.value },
      tPosition: { type: 't', value: this.positionFBO.targets[0] },
      tSize: { type: 't', value: this.sizeFBO.targets[0] },
      tWebcam: { type: 't', value: videoDiffTexture },

      tColour: { type: 't', value: this.getColours() }
    })

    this.material = new THREE.ShaderMaterial({
      uniforms,
      vertexShader,
      fragmentShader,
      depthTest,
      depthWrite,
      opacity: 1,
      vertexColors: true,
      transparent: true
    })

    // set uv coords of particles in texture as positions
    const geometry = new THREE.Geometry()

    for (let i = 0; i < this.numParticles; i++) {
      const vertex = new THREE.Vector3()
      vertex.x = (i % tWidth) / tWidth
      vertex.y = Math.floor(i / tWidth) / tHeight
      geometry.vertices.push(vertex)
    }

    this.particles = new THREE.Points(geometry, this.material)
    this.particles.frustumCulled = false

    scene.add(this.get())

    this.ready = true
  }

  get bgColorTop () {
    return this._bgColorTop
  }

  set bgColorTop (newVal) {
    this._bgColorTop = newVal
    document.getElementsByTagName('body')[0].style.background = `linear-gradient(${this._bgColorTop}, ${this._bgColorBottom})`
  }

  get bgColorBottom () {
    return this._bgColorBottom
  }

  set bgColorBottom (newVal) {
    this._bgColorBottom = newVal
    document.getElementsByTagName('body')[0].style.background = `linear-gradient(${this._bgColorTop}, ${this._bgColorBottom})`
  }

  onWindowResize () {
    this.windowHalfX = window.innerWidth / 2
    this.windowHalfY = window.innerHeight / 2
  }

  onMouseMove (event) {
    const xMultiplier = this.cameraZ / (this.windowHalfY * 2.8)
    const yMultiplier = this.cameraZ / (this.windowHalfY * 2.65)
    const mouseX = event.clientX - this.windowHalfX
    const mouseY = this.windowHalfY - event.clientY

    this.sizeFBO.simulationShader.uniforms.mouse.value.set(xMultiplier * mouseX, yMultiplier * mouseY, 0)
  }

  getPositions () {
    const vertices = new Float32Array(this.numParticles * 4)
    let largestX = 0
    let largestY = 0
    let lowestX = 0
    let lowestY = 0

    for (let i = 0, i3 = 0, i4 = 0; i < this.numParticles; i++, i3 += 3, i4 += 4) {
      const vertice = this.calcPosition()

      this.positions[i3] = vertices[i4] = vertice[0]
      this.positions[i3 + 1] = vertices[i4 + 1] = vertice[1]
      this.positions[i3 + 2] = vertices[i4 + 2] = vertice[2]

      largestX = largestX < this.positions[i3] ? this.positions[i3] : largestX
      largestY = largestY < this.positions[i3] ? this.positions[i3] : largestY

      lowestX = lowestX > this.positions[i3] ? this.positions[i3] : lowestX
      lowestY = lowestY > this.positions[i3] ? this.positions[i3] : lowestY

      vertices[i4 + 3] = 1.0 // stores whether particle is representing text or not
    }
    console.log({
      maxX: largestX,
      maxY: largestY,
      minX: lowestX,
      minY: lowestY
    })
    return vertices
  }

  calcPosition () {
    const radius = this.radius
    const x = Math.random() - 0.5
    const y = Math.random() - 0.5
    const z = 0
    const d = Math.pow(Math.random(), 0.6) * radius * (1 / Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2)))

    return [
      x * d,
      y * d,
      z
    ]
  }

  getSizes () {
    const sizes = new Float32Array(this.numParticles * 4)
    for (let i = 0, i4 = 0; i < this.numParticles; i++, i4 += 4) {
      sizes[i4 + 3] = this.calcSize()
    }
    return sizes
  }

  calcSize () {
    const sizeRange = this.maxSize - this.minSize
    const size = this.minSize + (sizeRange * Math.pow(Math.random(), this.skew))

    return size
  }

  getColours () {
    const colours = new Float32Array(this.numParticles * 4)

    for (let i = 0, i4 = 0; i < this.numParticles; i++, i4 += 4) {
      const colour = this.calcColour()

      colours[i4] = colour[0]
      colours[i4 + 1] = colour[1]
      colours[i4 + 2] = colour[2]
      colours[i4 + 3] = colour[3]
    }

    return createDataTexture({
      data: colours,
      tWidth: this.tWidth,
      tHeight: this.tHeight,
      format: this.positionFBO.format,
      filterType: this.positionFBO.filterType
    })
  }

  calcColour () {
    const randomVal = Math.ceil(Math.random() * 10)

    const getColor = (r, g, b, a) => [
      this.brightness * r / 255,
      this.brightness * g / 255,
      this.brightness * b / 255,
      this.opacity
    ]

    switch (randomVal) {
      case 1:
        return getColor(155, 176, 255)

      case 2:
        return getColor(170, 191, 255)

      case 3:
        return getColor(202, 215, 255)

      case 4:
        return getColor(248, 247, 255)

      case 5:
        return getColor(255, 244, 234)

      case 6:
        return getColor(255, 210, 161)

      case 7:
        return getColor(255, 204, 111)

      default:
        return getColor(255, 255, 255)
    }
  }

  update () {
    if (this.ready) {
      // update video texture with webcam difference feed
      const { video, videoImageContext, videoDiffImageContext, videoImage: { width: videoWidth, height: videoHeight }, videoTexture, videoDiffTexture } = this
      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        videoImageContext.drawImage(video, 0, 0, videoWidth, videoHeight)

        videoTexture.needsUpdate = true

        const imgPixels = videoImageContext.getImageData(0, 0, videoWidth, videoHeight)

        for (let y = 0; y < imgPixels.height; y++) {
          for (let x = 0; x < imgPixels.width; x++) {
            const i = (y * 4) * imgPixels.width + x * 4
            const avg = (imgPixels.data[i] + imgPixels.data[i + 1] + imgPixels.data[i + 2]) / 3

            imgPixels.data[i] = avg
            imgPixels.data[i + 1] = avg
            imgPixels.data[i + 2] = avg
          }
        }

        for (let y = 0; y < imgPixels.height; y += 1) {
          for (let x = 0; x < imgPixels.width; x += 1) {
            const i = (y * 4) * imgPixels.width + x * 4

            const average = (imgPixels.data[i - 3] + imgPixels.data[i + 5] +
              imgPixels.data[i - (imgPixels.width * 4) + 1] + imgPixels.data[i + (imgPixels.width * 4) + 1] +
              imgPixels.data[i - (imgPixels.width * 4) - 3] + imgPixels.data[i + (imgPixels.width * 4) - 3] +
              imgPixels.data[i - (imgPixels.width * 4) + 5] + imgPixels.data[i + (imgPixels.width * 4) + 5]) / 4

            imgPixels.data[i] -= average
            imgPixels.data[i + 1] -= average
            imgPixels.data[i + 2] -= average

            imgPixels.data[i] *= 20
            imgPixels.data[i + 1] *= 20
            imgPixels.data[i + 2] *= 20
          }
        }

        videoDiffImageContext.putImageData(imgPixels, 0, 0, 0, 0, imgPixels.width, imgPixels.height)

        videoDiffTexture.needsUpdate = true
      }

      this.positionFBO.simulate()
      this.sizeFBO.simulate()
      this.sizeFBO.simulationShader.uniforms.tPosition.value = this.material.uniforms.tPosition.value = this.positionFBO.getCurrentFrame()
      this.material.uniforms.tSize.value = this.sizeFBO.getCurrentFrame()
    }
  }

  get () {
    return this.particles
  }

  setCameraZ (newCameraZ) {
    this.cameraZ = newCameraZ
  }

  updateColours () {
    this.material.uniforms.tColour.value = this.getColours()
  }

  updateSizes () {
    this.sizeFBO.simulationShader.uniforms.sizeRange.value = this.sizeRange
    this.sizeFBO.simulationShader.uniforms.sizeInc.value = this.sizeInc
    this.sizeFBO.setTextureUniform('tDefaultSize', this.getSizes())
  }

  updateParticleVars () {
    this.positionFBO.simulationShader.uniforms.topSpeed.value = this.topSpeed
    this.positionFBO.simulationShader.uniforms.acceleration.value = this.acceleration

    this.sizeFBO.simulationShader.uniforms.hoverDist.value = this.hoverDist
    this.sizeFBO.simulationShader.uniforms.hoverSizeInc.value = this.hoverSizeInc
    this.sizeFBO.simulationShader.uniforms.hoverMaxSizeMultiplier.value = this.hoverMaxSizeMultiplier
  }
}
