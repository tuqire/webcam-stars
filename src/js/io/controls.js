import DatGUI from 'dat-gui'

export default class Controls {
  constructor ({
    particles,
    scene
  } = {}) {
    this.gui = new DatGUI.GUI()

    this.addBgControls(particles)
    this.addSizeControls(particles)
    this.addWebcamControls(particles)
    this.addMouseControls(particles)
    this.addColourStrengthControls(particles)
    this.addOpacityControls(particles)
  }

  addBgControls (particles) {
    this.gui
      .addColor(particles, 'bgColorTop')

    this.gui
      .addColor(particles, 'bgColorBottom')
  }

  addSizeControls (particles) {
    this.gui
      .add(particles, 'minSize')
      .min(0)
      .max(0.06)
      .step(0.0001)
      .onFinishChange(() => {
        particles.updateSizes()
      })

    this.gui
      .add(particles, 'maxSize')
      .min(0)
      .max(0.1)
      .step(0.001)
      .onFinishChange(() => {
        particles.updateSizes()
      })

    this.gui
      .add(particles, 'sizeInc')
      .min(0)
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
      .add(particles, 'sizeSkew')
      .min(0)
      .max(1000)
      .step(10)
      .onFinishChange(() => {
        particles.updateSizes()
      })
  }

  addWebcamControls (particles) {
    this.gui
      .add(particles, 'webcamOutlineStrength')
      .min(0)
      .max(300)
      .step(1)
      .onFinishChange(() => {
        particles.updateParticleVars()
      })

    this.gui
      .add(particles, 'webcamThreshold')
      .min(0)
      .max(1)
      .step(0.02)
      .onFinishChange(() => {
        particles.updateParticleVars()
      })

    this.gui
      .add(particles, 'webcamStarInc')
      .min(0)
      .max(0.001)
      .step(0.00001)
      .onFinishChange(() => {
        particles.updateParticleVars()
      })

    this.gui
      .add(particles, 'webcamStarSize')
      .min(0)
      .max(0.05)
      .step(0.0005)
      .onFinishChange(() => {
        particles.updateParticleVars()
      })

    this.gui
      .add(particles, 'webcamStarMultiplier')
      .min(0)
      .max(10000)
      .step(100)
      .onFinishChange(() => {
        particles.updateParticleVars()
      })
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
      .min(0)
      .max(5)
      .step(0.2)
      .onFinishChange(() => {
        particles.updateParticleVars()
      })
  }

  addColourStrengthControls (particles) {
    this.gui
      .add(particles, 'brightness')
      .min(0)
      .max(3)
      .step(0.05)
      .onFinishChange(() => {
        particles.updateColours()
      })
  }

  addOpacityControls (particles) {
    this.gui
      .add(particles, 'opacity')
      .min(0)
      .max(2)
      .step(0.05)
      .onFinishChange(() => {
        particles.updateColours()
      })
  }
}
