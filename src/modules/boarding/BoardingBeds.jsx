import CrudPage from "./CrudPage";
import { Badge } from "../../ui";
import { beds, rooms as roomsApi } from "../../data";

const roomOptions = async () => {
  const list = await roomsApi.list();
  return [{ value: "", label: "— রুম —" }, ...list.map((r) => ({ value: r.room_no, label: `${r.room_no}${r.floor ? " · " + r.floor : ""}` }))];
};

export default function BoardingBeds(props) {
  return (
    <CrudPage {...props} title="বেড ব্যবস্থাপনা" description="বোর্ডিং বেডের তালিকা (রুম আসল তালিকা থেকে)" api={beds} resourceKey="beds"
      addLabel="নতুন বেড" emptyTitle="কোনো বেড নেই"
      columns={[
        { key: "bed_no", label: "বেড নম্বর", sortable: true },
        { key: "room_no", label: "রুম" },
        { key: "status", label: "অবস্থা", render: (r) => <Badge color={r.status === "খালি" ? "#2E7D32" : r.status === "বরাদ্দকৃত" ? "#0288D1" : "#E53935"}>{r.status || "—"}</Badge>, exportValue: (r) => r.status },
      ]}
      fields={[
        { key: "bed_no", label: "বেড নম্বর", required: true },
        { key: "room_no", label: "রুম নম্বর", type: "select", optionsFrom: roomOptions },
        { key: "status", label: "অবস্থা", type: "select", options: ["খালি", "বরাদ্দকৃত", "নষ্ট"], default: "খালি" },
      ]}
    />
  );
}
