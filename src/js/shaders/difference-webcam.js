/* eslint-disable */

const differenceSimulationFragmentShader = `
	// this is the texture position the data for this particle is stored in
	varying vec2 vUv;

	uniform sampler2D tWebcam;

	uniform float sizeInc;
  uniform float sizeRange;
  uniform float tHeight;
  uniform float tWidth;

	void main() {
		vec3 webcamParticle = texture2D(tWebcam, vUv).xyz;
		vec3 webcamParticleAbove = texture2D(tWebcam, vec2(vUv.x, vUv.y - (1.0 / 300.0))).xyz;
		vec3 webcamParticleBelow = texture2D(tWebcam, vec2(vUv.x, vUv.y + (1.0 / 300.0))).xyz;
		vec3 webcamParticleLeft = texture2D(tWebcam, vec2(vUv.x - (1.0 / 150.0), vUv.y)).xyz;
		vec3 webcamParticleRight = texture2D(tWebcam, vec2(vUv.x + (1.0 / 150.0), vUv.y)).xyz;

    float average = (
			webcamParticleAbove.x + webcamParticleAbove.y +
      webcamParticleBelow.x + webcamParticleBelow.y +
      webcamParticleLeft.x + webcamParticleLeft.y +
			webcamParticleRight.x + webcamParticleRight.y
		) / 8.0;

    webcamParticle.x -= average;
    webcamParticle.y -= average;
    webcamParticle.z -= average;

    webcamParticle.x *= 40.0;
    webcamParticle.y *= 40.0;
    webcamParticle.z *= 40.0;

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
