import { useRef } from "react";
import CrudPage from "./CrudPage";
import { Badge } from "../../ui";
import { bedAllocations, students as studentsApi, rooms as roomsApi, beds as bedsApi } from "../../data";

// বেড বরাদ্দ — আসল শিক্ষার্থী / রুম / বেড তালিকা থেকে নির্বাচন,
// বেড নির্বাচনে রুম auto-fill, এবং বরাদ্দের পর বেড "বরাদ্দকৃত" হয়ে যায়।
export default function BoardingBedAllocation(props) {
  const bedsRef = useRef([]);

  const studentOptions = async () => {
    const list = await studentsApi.list();
    return [{ value: "", label: "— শিক্ষার্থী বাছুন —" }, ...list.map((s) => ({ value: s.name, label: `${s.name} (${s.code || s.roll || "—"})` }))];
  };
  const roomOptions = async () => {
    const list = await roomsApi.list();
    return [{ value: "", label: "— রুম —" }, ...list.map((r) => ({ value: r.room_no, label: `${r.room_no}${r.floor ? " · " + r.floor : ""}` }))];
  };
  const bedOptions = async () => {
    const list = await bedsApi.list();
    bedsRef.current = list;
    return [{ value: "", label: "— বেড —" }, ...list.map((b) => ({
      value: b.bed_no,
      label: `${b.bed_no}${b.room_no ? " (রুম " + b.room_no + ")" : ""}${b.status && b.status !== "খালি" ? " • " + b.status : ""}`,
    }))];
  };

  // বেড বাছলে ঐ বেডের রুম স্বয়ংক্রিয়ভাবে বসে যায়
  const onFieldChange = (key, value) => {
    if (key === "bed_no") {
      const b = bedsRef.current.find((x) => String(x.bed_no) === String(value));
      if (b && b.room_no) return { room_no: b.room_no };
    }
    return null;
  };

  // বরাদ্দ সংরক্ষণের পর ঐ বেড "বরাদ্দকৃত" করা (সক্রিয় বরাদ্দ হলে)
  const onAfterSave = async (data) => {
    if (!data.bed_no || (data.status && data.status !== "সক্রিয়")) return;
    const list = await bedsApi.list();
    const b = list.find((x) => String(x.bed_no) === String(data.bed_no));
    if (b && b.status !== "বরাদ্দকৃত") await bedsApi.update(b.id, { ...b, status: "বরাদ্দকৃত" });
  };

  return (
    <CrudPage {...props} title="বেড বরাদ্দ" description="শিক্ষার্থীকে রুম ও বেড বরাদ্দ (আসল তালিকা থেকে)" api={bedAllocations} resourceKey="bed_allocations"
      codePrefix="ALC" addLabel="নতুন বরাদ্দ" emptyTitle="কোনো বরাদ্দ নেই"
      onFieldChange={onFieldChange} onAfterSave={onAfterSave}
      columns={[
        { key: "code", label: "আইডি", sortable: true },
        { key: "student", label: "শিক্ষার্থী", sortable: true },
        { key: "room_no", label: "রুম" },
        { key: "bed_no", label: "বেড" },
        { key: "date", label: "তারিখ", sortable: true },
        { key: "status", label: "অবস্থা", render: (r) => <Badge color={r.status === "সক্রিয়" ? "#2E7D32" : "#E53935"}>{r.status || "—"}</Badge>, exportValue: (r) => r.status },
      ]}
      fields={[
        { key: "student", label: "শিক্ষার্থী", type: "select", optionsFrom: studentOptions, required: true },
        { key: "bed_no", label: "বেড", type: "select", optionsFrom: bedOptions },
        { key: "room_no", label: "রুম", type: "select", optionsFrom: roomOptions },
        { key: "date", label: "বরাদ্দের তারিখ", type: "date" },
        { key: "status", label: "অবস্থা", type: "select", options: ["সক্রিয়", "সমাপ্ত"], default: "সক্রিয়" },
      ]}
    />
  );
}
