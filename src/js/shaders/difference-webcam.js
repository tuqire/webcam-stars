/* eslint-disable */

const differenceSimulationFragmentShader = `
	// this is the texture position the data for this particle is stored in
	varying vec2 vUv;

	uniform sampler2D tWebcam;

	uniform float sizeInc;
  uniform float sizeRange;
  uniform float webcamWidth;
	uniform float webcamHeight;
	uniform float webcamOutlineStrength;

	void main() {
		vec3 webcamParticle = texture2D(tWebcam, vUv).xyz;
		vec3 webcamParticleAbove = texture2D(tWebcam, vec2(vUv.x, vUv.y - (1.0 / webcamWidth))).xyz;
		vec3 webcamParticleBelow = texture2D(tWebcam, vec2(vUv.x, vUv.y + (1.0 / webcamWidth))).xyz;
		vec3 webcamParticleLeft = texture2D(tWebcam, vec2(vUv.x - (1.0 / webcamHeight), vUv.y)).xyz;
		vec3 webcamParticleRight = texture2D(tWebcam, vec2(vUv.x + (1.0 / webcamHeight), vUv.y)).xyz;

    float average = (
			webcamParticleAbove.x +
      webcamParticleBelow.x +
      webcamParticleLeft.x +
			webcamParticleRight.x
		) / 4.0;

    webcamParticle.x -= average;
    webcamParticle.y -= average;
    webcamParticle.z -= average;

    webcamParticle.x *= webcamOutlineStrength;
    webcamParticle.y *= webcamOutlineStrength;
    webcamParticle.z *= webcamOutlineStrength;

		gl_FragColor = vec4(webcamParticle, 1.0);
	}
`

const differenceSimulationVertexShader = `
	// this value stores the texture coordinates the data for this vertex is stored in
	varying vec2 vUv;

	void main() {
	  vUv = uv;

		gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
	}
`

export {
  differenceSimulationFragmentShader,
  differenceSimulationVertexShader
}
