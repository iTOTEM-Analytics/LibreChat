import Plot from "react-plotly.js";

export default function PieChart() {
  return (
    <Plot
      data={[
        {
          type: "pie",
          values: [40, 25, 20, 15],
          labels: ["Feedback", "Environmental", "Compliance", "Other"],
          marker: {
            colors: ["#2ec499", "#39abed", "#ed398a", "#bbb"]
          }
        }
      ]}
      layout={{ title: "Top Discussion Categories", height: 300 }}
      config={{ displayModeBar: false }}
    />
  );
}
