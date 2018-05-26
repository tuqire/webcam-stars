/* eslint-disable */

const fragmentShader = `
	uniform sampler2D tDefaultPosition;
	uniform sampler2D tPosition;
	uniform sampler2D starImg;
	uniform sampler2D tWebcam;

	varying vec2 vUv;

	void main() {
		vec3 position = texture2D(tDefaultPosition, vUv).xyz;
		vec4 colour = texture2D(tWebcam, vec2((position.x + 3.) / 5.8, (position.y + 3.) / 5.8)).rgba;

		gl_FragColor = colour;
		gl_FragColor = gl_FragColor * texture2D(starImg, gl_PointCoord);
	}
`

const vertexShader = `
	uniform sampler2D tDefaultPosition;
	uniform sampler2D tPosition;
	uniform sampler2D tSize;

	uniform float sizeMultiplierForScreen;

	varying vec2 vUv;

	void main() {
		vUv = position.xy;

		// position saved as rgba / xyzw value in a texture object in memory
		vec4 position = texture2D(tDefaultPosition, vUv).xyzw;

		float size = texture2D(tSize, vUv).a;

		vec4 mvPosition = modelViewMatrix * position;
		gl_PointSize = size * (sizeMultiplierForScreen / -mvPosition.z);
		gl_Position = projectionMatrix * mvPosition;
	}
`

export {
  fragmentShader,
  vertexShader
}
