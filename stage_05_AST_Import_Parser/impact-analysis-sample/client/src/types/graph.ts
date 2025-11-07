// Define a graph model to be used in the frontend.
export interface GraphModel {
	nodes: {id: string} [];
	edges: {source: string, target: string} [];
	stats: {files: number; edges: number; parsed: number; cached: number; timeMs: number};
}