import CrudPage from "./CrudPage";
import { Badge } from "../../ui";
import { bedAllocations } from "../../data";

export default function BoardingBedAllocation(props) {
  return (
    <CrudPage {...props} title="বেড বরাদ্দ" description="শিক্ষার্থী-বেড বরাদ্দ" api={bedAllocations} resourceKey="bed_allocations"
      codePrefix="ALC" addLabel="নতুন বরাদ্দ" emptyTitle="কোনো বরাদ্দ নেই"
      columns={[
        { key: "code", label: "আইডি", sortable: true },
        { key: "student", label: "শিক্ষার্থী" },
        { key: "room_no", label: "রুম" },
        { key: "bed_no", label: "বেড" },
        { key: "date", label: "তারিখ", sortable: true },
        { key: "status", label: "অবস্থা", render: (r) => <Badge color={r.status === "সক্রিয়" ? "#2E7D32" : "#E53935"}>{r.status || "—"}</Badge>, exportValue: (r) => r.status },
      ]}
      fields={[
        { key: "student", label: "শিক্ষার্থীর নাম", required: true },
        { key: "room_no", label: "রুম নম্বর" },
        { key: "bed_no", label: "বেড নম্বর" },
        { key: "date", label: "বরাদ্দের তারিখ", type: "date" },
        { key: "status", label: "অবস্থা", type: "select", options: ["সক্রিয়", "সমাপ্ত"], default: "সক্রিয়" },
      ]}
    />
  );
}
