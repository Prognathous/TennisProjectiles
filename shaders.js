var SPRITE_VERTEX_SOURCE = [
	'precision highp float;',

    'attribute vec3 a_position;',
	'attribute vec2 a_texCoord;',

    'uniform mat4 u_projectionMatrix;',
    'uniform mat4 u_viewMatrix;',
	
	'varying vec2 v_texCoord;',

    'void main (void) {',

		'v_texCoord = a_texCoord;',
        'gl_Position = u_projectionMatrix * u_viewMatrix * vec4(a_position, 1.0);',
    '}'
].join('\n');
	
var SPRITE_FRAGMENT_SOURCE = [
    'precision highp float;',        

	'varying vec2 v_texCoord;',		
	'uniform sampler2D u_spriteMap;',
	
	'void main (void) {',      

	'gl_FragColor = texture2D(u_spriteMap, v_texCoord).rgba;',
'}'
].join('\n');

var SIMPLE_VERTEX_SOURCE = [
    'precision highp float;',

    'attribute vec3 a_position;',

    'uniform mat4 u_projectionMatrix;',
    'uniform mat4 u_viewMatrix;',
	'uniform mat4 u_modelMatrix;',

    'void main (void) {',

        'gl_Position = u_projectionMatrix * u_viewMatrix * u_modelMatrix * vec4(a_position, 1.0);',
    '}'
].join('\n');

var SIMPLE_FRAGMENT_SOURCE = [
	'precision highp float;',
	
	'uniform vec4 u_colour;',
	
    'void main (void) {',            

        'gl_FragColor = u_colour;',
    '}'


].join('\n');