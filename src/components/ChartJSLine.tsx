import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
);

type ChartData = {
  labels: string[];
  values: number[];
  datasetLabel?: string;
};

export default function ChartJSLine({ chartData }: { chartData: ChartData }) {
  if (!chartData) return null;
  const data = {
    labels: chartData.labels,
    datasets: [
      {
        label: chartData.datasetLabel ?? "Data",
        data: chartData.values,
        fill: false,
        borderColor: "#36a2eb",
        backgroundColor: "#9ad0f5",
      },
    ],
  };
  return <Line data={data} />;
}
