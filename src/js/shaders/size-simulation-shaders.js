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
	uniform float radius;

	float getSize(bool isWebcamParticle, float webcamParticleVal) {
		float defaultSize = texture2D(tDefaultSize, vUv).w;
		float prevSize = texture2D(tPrev, vUv).w;
		float size = texture2D(tCurr, vUv).w;
		bool wasWebcamParticle = texture2D(tCurr, vUv).z > 0.5 && !isWebcamParticle;
		float _sizeInc = sizeInc;
		float _defaultSize = defaultSize;

		if (isWebcamParticle) {
			_defaultSize += webcamParticleVal * 0.015;
			_sizeInc += webcamParticleVal * 0.0001;
		}

		float minSize = _defaultSize - sizeRange;
		float maxSize = _defaultSize + sizeRange;

		if (size == 0.0) {
			size = _defaultSize;
		} else if (prevSize == 0.0 || size == prevSize) {
			size += rand(vUv) >= 0.5 ? _sizeInc : -_sizeInc;
		} else if (size < minSize) {
			size += _sizeInc;
		} else if (size > maxSize) {
			size = wasWebcamParticle ? size - (_sizeInc * 5.5) : size - _sizeInc;
		} else {
			size += size - prevSize > 0.0 ? _sizeInc : -_sizeInc;
		}

		return size;
	}

	void main() {
		vec3 currPosition = texture2D(tPosition, vUv).xyz;
		float webcamParticleVal = texture2D(tWebcam, vec2((currPosition.x + (radius / 2.0)) / radius, (currPosition.y + (radius / 2.0)) / radius)).r;
		bool isWebcamParticle = webcamParticleVal > 0.5;

		gl_FragColor = vec4(0.0, 0.0, isWebcamParticle ? 1.0: 0.0, getSize(isWebcamParticle, webcamParticleVal));
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
