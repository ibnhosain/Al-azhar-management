import CrudPage from "../boarding/CrudPage";
import { Badge } from "../../ui";
import { suppliers } from "../../data";

const ACTIVE_OPTS = [{ value: "1", label: "সক্রিয়" }, { value: "0", label: "নিষ্ক্রিয়" }];

export default function Suppliers(props) {
  return (
    <CrudPage {...props} title="সরবরাহকারী" description="বাজার/দোকান সরবরাহকারীর তালিকা (ক্রয়ে ব্যবহৃত হয়)"
      api={suppliers} resourceKey="supplier" addLabel="নতুন সরবরাহকারী" emptyTitle="কোনো সরবরাহকারী নেই"
      columns={[
        { key: "name", label: "নাম", sortable: true },
        { key: "phone", label: "ফোন", render: (r) => r.phone || "—" },
        { key: "address", label: "ঠিকানা", render: (r) => r.address || "—" },
        { key: "active", label: "অবস্থা", align: "center", render: (r) => r.active === "1" ? <Badge color="#2E7D32">সক্রিয়</Badge> : <Badge color="#90A4AE">নিষ্ক্রিয়</Badge>, exportValue: (r) => r.active === "1" ? "সক্রিয়" : "নিষ্ক্রিয়" },
      ]}
      fields={[
        { key: "name", label: "নাম", required: true },
        { key: "phone", label: "ফোন" },
        { key: "address", label: "ঠিকানা", full: true },
        { key: "active", label: "অবস্থা", type: "select", options: ACTIVE_OPTS, default: "1" },
        { key: "note", label: "নোট", type: "textarea", full: true },
      ]}
    />
  );
}
