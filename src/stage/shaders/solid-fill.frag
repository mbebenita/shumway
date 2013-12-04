precision mediump float;

varying vec4 vColor;
uniform sampler2D uSampler;
varying vec2 vCoordinate;

void main() {
  gl_FragColor = vColor;
}