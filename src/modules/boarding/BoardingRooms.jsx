import CrudPage from "./CrudPage";
import { Badge } from "../../ui";
import { rooms } from "../../data";

export default function BoardingRooms(props) {
  return (
    <CrudPage {...props} title="রুম ব্যবস্থাপনা" description="বোর্ডিং রুমের তালিকা" api={rooms} resourceKey="rooms"
      addLabel="নতুন রুম" emptyTitle="কোনো রুম নেই"
      columns={[
        { key: "room_no", label: "রুম নম্বর", sortable: true },
        { key: "floor", label: "তলা" },
        { key: "capacity", label: "ধারণক্ষমতা" },
        { key: "type", label: "ধরন" },
        { key: "status", label: "অবস্থা", render: (r) => <Badge color={r.status === "সক্রিয়" ? "#2E7D32" : "#E53935"}>{r.status || "—"}</Badge>, exportValue: (r) => r.status },
      ]}
      fields={[
        { key: "room_no", label: "রুম নম্বর", required: true },
        { key: "floor", label: "তলা" },
        { key: "capacity", label: "ধারণক্ষমতা" },
        { key: "type", label: "ধরন", type: "select", options: ["আবাসিক", "শিক্ষক", "গেস্ট"], default: "আবাসিক" },
        { key: "status", label: "অবস্থা", type: "select", options: ["সক্রিয়", "নিষ্ক্রিয়"], default: "সক্রিয়" },
      ]}
    />
  );
}
