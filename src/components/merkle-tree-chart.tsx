import { useMemo } from "react";
import { bytesToHex } from "@noble/hashes/utils";
import { Chart } from "react-chartjs-2";
import { EdgeLine, IGraphDataPoint, TreeController } from "chartjs-chart-graph";
import datalabels from "chartjs-plugin-datalabels";

import { MerkleNode } from "../helpers/merkle";
import { ChartConfiguration, LinearScale, PointElement, registry } from "chart.js";

registry.addControllers(TreeController);
registry.addElements(EdgeLine, PointElement);
registry.addScales(LinearScale);
registry.addPlugins(datalabels);

function merkleTreeToChartDate(
  nodes: (IGraphDataPoint & Record<string, unknown>)[],
  branch: MerkleNode,
  parent?: number,
) {
  const index = nodes.push({ name: bytesToHex(branch.hash), parent }) - 1;
  if (branch.right) merkleTreeToChartDate(nodes, branch.right, index);
  if (branch.left) merkleTreeToChartDate(nodes, branch.left, index);

  return nodes;
}

export default function MerkleTreeChart({ tree }: { tree: MerkleNode }) {
  const data = useMemo<ChartConfiguration<"tree">["data"]>(() => {
    const nodes = merkleTreeToChartDate([], tree);

    return {
      labels: nodes.map((d) => d.name),
      datasets: [
        {
          pointBackgroundColor: "purple",
          pointRadius: 10,
          data: nodes,
        },
      ],
    };
  }, [tree]);

  const options = useMemo<ChartConfiguration<"tree">["options"]>(
    () => ({
      plugins: {
        datalabels: {
          display: false,
        },
      },
      tree: {
        orientation: "vertical",
      },
    }),
    [],
  );

  return <Chart type="tree" data={data} options={options} />;
}
