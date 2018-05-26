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

	uniform vec3 mouse;
	uniform float sizeInc;
	uniform float sizeRange;

	uniform float hoverDist;
	uniform float hoverSizeInc;
	uniform float hoverMaxSizeMultiplier;

	float getSize() {
		vec3 currPosition = texture2D(tPosition, vUv).xyz;
		float defaultSize = texture2D(tDefaultSize, vUv).w;
		float prevSize = texture2D(tPrev, vUv).w;
		float size = texture2D(tCurr, vUv).w;
		vec3 webcamCross = texture2D(tWebcam, vec2(currPosition.x, currPosition.y) / 1.5).rgb;

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

		float dist = length(currPosition.xy - mouse.xy);

		if (dist < hoverDist && size < (defaultSize * hoverMaxSizeMultiplier)) {
			size += hoverSizeInc;
		}

		return size;
	}

	void main() {
		// write new size out
		// gl_FragColor = vec4(0.0, 0.0, 0.0, getSize());

		float size = 0.1;
		
		// if (webcamCross.r > 0.0 || webcamCross.g > 0.0 || webcamCross.b > 0.0) {
		// 	size += sizeInc * 3.0;
		// }

		gl_FragColor = vec4(0.0, 0.0, 0.0, size);
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
