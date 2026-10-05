import type { ClinicalRecord } from "@/types/patient";
import { Table } from "@/components/common/Table";
import { formatDate } from "@/utils/format";

export function ClinicalTable({ records }: { records: ClinicalRecord[] }) {
  return (
    <Table
      headers={["Ngày theo dõi", "Phơi nhiễm (năm)", "Bụi (mg/m³)", "FVC (%)", "FEV1 (%)"]}
      caption="Các mốc dữ liệu theo dõi"
    >
      {records.map((record) => (
        <tr key={record.id}>
          <td>{formatDate(record.date)}</td>
          <td>{record.exposureYears}</td>
          <td>{record.dustLevel}</td>
          <td>{record.fvc}</td>
          <td>{record.fev1}</td>
        </tr>
      ))}
    </Table>
  );
}
