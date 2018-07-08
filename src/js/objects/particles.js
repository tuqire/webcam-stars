import FBO from 'three.js-fbo'
import { createDataTexture } from '../utils'
import { sizeSimulationVertexShader, sizeSimulationFragmentShader } from '../shaders/size-simulation-shaders'
import { blackAndWhiteSimulationVertexShader, blackAndWhiteSimulationFragmentShader } from '../shaders/black-and-white-webcam'
import { differenceSimulationVertexShader, differenceSimulationFragmentShader } from '../shaders/difference-webcam'
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

    // particle colours
    brightness = 1,
    opacity = 1,

    // webcam particle values
    webcamOutlineStrength = 50,
    webcamThreshold = 0.5,
    webcamStarInc = 0.0001,
    webcamStarSize = 0.3,
    webcamStarMultiplier = 5000,
    webcamStarDecSpeed = 5,

    // used to define raycasting boundries
    hoverDist = 10,
    hoverSizeInc = 0.05,
    hoverMaxSizeMultiplier = 5
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

    // use to define particle colours
    this.brightness = brightness
    this.opacity = opacity

    // webcm particle controls
    this.webcamOutlineStrength = webcamOutlineStrength
    this.webcamThreshold = webcamThreshold
    this.webcamStarInc = webcamStarInc
    this.webcamStarSize = webcamStarSize
    this.webcamStarMultiplier = webcamStarMultiplier
    this.webcamStarDecSpeed = webcamStarDecSpeed

    // used to define mouse interaction
    this.windowHalfX = window.innerWidth / 2
    this.windowHalfY = window.innerHeight / 2

    // used to define mouse interaction animation
    this.hoverDist = hoverDist
    this.hoverSizeInc = hoverSizeInc
    this.hoverMaxSizeMultiplier = hoverMaxSizeMultiplier

    this.videoEl = document.createElement('video')
    this.videoWidth = 1280
    this.videoHeight = 720

    const noSupport = document.createElement('h1')
    noSupport.innerHTML = 'Your browser is not supported. Please use Google Chrome (v21 or above).'

    navigator.getUserMedia
      ? navigator.getUserMedia({ video: { width: this.videoWidth, height: this.videoHeight } }, stream => {
        const videoEl = this.videoEl
        videoEl.srcObject = stream
        videoEl.autoplay = true

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

    const webcamEl = this.webcamEl = document.createElement('canvas')
    this.webcamElContext = webcamEl.getContext('2d')

    const webcamTexture = this.webcamTexture = new THREE.Texture(webcamEl)
    webcamTexture.minFilter = webcamTexture.magFilter = THREE.NearestFilter
    webcamTexture.needsUpdate = true

    const webcamDiffEl = this.webcamDiffEl = document.createElement('canvas')
    this.webcamDiffElContext = webcamDiffEl.getContext('2d')

    const webcamDiffTexture = this.webcamDiffTexture = new THREE.Texture(webcamDiffEl)
    webcamDiffTexture.minFilter = webcamDiffTexture.magFilter = THREE.NearestFilter
    webcamDiffTexture.needsUpdate = true

    this.positions = new Float32Array(this.numParticles * 3)

    this.blackAndWhiteFBO = new FBO({
      tWidth: this.webcamEl.width,
      tHeight: this.webcamEl.height,
      renderer: renderer.get(),
      uniforms: {
        tWebcam: { type: 't', value: webcamTexture }
      },
      simulationVertexShader: blackAndWhiteSimulationVertexShader,
      simulationFragmentShader: blackAndWhiteSimulationFragmentShader
    })

    this.webcamDifferenceFBO = new FBO({
      tWidth: this.webcamEl.width,
      tHeight: this.webcamEl.height,
      renderer: renderer.get(),
      uniforms: {
        webcamWidth: { type: 'f', value: this.webcamEl.width },
        webcamHeight: { type: 'f', value: this.webcamEl.height },
        tWebcam: { type: 't', value: 0 },
        webcamOutlineStrength: { type: 'f', value: this.webcamOutlineStrength }
      },
      simulationVertexShader: differenceSimulationVertexShader,
      simulationFragmentShader: differenceSimulationFragmentShader
    })

    this.webcamDifferenceFBO.setTextureUniform('tWebcam', this.blackAndWhiteFBO.getCurrentFrame())

    this.sizeFBO = new FBO({
      tWidth,
      tHeight,
      renderer: renderer.get(),
      uniforms: {
        radius: { type: 'f', value: this.radius },

        tPosition: { type: 't', value: 0 },
        tDefaultSize: { type: 't', value: 0 },
        tWebcam: { type: 't', value: 0 },

        sizeRange: { type: 'f', value: this.sizeRange },
        sizeInc: { type: 'f', value: this.sizeInc },

        webcamThreshold: { type: 'f', value: this.webcamThreshold },
        webcamStarInc: { type: 'f', value: this.webcamStarInc },
        webcamStarSize: { type: 'f', value: this.webcamStarSize },
        webcamStarMultiplier: { type: 'f', value: this.webcamStarMultiplier },
        webcamStarDecSpeed: { type: 'f', value: this.webcamStarDecSpeed },

        mouse: { value: new THREE.Vector3(10000, 10000, 10000) },
        hoverDist: { type: 'f', value: this.hoverDist },
        hoverSizeInc: { type: 'f', value: this.hoverSizeInc },
        hoverMaxSizeMultiplier: { type: 'f', value: this.hoverMaxSizeMultiplier }
      },
      simulationVertexShader: sizeSimulationVertexShader,
      simulationFragmentShader: sizeSimulationFragmentShader
    })

    this.sizeFBO.setTextureUniform('tPosition', this.getPositions())
    this.sizeFBO.setTextureUniform('tDefaultSize', this.getSizes())

    const uniforms = Object.assign({}, configUniforms, {
      tPosition: { type: 't', value: this.sizeFBO.simulationShader.uniforms.tPosition.value },
      tSize: { type: 't', value: this.sizeFBO.targets[0] },
      tWebcam: { type: 't', value: 0 },

      tColour: { type: 't', value: this.getColours() }
    })

    this.material = new THREE.ShaderMaterial({
      blending,
      uniforms,
      vertexShader,
      fragmentShader,
      depthTest,
      depthWrite,
      transparent
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

    document.addEventListener('mousemove', this.onMouseMove.bind(this), false)
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
    const xMultiplier = this.cameraZ / (this.windowHalfX * 2.7)
    const yMultiplier = this.cameraZ / (this.windowHalfY * -2.7)
    const mouseX = event.clientX - this.windowHalfX
    const mouseY = this.windowHalfY - event.clientY

    this.sizeFBO.simulationShader.uniforms.mouse.value.set(xMultiplier * mouseX, yMultiplier * mouseY, 0)
  }

  getPositions () {
    const vertices = new Float32Array(this.numParticles * 4)

    for (let i = 0, i3 = 0, i4 = 0; i < this.numParticles; i++, i3 += 3, i4 += 4) {
      const vertice = this.calcPosition()

      this.positions[i3] = vertices[i4] = vertice[0]
      this.positions[i3 + 1] = vertices[i4 + 1] = vertice[1]
      this.positions[i3 + 2] = vertices[i4 + 2] = vertice[2]

      vertices[i4 + 3] = 1.0
    }

    return vertices
  }

  calcPosition () {
    const x = (Math.random() - 0.5) * this.radius
    const y = (Math.random() - 0.5) * this.radius
    const z = 0

    return [x, y, z]
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
      format: this.sizeFBO.format,
      filterType: this.sizeFBO.filterType
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
      const { videoEl, webcamElContext, webcamEl: { width: videoWidth, height: videoHeight }, webcamTexture } = this
      if (videoEl.readyState === videoEl.HAVE_ENOUGH_DATA) {
        webcamElContext.drawImage(videoEl, 0, 0, videoWidth, videoHeight)
        webcamTexture.needsUpdate = true
      }

      this.blackAndWhiteFBO.simulate()
      this.webcamDifferenceFBO.simulationShader.uniforms.tWebcam.value = this.blackAndWhiteFBO.getCurrentFrame()
      this.webcamDifferenceFBO.simulate()
      this.sizeFBO.simulationShader.uniforms.tWebcam.value = this.webcamDifferenceFBO.getCurrentFrame()
      this.material.uniforms.tWebcam.value = this.webcamDifferenceFBO.getCurrentFrame()
      this.sizeFBO.simulate()
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
    if (this.minSize > this.maxSize) {
      this.minSize = this.maxSize
    }

    if (this.maxSize < this.minSize) {
      this.maxSize = this.minSize
    }

    this.webcamDifferenceFBO.simulationShader.uniforms.webcamOutlineStrength.value = this.webcamOutlineStrength
    this.sizeFBO.simulationShader.uniforms.webcamThreshold.value = this.webcamThreshold
    this.sizeFBO.simulationShader.uniforms.webcamStarInc.value = this.webcamStarInc
    this.sizeFBO.simulationShader.uniforms.webcamStarSize.value = this.webcamStarSize
    this.sizeFBO.simulationShader.uniforms.webcamStarMultiplier.value = this.webcamStarMultiplier
    this.sizeFBO.simulationShader.uniforms.webcamStarDecSpeed.value = this.webcamStarDecSpeed

    this.sizeFBO.simulationShader.uniforms.hoverDist.value = this.hoverDist
    this.sizeFBO.simulationShader.uniforms.hoverSizeInc.value = this.hoverSizeInc
    this.sizeFBO.simulationShader.uniforms.hoverMaxSizeMultiplier.value = this.hoverMaxSizeMultiplier
  }
}
