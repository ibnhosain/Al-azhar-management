# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.


✅ ইতিমধ্যে প্রিমিয়াম (সম্পন্ন)
শিক্ষার্থী ব্যবস্থাপনা (কার্ড-গ্রিড + ভর্তি ফরম + তালিকা + বেতন)
শিক্ষক ব্যবস্থাপনা (স্ট্যাট + ফিল্টার + ছবি + edit)
বোর্ডিং ব্যবস্থাপনা (পূর্ণ মডিউল)
রান্নাঘর ও মিল (১৮টি স্ক্রিন)
ব্যাকআপ / অটো-আপডেট
🔨 প্রিমিয়াম করা বাকি (এখনো পুরোনো স্টাইল)
এগুলো কাজ করে, কিন্তু সাধারণ টেবিল-ডিজাইন — প্রিমিয়াম করা যায়:

#	পেজ	এখন কী অবস্থা
১	ড্যাশবোর্ড	সংখ্যাগুলো ডেমো/হার্ডকোড — আসল ডেটা থেকে হিসাব হয় না (সবচেয়ে বেশি দরকার)
২	হিসাব ও অর্থ বিভাগ	শুধু খরচ; আয়ের সারাংশ ডেমো — আসল রশিদ থেকে হিসাব করা বাকি
৩	রশিদ ব্যবস্থাপনা	পুরোনো টেবিল
৪	ডিজিটাল হাজিরা	পুরোনো স্টাইল
৫	একাডেমিক বিভাগ (ফলাফল/রুটিন)	পুরোনো স্টাইল
৬	প্রমোশন ও গ্র্যাজুয়েশন	পুরোনো স্টাইল
৭	প্রশাসনিক বিভাগ	পুরোনো স্টাইল
৮	স্পনসর ও অনুদান	পুরোনো স্টাইল
৯	ঋণ ও বকেয়া	পুরোনো স্টাইল
১০	এতিম স্পনসর বিভাগ	পুরোনো স্টাইল
১১	নোটিশ ও ঘোষণা	পুরোনো স্টাইল
১২	সিস্টেম সেটিংস	বেশিরভাগ কার্ড "শীঘ্রই" placeholder
🧩 এখনো বানানো হয়নি (placeholder — "পরবর্তী ধাপে যুক্ত হবে")
শিক্ষার্থী ব্যবস্থাপনার কার্ড-গ্রিডে:

রোল বিন্যাস
দাখেলা বিন্যাস
নিষ্ক্রিয় শিক্ষার্থী
শিক্ষার্থী আইডি কার্ড
দৈনিক বাড়ির কাজ
(হাজিরা কার্ড → বিদ্যমান ডিজিটাল হাজিরায় যায়।)

💡 আমার সুপারিশ (কোনটা আগে করা ভালো)
ড্যাশবোর্ড — আসল ডেটা দিয়ে প্রিমিয়াম (সবচেয়ে চোখে পড়ে, এখন ডেমো সংখ্যা)।
হিসাব ও অর্থ + রশিদ — একসাথে (বেতন আদায়ের টাকা এখানেই আসে, তাই আসল হিসাব দরকার)।
ডিজিটাল হাজিরা — প্রতিদিন ব্যবহার হয়।
একাডেমিক + প্রমোশন — পরীক্ষা/ফলাফল মৌসুমে দরকার।
স্পনসর / ঋণ / এতিম / নোটিশ — কম ব্যবহৃত, পরে।
placeholder কার্ডগুলো (রোল/দাখেলা বিন্যাস, আইডি কার্ড ইত্যাদি) — চাহিদা অনুযায়ী।
