/* eslint-disable */

const fragmentShader = `
	uniform sampler2D tColour;
	uniform sampler2D starImg;

	varying vec2 vUv;

	void main() {
		vec4 colour = texture2D(tColour, vUv).rgba;

		gl_FragColor = colour;
		gl_FragColor = gl_FragColor * texture2D(starImg, gl_PointCoord);
	}
`

const vertexShader = `
	uniform sampler2D tPosition;
	uniform sampler2D tSize;

	uniform float sizeMultiplierForScreen;

	varying vec2 vUv;

	void main() {
		vUv = position.xy;

		// position saved as rgba / xyzw value in a texture object in memory
		vec4 position = texture2D(tPosition, vUv).xyzw;
		float size = texture2D(tSize, vUv).w;

		vec4 mvPosition = modelViewMatrix * position;
		gl_PointSize = size * (sizeMultiplierForScreen / -mvPosition.z);
		gl_Position = projectionMatrix * mvPosition;
	}
`

export {
  fragmentShader,
  vertexShader
}
