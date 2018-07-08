import DatGUI from 'dat-gui'

export default class Controls {
  constructor ({
    particles,
    scene
  } = {}) {
    this.gui = new DatGUI.GUI()

    this.addSizeControls(particles)
    this.addWebcamControls(particles)
    this.addColourStrengthControls(particles)
    this.addOpacityControls(particles)
  }

  addMouseControls (particles) {
    this.gui
      .add(particles, 'hoverDist')
      .min(0)
      .max(0.5)
      .step(0.01)
      .onFinishChange(() => {
        particles.updateParticleVars()
      })

    this.gui
      .add(particles, 'hoverSizeInc')
      .min(0)
      .max(0.03)
      .step(0.001)
      .onFinishChange(() => {
        particles.updateParticleVars()
      })

    this.gui
      .add(particles, 'hoverMaxSizeMultiplier')
      .min(1)
      .max(3)
      .step(0.1)
      .onFinishChange(() => {
        particles.updateParticleVars()
      })
  }

  addSizeControls (particles) {
    this.gui
      .add(particles, 'minSize')
      .min(0.0001)
      .max(0.06)
      .step(0.0001)
      .onFinishChange(() => {
        particles.updateSizes()
      })

    this.gui
      .add(particles, 'maxSize')
      .min(0.01)
      .max(0.1)
      .step(0.001)
      .onFinishChange(() => {
        particles.updateSizes()
      })

    this.gui
      .add(particles, 'sizeInc')
      .min(0.00001)
      .max(0.0002)
      .step(0.00001)
      .onFinishChange(() => {
        particles.updateSizes()
      })

    this.gui
      .add(particles, 'sizeRange')
      .min(0)
      .max(0.02)
      .step(0.0005)
      .onFinishChange(() => {
        particles.updateSizes()
      })

    this.gui
      .add(particles, 'skew')
      .min(1)
      .max(1000)
      .step(10)
      .onFinishChange(() => {
        particles.updateSizes()
      })
  }

  addWebcamControls (particles) {
    this.gui
      .add(particles, 'webcamOutlineStrength')
      .min(10)
      .max(300)
      .step(1)
      .onFinishChange(() => {
        particles.updateParticleVars()
      })

    this.gui
      .add(particles, 'webcamThreshold')
      .min(0)
      .max(1)
      .step(0.05)
      .onFinishChange(() => {
        particles.updateParticleVars()
      })

    this.gui
      .add(particles, 'webcamStarInc')
      .min(0.000001)
      .max(0.001)
      .step(0.00001)
      .onFinishChange(() => {
        particles.updateParticleVars()
      })

    this.gui
      .add(particles, 'webcamStarSize')
      .min(0.001)
      .max(0.05)
      .step(0.001)
      .onFinishChange(() => {
        particles.updateParticleVars()
      })

    this.gui
      .add(particles, 'webcamStarMultiplier')
      .min(1000)
      .max(10000)
      .step(100)
      .onFinishChange(() => {
        particles.updateParticleVars()
      })

    this.gui
      .add(particles, 'webcamStarDecSpeed')
      .min(1)
      .max(50)
      .step(0.5)
      .onFinishChange(() => {
        particles.updateParticleVars()
      })
  }

  addColourStrengthControls (particles) {
    this.gui
      .add(particles, 'brightness')
      .min(0.1)
      .max(3)
      .step(0.05)
      .onFinishChange(() => {
        particles.updateColours()
      })
  }

  addOpacityControls (particles) {
    this.gui
      .add(particles, 'opacity')
      .min(0.1)
      .max(2)
      .step(0.05)
      .onFinishChange(() => {
        particles.updateColours()
      })
  }
}
