"""
BioWeaver Knowledge Graph Exporter
Exports the full bioweaver_graph.pkl into a JSON format that the frontend
can use directly — with NO hardcoding, NO limits, NO fabrication.

Output: frontend/src/data/graphData.json
"""
import pickle
import json
import os
from collections import defaultdict

def export_graph():
    print("Loading bioweaver_graph.pkl...")
    with open('data/processed/bioweaver_graph.pkl', 'rb') as f:
        G = pickle.load(f)

    print(f"Graph: {G.number_of_nodes()} nodes, {G.number_of_edges()} edges")

    # Build a lookup: for each node, its type
    node_types = {n: G.nodes[n].get('node_type', 'Unknown') for n in G.nodes()}

    # Build adjacency for every gene: direct neighbors + 2-hop diseases
    gene_nodes = [n for n, t in node_types.items() if t == 'Gene']
    print(f"Total gene nodes: {len(gene_nodes)}")

    gene_data = {}
    for idx, gene in enumerate(gene_nodes):
        if idx % 500 == 0:
            print(f"  Processing gene {idx}/{len(gene_nodes)}: {gene}")

        direct_genes = []
        direct_diseases = []
        direct_genes_set = set()
        direct_diseases_set = set()

        for nbr in G.successors(gene):
            edge = G.get_edge_data(gene, nbr)
            ntype = node_types.get(nbr, 'Unknown')
            entry = {
                "id": nbr,
                "label": nbr,
                "type": ntype.lower() if ntype != 'Unknown' else 'unknown',
                "relationship": edge.get('relationship', 'interacts_with'),
                "score": round(edge.get('score', 1.0), 4) if edge.get('score') is not None else None
            }
            if ntype == 'Gene':
                direct_genes.append(entry)
                direct_genes_set.add(nbr)
            elif ntype == 'Disease':
                direct_diseases.append(entry)
                direct_diseases_set.add(nbr)

        # 2-hop indirect diseases: gene -> gene_neighbor -> disease
        two_hop = {}
        for nbr_gene in direct_genes_set:
            edge1 = G.get_edge_data(gene, nbr_gene)
            ppi_score = edge1.get('score', None)
            if ppi_score is None:
                continue  # skip if no PPI score

            for nbr2 in G.successors(nbr_gene):
                if nbr2 in direct_diseases_set:
                    continue  # direct takes priority
                if nbr2 == gene:
                    continue  # skip self
                ntype2 = node_types.get(nbr2, 'Unknown')
                if ntype2 != 'Disease':
                    continue

                edge2 = G.get_edge_data(nbr_gene, nbr2)
                # Indirect score = PPI score (topology-based, RF scoring happens at predict time)
                indirect_score = ppi_score
                key = nbr2
                if key not in two_hop or indirect_score > two_hop[key]['score']:
                    two_hop[key] = {
                        "id": nbr2,
                        "disease": nbr2,
                        "through_gene": nbr_gene,
                        "score": round(indirect_score, 4),
                        "path": [gene, nbr_gene, nbr2],
                        "relationship": edge2.get('relationship', 'causes')
                    }

        indirect_diseases = sorted(two_hop.values(), key=lambda x: x['score'], reverse=True)

        # Only store genes that have at least some neighbors
        if direct_genes or direct_diseases or indirect_diseases:
            gene_data[gene] = {
                "directGenes": direct_genes,
                "directDiseases": direct_diseases,
                "indirectDiseases": indirect_diseases
            }

    # Create output directory
    out_dir = 'frontend/src/data'
    os.makedirs(out_dir, exist_ok=True)
    out_path = os.path.join(out_dir, 'graphData.json')

    print(f"\nWriting {len(gene_data)} gene entries to {out_path}...")
    with open(out_path, 'w', encoding='utf-8') as f:
        json.dump(gene_data, f)

    print(f"✅ Done! {out_path}")

    # Self-verify BRCA1
    brca1 = gene_data.get('BRCA1', {})
    print(f"\n=== BRCA1 Verification ===")
    print(f"  Direct genes: {len(brca1.get('directGenes', []))}")
    for g in brca1.get('directGenes', []):
        print(f"    {g['id']} [score={g['score']}]")
    print(f"  Direct diseases: {len(brca1.get('directDiseases', []))}")
    for d in brca1.get('directDiseases', []):
        print(f"    {d['id']}")
    print(f"  2-hop indirect diseases: {len(brca1.get('indirectDiseases', []))}")
    for d in brca1.get('indirectDiseases', [])[:5]:
        print(f"    {d['disease']} [through {d['through_gene']}, score={d['score']}]")
        print(f"      path: {' -> '.join(d['path'])}")

if __name__ == '__main__':
    export_graph()
