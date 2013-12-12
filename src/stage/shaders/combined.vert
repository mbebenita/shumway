uniform vec2 uResolution;
uniform mat3 uTransformMatrix;
uniform float uZ;

attribute vec2 aPosition;
attribute vec4 aColor;
attribute vec2 aCoordinate;
attribute float aKind;
attribute float aSampler;

varying vec4 vColor;
varying vec2 vCoordinate;
varying float vKind;
varying float vSampler;

void main() {
  vec2 position = ((uTransformMatrix * vec3(aPosition, 1.0)).xy / uResolution) * 2.0 - 1.0;
  position *= vec2(1.0, -1.0);
  gl_Position = vec4(vec3(position, uZ), 1.0);
  vColor = aColor;
  vCoordinate = aCoordinate;
  vKind = aKind;
  vSampler = aSampler;
}