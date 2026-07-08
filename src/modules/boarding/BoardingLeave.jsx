import CrudPage from "./CrudPage";
import { Badge } from "../../ui";
import { leaves, students as studentsApi } from "../../data";

const studentOptions = async () => {
  const list = await studentsApi.list();
  return [{ value: "", label: "— শিক্ষার্থী বাছুন —" }, ...list.map((s) => ({ value: s.name, label: `${s.name} (${s.code || s.roll || "—"})` }))];
};

export default function BoardingLeave(props) {
  return (
    <CrudPage {...props} title="ছুটি রেজিস্টার" description="আবাসিক শিক্ষার্থীদের ছুটির হিসাব" api={leaves} resourceKey="leaves"
      codePrefix="LV" addLabel="নতুন ছুটি" emptyTitle="কোনো ছুটি নেই"
      columns={[
        { key: "code", label: "আইডি", sortable: true },
        { key: "student", label: "শিক্ষার্থী" },
        { key: "from_date", label: "শুরু", sortable: true },
        { key: "to_date", label: "শেষ" },
        { key: "reason", label: "কারণ" },
        { key: "status", label: "অবস্থা", render: (r) => <Badge color={r.status === "অনুমোদিত" ? "#2E7D32" : r.status === "অপেক্ষমাণ" ? "#F59E0B" : "#E53935"}>{r.status || "—"}</Badge>, exportValue: (r) => r.status },
      ]}
      fields={[
        { key: "student", label: "শিক্ষার্থী", type: "select", optionsFrom: studentOptions, required: true },
        { key: "from_date", label: "শুরুর তারিখ", type: "date" },
        { key: "to_date", label: "শেষ তারিখ", type: "date" },
        { key: "reason", label: "কারণ", full: true },
        { key: "status", label: "অবস্থা", type: "select", options: ["অপেক্ষমাণ", "অনুমোদিত", "বাতিল"], default: "অপেক্ষমাণ" },
      ]}
    />
  );
}
