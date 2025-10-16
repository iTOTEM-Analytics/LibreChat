import Plot from "react-plotly.js";

export default function EfficiencyChart() {
  return (
    <Plot
      data={[
        {
          x: ["Project A", "Project B", "Project C"],
          y: [70, 55, 85],
          type: "bar",
          marker: { color: "#39abed" }
        }
      ]}
      layout={{ title: "Chat Efficiency by Project", margin: { t: 30, l: 40, r: 10, b: 40 }, height: 300 }}
      config={{ displayModeBar: false }}
    />
  );
}
