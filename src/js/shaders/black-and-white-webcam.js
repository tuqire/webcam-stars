/* eslint-disable */

const blackAndWhiteSimulationFragmentShader = `
	// this is the texture position the data for this particle is stored in
	varying vec2 vUv;

	uniform sampler2D tWebcam;

	uniform float sizeInc;
	uniform float sizeRange;

	void main() {
		vec3 webcamParticle = texture2D(tWebcam, vUv).xyz;
    float avg = (webcamParticle.x + webcamParticle.y + webcamParticle.z) / 3.0;

		gl_FragColor = vec4(avg, avg, avg, 1.0);
	}
`

const blackAndWhiteSimulationVertexShader = `
	// this value stores the texture coordinates the data for this vertex is stored in
	varying vec2 vUv;

	void main() {
	  vUv = uv;

		gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
	}
`

export {
  blackAndWhiteSimulationFragmentShader,
  blackAndWhiteSimulationVertexShader
}
