/* eslint-disable */

const sizeSimulationFragmentShader = `
	/** generates a random number between 0 and 1 **/
	highp float rand(vec2 co) {
		highp float a = 12.9898;
		highp float b = 78.233;
		highp float c = 43758.5453;
		highp float dt= dot(co.xy ,vec2(a,b));
		highp float sn= mod(dt,3.14);
		return fract(sin(sn) * c);
	}

	// this is the texture position the data for this particle is stored in
	varying vec2 vUv;

	uniform sampler2D tPrev;
	uniform sampler2D tCurr;
	uniform sampler2D tPosition;
	uniform sampler2D tDefaultSize;
	uniform sampler2D tWebcam;

	uniform float sizeInc;
	uniform float sizeRange;

	float getSize() {
		// vec4 currPosition = vec4((vUv.x * 1.0), (vUv.y * 1.0), 0.0, 1.0);
		// vec4 webcamParticle = texture2D(tWebcam, vec2(currPosition.x, currPosition.y)).rgba;
		vec3 currPosition = texture2D(tPosition, vUv).xyz;
		vec4 webcamParticle = texture2D(tWebcam, vec2((currPosition.x + 3.0) / 5.8, (currPosition.y + 3.0) / 5.8)).rgba;
		float defaultSize = texture2D(tDefaultSize, vUv).w;
		float prevSize = texture2D(tPrev, vUv).w;
		float size = texture2D(tCurr, vUv).w;
		// float sizeInc2 = sizeInc;
		// float sizeRange2 = sizeRange;

		// if (webcamParticle.r > 0.7) {
			// sizeInc2 *= webcamParticle.r * 5.0;
			// sizeRange2 *= webcamParticle.r * 5.0;
		// }

		// float minSize = defaultSize - sizeRange;
		// float maxSize = defaultSize + sizeRange2;

		if (size == 0.0) {
			size = defaultSize;
		} else if (prevSize == 0.0 || size == prevSize) {
			size = rand(vUv) >= 0.5 ? size + sizeInc : size - sizeInc;
		} else if (size < (defaultSize - sizeRange)) {
			size += sizeInc;
		} else if (size > (defaultSize + sizeRange)) {
			size -= sizeInc;
		} else {
			size += size - prevSize;
		}

		if (webcamParticle.r > 0.5) {
			size += webcamParticle.r / 2000.0;
		}

		return size;
	}

	void main() {
		gl_FragColor = vec4(0.0, 0.0, 0.0, getSize());
	}
`

const sizeSimulationVertexShader = `
	// this value stores the texture coordinates the data for this vertex is stored in
	varying vec2 vUv;

	void main() {
	  vUv = uv;

		gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
	}
`

export {
  sizeSimulationFragmentShader,
  sizeSimulationVertexShader
}
