import * as THREE from "../../../js/three.module.js";

export namespace GeometryCompressionUtils {

	export function compressNormals( mesh: THREE.Mesh, encodeMethod: String );
	export function compressPositions( mesh: THREE.Mesh );
	export function compressUvs( mesh: THREE.Mesh );

}