import CrudPage from "./CrudPage";
import { visitors } from "../../data";

export default function BoardingVisitor(props) {
  return (
    <CrudPage {...props} title="ভিজিটর রেজিস্টার" description="দর্শনার্থীদের হিসাব" api={visitors} resourceKey="visitors"
      codePrefix="VIS" addLabel="নতুন ভিজিটর" emptyTitle="কোনো ভিজিটর নেই"
      columns={[
        { key: "code", label: "আইডি", sortable: true },
        { key: "visitor_name", label: "নাম" },
        { key: "phone", label: "ফোন" },
        { key: "purpose", label: "উদ্দেশ্য" },
        { key: "meeting_with", label: "সাক্ষাৎ" },
        { key: "date", label: "তারিখ", sortable: true },
      ]}
      fields={[
        { key: "visitor_name", label: "দর্শনার্থীর নাম", required: true },
        { key: "phone", label: "ফোন নম্বর" },
        { key: "purpose", label: "উদ্দেশ্য" },
        { key: "meeting_with", label: "যার সাথে সাক্ষাৎ" },
        { key: "date", label: "তারিখ", type: "date" },
        { key: "in_time", label: "প্রবেশের সময়" },
        { key: "out_time", label: "বাহিরের সময়" },
      ]}
    />
  );
}
