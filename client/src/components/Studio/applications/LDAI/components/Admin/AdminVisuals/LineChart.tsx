import Plot from "react-plotly.js";

export default function LineChart() {
  return (
    <Plot
      data={[
        {
          x: ["Jun", "Jul", "Aug"],
          y: [10, 22, 18],
          type: "scatter",
          mode: "lines+markers",
          marker: { color: "#2ec499" }
        }
      ]}
      layout={{ title: "Chat Usage Over Time", margin: { t: 30, l: 40, r: 10, b: 40 }, height: 300 }}
      config={{ displayModeBar: false }}
    />
  );
}
